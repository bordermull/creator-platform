import "dotenv/config";
import { DatabaseSync } from "node:sqlite";
import { PrismaClient } from "@prisma/client";
import path from "node:path";
import fs from "node:fs";

// Это однократный мост из старой локальной БД в PostgreSQL, а не второй
// источник данных приложения. SQLite открывается только для чтения.
// По умолчанию выполняется пробный импорт с откатом всей транзакции.
// Для сохранения результата после резервного копирования нужен --apply.
const sourcePath = path.resolve(process.argv.find((arg) => arg.startsWith("--source="))?.slice(9) || "prisma/dev.db");
const apply = process.argv.includes("--apply");
if (!/^postgres(?:ql)?:\/\//.test(process.env.DATABASE_URL || "")) {
  throw new Error("DATABASE_URL must point to PostgreSQL");
}
const source = new DatabaseSync(sourcePath, { readOnly: true });
const prisma = new PrismaClient();
const report = { mode: apply ? "apply" : "dry-run", created: {}, reused: {} };
const rollback = new Error("Dry-run completed; roll back");
const read = (table) => source.prepare(`SELECT * FROM "${table}"`).all();
const dates = (row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [
  key, value !== null && /(?:At)$/.test(key) ? new Date(value) : value
]));
const record = (model, created) => {
  const group = created ? report.created : report.reused;
  group[model] = (group[model] || 0) + 1;
};

try {
  const files = read("ProjectFile");
  // Проверяем наличие оригиналов до любых записей. Бинарные файлы остаются
  // в защищённом каталоге uploads; PostgreSQL хранит их метаданные и связи.
  for (const file of files) {
    const root = path.resolve(file.storageKey.startsWith("/assets/") ? "../frontend" : (process.env.UPLOAD_DIR || "uploads"));
    const filename = path.resolve(root, file.storageKey.startsWith("/assets/") ? `.${file.storageKey}` : file.storageKey);
    if (!filename.startsWith(`${root}${path.sep}`) || !fs.existsSync(filename)) {
      throw new Error(`Missing or invalid source file: ${file.id}`);
    }
  }

  await prisma.$transaction(async (tx) => {
    const users = new Map();
    const categories = new Map();
    // Email и пара (group, slug) — логические ключи: разные локальные БД
    // могли сгенерировать разные id для одного автора или одной категории.
    // Уже существующие записи PostgreSQL сохраняются без перезаписи профиля,
    // пароля, роли и статуса проекта; старые варианты остаются в бэкапе.
    for (const row of read("User")) {
      const existing = await tx.user.findUnique({ where: { email: row.email } });
      // Импорт старой тестовой базы не должен создавать дополнительных
      // администраторов. Главный администратор уже настроен в PostgreSQL.
      const user = existing || await tx.user.create({ data: { ...dates(row), role: "USER" } });
      users.set(row.id, user.id);
      record("user", !existing);
    }
    for (const row of read("Category")) {
      const existing = await tx.category.findUnique({ where: { group_slug: { group: row.group, slug: row.slug } } });
      const category = existing || await tx.category.create({ data: { ...row, isActive: Boolean(row.isActive) } });
      categories.set(row.id, category.id);
      record("category", !existing);
    }
    for (const row of read("Project")) {
      const existing = await tx.project.findUnique({ where: { id: row.id } });
      if (!existing) await tx.project.create({ data: { ...dates(row), ownerId: users.get(row.ownerId) } });
      record("project", !existing);
    }
    for (const row of files) {
      const existing = await tx.projectFile.findUnique({ where: { id: row.id } });
      if (!existing) await tx.projectFile.create({ data: { ...dates(row), uploaderId: users.get(row.uploaderId), sizeBytes: BigInt(row.sizeBytes) } });
      record("projectFile", !existing);
    }
    for (const row of read("ProjectCategory")) {
      const data = { projectId: row.projectId, categoryId: categories.get(row.categoryId) };
      const existing = await tx.projectCategory.findUnique({ where: { projectId_categoryId: data } });
      if (!existing) await tx.projectCategory.create({ data });
      record("projectCategory", !existing);
    }
    for (const row of read("Like")) {
      const key = { userId: users.get(row.userId), projectId: row.projectId };
      const existing = await tx.like.findUnique({ where: { userId_projectId: key } });
      if (!existing) await tx.like.create({ data: { ...dates(row), ...key } });
      record("like", !existing);
    }
    for (const row of read("ProjectView")) {
      const existing = await tx.projectView.findUnique({ where: { id: row.id } });
      if (!existing) await tx.projectView.create({ data: { ...dates(row), viewerId: row.viewerId ? users.get(row.viewerId) : null } });
      record("projectView", !existing);
    }
    for (const row of read("PasswordResetToken")) {
      const existing = await tx.passwordResetToken.findUnique({ where: { tokenHash: row.tokenHash } });
      if (!existing) await tx.passwordResetToken.create({ data: { ...dates(row), userId: users.get(row.userId) } });
      record("passwordResetToken", !existing);
    }
    // Один сбой откатывает всё: нельзя оставить проекты без авторов или
    // импортировать только часть связей. Пробный запуск проверяет те же операции.
    if (!apply) throw rollback;
  }, { timeout: 60000 });
} catch (error) {
  if (error !== rollback) throw error;
} finally {
  source.close();
  await prisma.$disconnect();
}
console.log(JSON.stringify(report, null, 2));
