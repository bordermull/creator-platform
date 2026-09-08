import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";

// Это основной seed: один снимок и на PostgreSQL, и на SQLite.
// В отличие от дампа сервера, JSON не зависит от версии PostgreSQL,
// локальных владельцев БД и абсолютного пути установки на первом ПК.
const backend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const demo = path.join(backend, "demo");
const snapshot = JSON.parse(await fs.readFile(path.join(demo, "snapshot.json"), "utf8"));
if (snapshot.version !== 1) throw new Error("Неизвестная версия демонстрационного набора");
const { data, manifest } = snapshot;
const prisma = new PrismaClient();
const dates = (row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, value !== null && key.endsWith("At") ? new Date(value) : value]));
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
function contained(root, relative) {
  const result = path.resolve(root, relative);
  if (!result.startsWith(root + path.sep)) throw new Error("Недопустимый путь в демо-наборе");
  return result;
}

try {
  // Проверяем комплект ДО изменения БД. Отсутствующая картинка или неполный
  // git clone должны дать понятную ошибку, а не тихо создать сломанные карточки.
  const filesToCopy = [];
  const uploadRoot = path.resolve(backend, process.env.UPLOAD_DIR || "uploads");
  for (const file of data.files) {
    const isAsset = file.storageKey.startsWith("/assets/");
    const root = isAsset ? path.resolve(backend, "../frontend") : path.join(demo, "files");
    const source = contained(root, isAsset ? `.${file.storageKey}` : file.storageKey);
    const bytes = await fs.readFile(source);
    const entry = manifest.find((item) => item.fileId === file.id);
    if (!entry || bytes.length !== entry.sizeBytes || digest(bytes) !== entry.sha256) {
      throw new Error(`Демонстрационный файл отсутствует или повреждён: ${file.originalName}`);
    }
    if (!isAsset) filesToCopy.push({ source, target: contained(uploadRoot, file.storageKey), digest: entry.sha256 });
  }
  for (const file of filesToCopy) {
    await fs.mkdir(path.dirname(file.target), { recursive: true });
    try {
      const existing = await fs.readFile(file.target);
      // Существующий пользовательский файл никогда не заменяем. Совпадение
      // storageKey с другими байтами — конфликт, требующий ручного решения.
      if (digest(existing) !== file.digest) throw new Error(`Конфликт существующего файла: ${path.basename(file.target)}`);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      await fs.copyFile(file.source, file.target, fs.constants.COPYFILE_EXCL);
    }
  }
  const passwordHash = await bcrypt.hash(snapshot.demoPassword, 12);
  const created = { users: 0, projects: 0, files: 0 };
  await prisma.$transaction(async (tx) => {
    const users = new Map(), categories = new Map(), addedProjects = new Set();
    for (const row of data.users) {
      const existing = await tx.user.findUnique({ where: { email: row.email } });
      // Создаём пароль только для новых демо-аккаунтов. Повторный setup
      // не сбрасывает пароль, профиль и роль в уже используемой базе.
      const user = existing || await tx.user.create({ data: { ...dates(row), passwordHash } });
      users.set(row.id, user.id);
      if (!existing) created.users++;
    }
    for (const row of data.categories) {
      const existing = await tx.category.findUnique({ where: { group_slug: { group: row.group, slug: row.slug } } });
      const category = existing || await tx.category.create({ data: row });
      categories.set(row.id, category.id);
    }
    for (const row of data.projects) {
      if (await tx.project.findUnique({ where: { id: row.id } })) continue;
      await tx.project.create({ data: { ...dates(row), ownerId: users.get(row.ownerId) } });
      addedProjects.add(row.id); created.projects++;
    }
    for (const row of data.files) {
      // Не возвращаем удалённые пользователем файлы в уже существующий проект.
      if (!addedProjects.has(row.projectId)) continue;
      await tx.projectFile.create({ data: { ...dates(row), uploaderId: users.get(row.uploaderId), sizeBytes: BigInt(row.sizeBytes) } });
      created.files++;
    }
    for (const row of data.projectCategories) {
      if (addedProjects.has(row.projectId)) await tx.projectCategory.create({ data: { ...row, categoryId: categories.get(row.categoryId) } });
    }
    // Сохраняем связи снимка только при первом появлении соответствующих
    // участников/проектов: повторный seed не отменяет отписку или снятие лайка.
    for (const [model, rows] of [["like", data.likes], ["bookmark", data.bookmarks], ["comment", data.comments]]) {
      for (const row of rows) if (addedProjects.has(row.projectId)) await tx[model].create({ data: { ...dates(row), userId: users.get(row.userId) } });
    }
    for (const row of data.views) if (addedProjects.has(row.projectId)) await tx.projectView.create({ data: { ...dates(row), viewerId: row.viewerId ? users.get(row.viewerId) : null } });
    // У текущего снимка подписок нет. Проверка по timestamp/id не нужна:
    // наличие нового аккаунта достаточно, чтобы не восстанавливать отписки.
    if (created.users === data.users.length) for (const row of data.follows) await tx.follow.create({ data: { ...dates(row), followerId: users.get(row.followerId), followingId: users.get(row.followingId) } });
  }, { timeout: 30000 });
  console.log("Демонстрационная база готова. Добавлено:", created);
  console.log("Новые демо-аккаунты: password123. Существующие пароли не изменены.");
} finally {
  await prisma.$disconnect();
}
