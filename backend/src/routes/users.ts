import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { readSessionUser, requireAuth, type AuthedRequest } from "../lib/auth.js";
import { projectInclude } from "./projects.js";
import { toProjectDto } from "../lib/project-dto.js";

export const usersRouter = Router();
// Для небольшого учебного проекта аватар и обложка сохраняются непосредственно
// в PostgreSQL как ограниченные по размеру data URL. Принимаем только растровые
// форматы: загруженный HTML/SVG не должен исполняться в контексте сайта.
const image = z.string().max(2800000).regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/).nullable().optional();
const profileInput = z.object({
  displayName: z.string().trim().min(2).max(80),
  bio: z.string().max(2000).optional(),
  specialty: z.string().max(160).optional(),
  contact: z.string().max(200).optional(),
  location: z.string().max(100).optional(),
  avatarFileId: image,
  coverUrl: image
});
const publicFields = {
  id: true, displayName: true, bio: true, specialty: true, contact: true,
  location: true, avatarFileId: true, coverUrl: true, createdAt: true,
  _count: { select: { followers: true } }
} as const;

usersRouter.get("/me/following", requireAuth, async (request, response, next) => {
  try {
    const rows = await prisma.follow.findMany({ where: { followerId: (request as AuthedRequest).user.id }, include: { following: { select: publicFields } }, orderBy: { createdAt: "desc" } });
    response.json({ users: rows.map((row) => row.following) });
  } catch (error) { next(error); }
});

usersRouter.get("/me/bookmarks", requireAuth, async (request, response, next) => {
  try {
    // Даже ранее сохранённая закладка не открывает работу после её снятия
    // с публикации. Видимость проверяется заново при каждом чтении.
    const rows = await prisma.bookmark.findMany({ where: { userId: (request as AuthedRequest).user.id, project: { status: "PUBLISHED" } }, include: { project: { include: projectInclude } }, orderBy: { createdAt: "desc" } });
    response.json({ projects: rows.map((row) => toProjectDto(row.project)) });
  } catch (error) { next(error); }
});

usersRouter.get("/:id", async (request, response, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: request.params.id }, select: publicFields });
    if (!user) { response.status(404).json({ error: "User not found" }); return; }
    const session = readSessionUser(request);
    const [projects, follow] = await Promise.all([
      prisma.project.findMany({ where: { ownerId: user.id, status: "PUBLISHED" }, include: projectInclude, orderBy: { publishedAt: "desc" } }),
      session ? prisma.follow.findUnique({ where: { followerId_followingId: { followerId: session.id, followingId: user.id } } }) : null
    ]);
    response.json({ user: { ...user, isFollowing: Boolean(follow) }, projects: projects.map(toProjectDto) });
  } catch (error) { next(error); }
});

usersRouter.patch("/:id", requireAuth, async (request, response, next) => {
  try {
    const session = (request as AuthedRequest).user;
    if (session.id !== request.params.id && session.role !== "ADMIN") { response.status(403).json({ error: "Forbidden" }); return; }
    // Белый список полей не позволяет повысить роль, заменить пароль или
    // подтвердить email через форму редактирования публичного профиля.
    const user = await prisma.user.update({ where: { id: request.params.id }, data: profileInput.parse(request.body), select: publicFields });
    response.json({ user });
  } catch (error) { next(error); }
});

usersRouter.post("/:id/follow", requireAuth, async (request, response, next) => {
  try {
    const followerId = (request as AuthedRequest).user.id;
    const followingId = request.params.id;
    if (followerId === followingId) { response.status(400).json({ error: "Cannot follow yourself" }); return; }
    if (!await prisma.user.findUnique({ where: { id: followingId } })) { response.status(404).json({ error: "User not found" }); return; }
    await prisma.follow.upsert({ where: { followerId_followingId: { followerId, followingId } }, update: {}, create: { followerId, followingId } });
    response.status(204).end();
  } catch (error) { next(error); }
});

usersRouter.delete("/:id/follow", requireAuth, async (request, response, next) => {
  try {
    await prisma.follow.deleteMany({ where: { followerId: (request as AuthedRequest).user.id, followingId: request.params.id } });
    response.status(204).end();
  } catch (error) { next(error); }
});
