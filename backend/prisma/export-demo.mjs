import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

// Экспорт — отдельная сознательная операция, а не часть обычного запуска.
// Она публикует содержимое БД и загрузок как учебный набор. Не применять
// к базе с реальными пользователями: их согласие этим флагом не заменяется.
if (!process.argv.includes("--confirm-demo-data")) {
  throw new Error("Для экспорта только демонстрационных данных добавьте --confirm-demo-data");
}
const backend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const destination = path.join(backend, "demo");
const prisma = new PrismaClient();
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
function contained(root, relative) {
  const result = path.resolve(root, relative);
  if (!result.startsWith(root + path.sep)) throw new Error("Путь файла выходит за каталог проекта");
  return result;
}

try {
  // Снимок таблиц согласован транзакцией. Пароли и reset-токены намеренно
  // не экспортируются даже для демо: получатель создаёт свои сессии с нуля.
  const data = await prisma.$transaction(async (tx) => ({
    users: (await tx.user.findMany({ orderBy: { id: "asc" } })).map(({ passwordHash, ...user }) => user),
    categories: await tx.category.findMany({ orderBy: { id: "asc" } }),
    projects: await tx.project.findMany({ orderBy: { id: "asc" } }),
    files: await tx.projectFile.findMany({ orderBy: { id: "asc" } }),
    projectCategories: await tx.projectCategory.findMany({ orderBy: [{ projectId: "asc" }, { categoryId: "asc" }] }),
    likes: await tx.like.findMany({ orderBy: [{ userId: "asc" }, { projectId: "asc" }] }),
    follows: await tx.follow.findMany({ orderBy: [{ followerId: "asc" }, { followingId: "asc" }] }),
    bookmarks: await tx.bookmark.findMany({ orderBy: [{ userId: "asc" }, { projectId: "asc" }] }),
    comments: await tx.comment.findMany({ orderBy: { id: "asc" } }),
    views: (await tx.projectView.findMany({ orderBy: { id: "asc" } })).map((view) => ({ ...view, anonymousKey: null }))
  }), { isolationLevel: "RepeatableRead" });
  await fs.mkdir(path.join(destination, "files"), { recursive: true });
  const manifest = [];
  for (const file of data.files) {
    const isAsset = file.storageKey.startsWith("/assets/");
    const root = isAsset ? path.resolve(backend, "../frontend") : path.resolve(backend, process.env.UPLOAD_DIR || "uploads");
    const source = contained(root, isAsset ? `.${file.storageKey}` : file.storageKey);
    const bytes = await fs.readFile(source);
    // Старый seed ставил нулевой размер: в переносимой версии метаданные
    // соответствуют настоящим файлам. Исходная БД при этом не изменяется.
    file.sizeBytes = BigInt(bytes.length);
    if (!isAsset) {
      const target = contained(path.join(destination, "files"), file.storageKey);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.copyFile(source, target);
    }
    manifest.push({ fileId: file.id, sha256: digest(bytes), sizeBytes: bytes.length });
  }
  const snapshot = { version: 1, exportedAt: new Date().toISOString(), demoPassword: "password123", data, manifest };
  await fs.writeFile(path.join(destination, "snapshot.json"), JSON.stringify(snapshot, (_, value) => typeof value === "bigint" ? String(value) : value, 2) + "\n");
  console.log("Демо-набор экспортирован. Перед коммитом проверьте содержимое backend/demo.");
  console.log(Object.fromEntries(Object.entries(data).map(([key, rows]) => [key, rows.length])));
} finally {
  await prisma.$disconnect();
}
