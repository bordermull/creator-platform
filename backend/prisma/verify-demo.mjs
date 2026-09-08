import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";

// Проверка развёртывания на чистой БД: данные должны совпадать с комплектом,
// а файлы — с контрольными суммами. Ничего не создаёт и не удаляет.
const backend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const snapshot = JSON.parse(await fs.readFile(path.join(backend, "demo/snapshot.json"), "utf8"));
const prisma = new PrismaClient();
try {
  for (const [key, model] of [["users", "user"], ["projects", "project"], ["categories", "category"], ["files", "projectFile"], ["projectCategories", "projectCategory"], ["follows", "follow"], ["bookmarks", "bookmark"], ["comments", "comment"], ["likes", "like"], ["views", "projectView"]]) {
    assert.equal(await prisma[model].count(), snapshot.data[key].length, `Количество ${key} отличается от снимка`);
  }
  for (const file of snapshot.data.files) {
    const saved = await prisma.projectFile.findUniqueOrThrow({ where: { id: file.id } });
    assert.equal(saved.storageKey, file.storageKey);
    const isAsset = saved.storageKey.startsWith("/assets/");
    const root = isAsset ? path.resolve(backend, "../frontend") : path.resolve(backend, process.env.UPLOAD_DIR || "uploads");
    const filename = path.resolve(root, isAsset ? `.${saved.storageKey}` : saved.storageKey);
    assert.ok(filename.startsWith(root + path.sep));
    const bytes = await fs.readFile(filename);
    const expected = snapshot.manifest.find((entry) => entry.fileId === file.id);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), expected.sha256);
    assert.equal(Number(saved.sizeBytes), bytes.length);
  }
  assert.equal(await prisma.user.count({ where: { role: "ADMIN" } }), 1);
  assert.equal(await prisma.passwordResetToken.count(), 0);
  console.log("Демо-комплект восстановлен полностью: таблицы, связи, один администратор и все 19 файлов проверены.");
} finally { await prisma.$disconnect(); }
