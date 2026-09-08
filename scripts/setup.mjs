import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { createRequire } from "node:module";
import { createInterface } from "node:readline/promises";

// Все пути вычисляются от расположения этого файла. Репозиторий можно
// клонировать в любой каталог, включая каталог с пробелами, не меняя исходники.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const backend = path.join(root, "backend");
const sqlite = process.argv.includes("--sqlite");
const [major, minor] = process.versions.node.split(".").map(Number);
if (major < 22 || (major === 22 && minor < 14)) throw new Error("Нужен Node.js 22.14 или новее.");
function run(command, args, cwd = backend) {
  const result = spawnSync(command, args, { cwd, env: process.env, stdio: "inherit", windowsHide: true });
  if (result.error || result.status !== 0) throw new Error(`Не удалось выполнить ${path.basename(command)}. Смотрите сообщение выше.`);
}
function npm(args) {
  // npm_execpath задаётся при npm run. Запуск npm-cli через node избавляет
  // Windows от shell-кавычек и корректно работает с пробелами в пути проекта.
  if (!process.env.npm_execpath) throw new Error("Запустите подготовку командой npm run setup (или npm run setup:sqlite).");
  run(process.execPath, [process.env.npm_execpath, ...args]);
}
async function psqlPath() {
  if (process.env.PSQL_PATH) return process.env.PSQL_PATH;
  if (!spawnSync("psql", ["--version"], { windowsHide: true }).error) return "psql";
  if (process.platform === "win32") {
    const directory = path.join(process.env.ProgramFiles || "C:/Program Files", "PostgreSQL");
    const versions = (await fs.readdir(directory).catch(() => [])).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
    for (const version of versions) {
      const candidate = path.join(directory, version, "bin/psql.exe");
      if (await fs.stat(candidate).then(() => true, () => false)) return candidate;
    }
  }
  throw new Error("psql не найден. Установите PostgreSQL с Command Line Tools или задайте PSQL_PATH. Без PostgreSQL: npm run setup:sqlite.");
}

try {
  console.log("CREATUR: подготовка", sqlite ? "SQLite" : "PostgreSQL");
  console.log("Остановите запущенный backend перед повторной подготовкой этой же копии.");
  npm(["ci"]);
  const requireBackend = createRequire(path.join(backend, "package.json"));
  const dotenv = requireBackend("dotenv");
  const environment = path.join(backend, ".env");
  try {
    const initial = dotenv.parse(await fs.readFile(path.join(backend, ".env.example"), "utf8"));
    initial.JWT_SECRET = randomBytes(32).toString("hex");
    // Если установку явно направили в отдельную БД переменной окружения,
    // сохраняем её и для следующего npm start. Иначе повторный запуск мог бы
    // незаметно вернуться к стандартной базе creatur на том же компьютере.
    for (const key of Object.keys(initial)) if (process.env[key] !== undefined) initial[key] = process.env[key];
    await fs.writeFile(environment, Object.entries(initial).map(([key, value]) => `${key}=${JSON.stringify(value)}`).join("\n") + "\n", { flag: "wx" });
    console.log("Создан backend/.env с новым случайным секретом сессии.");
  } catch (error) { if (error.code !== "EEXIST") throw error; }
  // Переменные окружения имеют приоритет: это позволяет проверять развёртывание
  // на временной БД без редактирования локального .env пользователя.
  const values = dotenv.parse(await fs.readFile(environment));
  for (const [key, value] of Object.entries(values)) if (process.env[key] === undefined) process.env[key] = value;
  if (sqlite) {
    npm(["run", "prisma:push:sqlite"]);
  } else {
    npm(["run", "prisma:generate:postgres"]);
    const { PrismaClient } = requireBackend("@prisma/client");
    async function connected() {
      const client = new PrismaClient();
      try { await client.$queryRawUnsafe("SELECT 1"); return true; }
      catch { return false; }
      finally { await client.$disconnect(); }
    }
    if (!await connected()) {
      const url = new URL(process.env.DATABASE_URL);
      const isStandard = ["localhost", "127.0.0.1"].includes(url.hostname) && url.username === "creatur" && decodeURIComponent(url.password) === "creatur" && url.pathname === "/creatur";
      if (!isStandard || process.argv.includes("--no-provision") || !process.stdin.isTTY) {
        throw new Error("Нет подключения к PostgreSQL. Проверьте службу и DATABASE_URL в backend/.env. Подготовка существующей БД ничего не удаляет.");
      }
      const prompt = createInterface({ input: process.stdin, output: process.stdout });
      let answer, administrator;
      try {
        answer = await prompt.question("Создать локальную демо-базу creatur и пользователя creatur? [Y/n] ");
        if (!/^n|^н/i.test(answer.trim())) administrator = (await prompt.question("Администратор PostgreSQL [postgres]: ")).trim() || "postgres";
      } finally { prompt.close(); }
      if (!administrator) throw new Error("Создайте базу по README и повторите npm run setup.");
      const executable = await psqlPath();
      console.log("Введите пароль администратора в запросе psql. Он не сохраняется в проекте.");
      run(executable, ["-X", "-W", "-h", url.hostname, "-p", url.port || "5432", "-U", administrator, "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-f", path.join(root, "scripts/create-database.sql")]);
      if (!await connected()) throw new Error("База пока недоступна. Проверьте backend/.env; существующие пароли скрипт не заменяет.");
    }
    // Клиент уже загружен в Windows-процесс: повторная генерация могла бы
    // пытаться заменить используемую DLL. Схему применяем без генерации.
    run(process.execPath, [path.join(backend, "node_modules/prisma/build/index.js"), "db", "push", "--schema", "prisma/schema.prisma", "--skip-generate"]);
  }
  npm(["run", "prisma:seed"]);
  npm(["run", "build"]);
  console.log("\nГотово! Запуск обоих приложений: npm start");
  console.log("Сайт: http://127.0.0.1:4173 | Админ: admin@creatur.local / password123");
  console.log("Письма по умолчанию локальные: backend/.local-mail.");
} catch (error) {
  console.error("\nПодготовка остановлена:", error.message);
  process.exitCode = 1;
}
