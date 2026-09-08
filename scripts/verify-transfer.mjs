import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";

// Приёмочная проверка комплекта из Git index, без node_modules/.env/uploads
// исходной установки. Не входит в обычный setup: требует установленный Git,
// доступ к npm и право CREATEDB у локального PostgreSQL-пользователя.
// Собственные тестовые БД удаляются; исходная БД никогда не очищается.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const requireBackend = createRequire(path.join(root, "backend/package.json"));
const { parse } = requireBackend("dotenv");
const config = parse(await fs.readFile(path.join(root, "backend/.env")));
const { PrismaClient } = requireBackend("@prisma/client");
const sourceUrl = process.env.DATABASE_URL || config.DATABASE_URL;
const admin = new PrismaClient({ datasources: { db: { url: sourceUrl } } });
const database = `creatur_transfer_${randomUUID().replaceAll("-", "")}`;
let createdDatabase = false;
function run(command, args, cwd, env = process.env) {
  const result = spawnSync(command, args, { cwd, env, stdio: "inherit", windowsHide: true });
  if (result.error || result.status !== 0) throw new Error(`Ошибка проверки переноса: ${path.basename(command)}`);
}
try {
  const targetUrl = new URL(sourceUrl);
  targetUrl.pathname = `/${database}`; targetUrl.search = "?schema=public";
  await admin.$executeRawUnsafe(`CREATE DATABASE "${database}"`);
  createdDatabase = true;
  for (const mode of ["postgres", "sqlite"]) {
    // Пробелы в имени — намеренная проверка переносимости Windows-путей.
    const copy = await fs.mkdtemp(path.join(os.tmpdir(), `creatur transfer ${mode}-`));
    console.log(`\nЧистая копия ${mode}: ${copy}`);
    run("git", ["checkout-index", "--all", `--prefix=${copy.replaceAll("\\", "/")}/`], root);
    const env = { ...process.env, DATABASE_URL: targetUrl.toString(), SQLITE_DATABASE_URL: "file:./dev.db", UPLOAD_DIR: "uploads", SMTP_URL: "" };
    run(process.execPath, ["scripts/setup.mjs", "--no-provision", ...(mode === "sqlite" ? ["--sqlite"] : [])], copy, env);
    const backend = path.join(copy, "backend");
    const savedEnvironment = parse(await fs.readFile(path.join(backend, ".env")));
    if (savedEnvironment.DATABASE_URL !== targetUrl.toString()) throw new Error("Первичная настройка не сохранила выбранную тестовую БД");
    run(process.execPath, ["prisma/verify-demo.mjs"], backend, env);
    // Повторный импорт должен сохранять количества и файлы без дубликатов.
    run(process.execPath, ["prisma/seed-demo.mjs"], backend, env);
    run(process.execPath, ["prisma/verify-demo.mjs"], backend, env);
    run(process.execPath, [process.env.npm_execpath, "test"], backend, env);
    // PORT 3000/4173 должны быть свободны. Проверяем именно единый launcher,
    // а не только возможность импортировать Express в интеграционном тесте.
    run(process.execPath, ["scripts/start.mjs", "--check"], copy, env);
    console.log(`Проверка ${mode} пройдена. Копия оставлена в Temp для осмотра.`);
  }
  console.log("\nОба развёртывания из Git прошли проверки. Рабочая база не изменялась.");
} finally {
  // Имя генерируется только этим запуском. Дополнительная проверка не даст
  // случайно превратить очистку теста в DROP DATABASE рабочей creatur.
  if (createdDatabase && /^creatur_transfer_[a-f0-9]{32}$/.test(database)) {
    await admin.$executeRawUnsafe(`DROP DATABASE "${database}"`);
  }
  await admin.$disconnect();
}
