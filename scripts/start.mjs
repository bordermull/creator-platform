import path from "node:path";
import fs from "node:fs/promises";
import net from "node:net";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

// Один терминал управляет двумя дочерними процессами. Они не остаются
// бесконтрольно работать после Ctrl+C или ошибки одного из приложений.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const backend = path.join(root, "backend");
const children = [];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true; process.exitCode = code;
  for (const child of children) if (child.exitCode === null) child.kill();
}
async function free(port) {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once("error", () => reject(new Error(`Порт ${port} занят. Остановите предыдущий запуск CREATUR или другую программу.`)));
    server.listen(port, "127.0.0.1", resolve);
  });
  await new Promise((resolve) => server.close(resolve));
}
try {
  await fs.access(path.join(backend, "dist/src/server.js"));
  const requireBackend = createRequire(path.join(backend, "package.json"));
  const { parse } = requireBackend("dotenv");
  const values = parse(await fs.readFile(path.join(backend, ".env")));
  const environment = { ...values, ...process.env };
  if (Number(environment.PORT || 3000) !== 3000 || environment.FRONTEND_ORIGIN !== "http://127.0.0.1:4173") {
    throw new Error("Единый запуск использует backend:3000 и frontend:4173. Верните PORT/FRONTEND_ORIGIN к значениям .env.example.");
  }
  await free(3000); await free(4173);
  for (const [cwd, entry, port] of [[backend, "dist/src/server.js", "3000"], [path.join(root, "frontend"), "tools/static-server.js", "4173"]]) {
    const child = spawn(process.execPath, [entry], { cwd, env: { ...environment, PORT: port }, stdio: "inherit", windowsHide: true });
    children.push(child);
    child.once("error", (error) => { console.error(error.message); stop(1); });
    child.once("exit", (code) => { if (!stopping) stop(code || 1); });
  }
  process.once("SIGINT", () => stop());
  process.once("SIGTERM", () => stop());
  // Ждём настоящее HTTP-подтверждение, а не объявляем успех сразу после spawn.
  for (let attempt = 0; attempt < 30; attempt++) {
    if (stopping) break;
    try {
      const responses = await Promise.all(["http://127.0.0.1:3000/health", "http://127.0.0.1:3000/api/categories", "http://127.0.0.1:4173"].map((url) => fetch(url, { signal: AbortSignal.timeout(2000) })));
      if (responses.every((response) => response.ok)) {
        console.log("\nCREATUR готов: http://127.0.0.1:4173\nОстановка обоих процессов: Ctrl+C.");
        // Автопроверка запуска использует тот же путь готовности, но сама
        // завершает только свои дочерние процессы, не оставляя занятые порты.
        if (process.argv.includes("--check")) stop();
        break;
      }
    } catch { /* Сервер ещё загружается: это ожидаемое кратковременное состояние. */ }
    if (attempt === 29) throw new Error("Серверы не подтвердили готовность. Проверьте PostgreSQL и сообщения выше.");
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
} catch (error) {
  console.error(error.code === "ENOENT" ? "Сначала выполните npm run setup (или npm run setup:sqlite)." : error.message);
  stop(1);
}
