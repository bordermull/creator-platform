import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";

// Настоящий HTTP + выбранная БД (основной режим — PostgreSQL).
// Тест создаёт свои временные учётные записи,
// затем удаляет только их и связанные тестовые файлы. Данные автора не меняет.
test("profiles, moderation, privacy, social features and password reset", async () => {
  const mailDir = await fs.mkdtemp(path.join(os.tmpdir(), "creatur-check-"));
  process.env.LOCAL_MAIL_DIR = mailDir;
  process.env.SMTP_URL = "";
  const { app } = await import("../dist/src/app.js");
  const { prisma } = await import("../dist/src/lib/prisma.js");
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const ids = [];
  const tag = crypto.randomUUID();
  async function call(route, status = 200, cookie, method = "GET", body) {
    const multipart = body instanceof FormData;
    const response = await fetch(base + route, { method, headers: { ...(!multipart && body ? { "Content-Type": "application/json" } : {}), ...(cookie ? { Cookie: cookie } : {}) }, body: multipart ? body : body ? JSON.stringify(body) : undefined });
    const text = await response.text();
    assert.equal(response.status, status, `${method} ${route}: ${text.slice(0, 300)}`);
    return { body: text.startsWith("{") ? JSON.parse(text) : text, cookie: response.headers.get("set-cookie")?.split(";")[0] };
  }
  async function register(suffix) {
    const email = `test-${tag}-${suffix}@example.invalid`;
    const result = await call("/api/auth/register", 201, null, "POST", { email, password: "TestPassword123!", displayName: `Проверка ${suffix}` });
    ids.push(result.body.user.id);
    assert.equal(result.body.user.role, "USER");
    return { ...result, id: result.body.user.id, email };
  }
  try {
    const owner = await register("owner"), stranger = await register("stranger"), admin = await register("admin");
    await prisma.user.update({ where: { id: admin.id }, data: { role: "ADMIN" } });
    admin.cookie = (await call("/api/auth/login", 200, null, "POST", { email: admin.email, password: "TestPassword123!" })).cookie;
    await call("/api/auth/register", 409, null, "POST", { email: owner.email, password: "TestPassword123!", displayName: "Повтор" });
    await call("/api/auth/login", 401, null, "POST", { email: owner.email, password: "incorrect" });
    await call("/api/admin/users", 403, owner.cookie);
    const image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=";
    await call(`/api/users/${owner.id}`, 200, owner.cookie, "PATCH", { displayName: "Сохранённый автор", bio: "Описание", specialty: "3D", location: "Самара", avatarFileId: image, coverUrl: image });
    const profile = (await call(`/api/users/${owner.id}`)).body.user;
    assert.equal(profile.displayName, "Сохранённый автор"); assert.equal(profile.avatarFileId, image); assert.equal(profile.passwordHash, undefined);
    await call(`/api/users/${owner.id}`, 403, stranger.cookie, "PATCH", { displayName: "Чужая правка" });
    await call(`/api/users/${owner.id}`, 200, admin.cookie, "PATCH", { displayName: "Правка модератора" });
    await call(`/api/users/${owner.id}/follow`, 204, stranger.cookie, "POST");
    await call(`/api/users/${owner.id}/follow`, 204, stranger.cookie, "POST");
    assert.equal((await call("/api/users/me/following", 200, stranger.cookie)).body.users.length, 1);
    const project = (await call("/api/projects", 201, owner.cookie, "POST", { title: "Проверка публикации", description: "Приватная работа", categorySlugs: ["3d", "blender"] })).body.project;
    const url = `/api/projects/${project.id}`;
    await call(`${url}/submit`, 400, owner.cookie, "POST");
    await call(url, 404); await call(url, 404, stranger.cookie);
    await call(`${url}/like`, 404, stranger.cookie, "POST");
    const form = new FormData(); form.append("files", new Blob([Buffer.from(image.split(",")[1], "base64")], { type: "image/png" }), "preview.png");
    const file = (await call(`${url}/files`, 201, owner.cookie, "POST", form)).body.files[0];
    await call(`${url}/files/${file.id}/preview`, 200, owner.cookie);
    await call(`${url}/files/${file.id}/preview`, 404);
    await call(`${url}/submit`, 200, owner.cookie, "POST");
    await call(url, 409, owner.cookie, "PATCH", { title: "Недопустимая правка", description: "Тест" });
    await call(`/api/admin/projects/${project.id}/reject`, 200, admin.cookie, "POST", { reason: "Исправьте описание" });
    await call(url, 200, owner.cookie, "PATCH", { title: "Исправленный проект", description: "Исправлено" });
    await call(`${url}/submit`, 200, owner.cookie, "POST");
    assert.equal((await call(url, 200, owner.cookie)).body.project.moderationNote, null);
    await call(`/api/admin/projects/${project.id}/publish`, 200, admin.cookie, "POST");
    await call(url); await call(`${url}/files/${file.id}/preview`);
    const beforeViews = (await call(url)).body.project.views;
    await call(`${url}/view`, 204, null, "POST");
    assert.equal((await call(url)).body.project.views, beforeViews + 1);
    await call(`${url}/like`, 204, stranger.cookie, "POST");
    await call(`${url}/bookmark`, 204, stranger.cookie, "POST");
    const comment = (await call(`${url}/comments`, 201, stranger.cookie, "POST", { body: "<script>не исполнять</script>" })).body.comment;
    const activity = (await call(`${url}/activity`, 200, stranger.cookie)).body;
    assert.equal(activity.liked, true); assert.equal(activity.bookmarked, true); assert.equal(activity.comments.length, 1);
    assert.equal((await call("/api/users/me/bookmarks", 200, stranger.cookie)).body.projects.length, 1);
    await call(`${url}/comments/${comment.id}`, 404, owner.cookie, "DELETE");
    await call(`${url}/comments/${comment.id}`, 204, admin.cookie, "DELETE");
    await call(`${url}/like`, 204, stranger.cookie, "DELETE");
    assert.equal((await call(`${url}/activity`, 200, stranger.cookie)).body.liked, false);
    await call(url, 404, stranger.cookie, "DELETE"); await call(url, 204, admin.cookie, "DELETE");
    await call(url, 404); await call(`${url}/files/${file.id}/preview`, 404, owner.cookie);
    assert.equal((await call("/api/users/me/bookmarks", 200, stranger.cookie)).body.projects.length, 0);
    await call("/api/auth/password-reset/request", 204, null, "POST", { email: owner.email });
    const mails = await Promise.all((await fs.readdir(mailDir)).map(async (name) => JSON.parse(await fs.readFile(path.join(mailDir, name), "utf8"))));
    const reset = mails.find((mail) => mail.subject.includes("Сброс")); assert.ok(reset);
    const token = reset.text.match(/reset-password\/([a-f0-9]+)/)[1];
    await call("/api/auth/password-reset/confirm", 204, null, "POST", { token, password: "ChangedPassword123!" });
    await call("/api/auth/password-reset/confirm", 400, null, "POST", { token, password: "ChangedPassword123!" });
    await call("/api/auth/login", 200, null, "POST", { email: owner.email, password: "ChangedPassword123!" });
  } finally {
    const files = await prisma.projectFile.findMany({ where: { uploaderId: { in: ids } } });
    for (const file of files) { const root = path.resolve("uploads"), name = path.resolve(root, file.storageKey); assert.ok(name.startsWith(root + path.sep)); await fs.rm(name, { force: true }); }
    await prisma.user.deleteMany({ where: { id: { in: ids } } }); await prisma.$disconnect();
    await new Promise((resolve) => server.close(resolve));
    assert.ok(mailDir.startsWith(path.resolve(os.tmpdir()) + path.sep + "creatur-check-"));
    await fs.rm(mailDir, { recursive: true, force: true });
  }
});
