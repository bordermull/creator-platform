import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { readSessionUser, requireAuth, type AuthedRequest } from "../lib/auth.js";

export const socialRouter = Router();
socialRouter.post("/:id/view", async (request, response, next) => {
  try {
    // Просмотр — открытие опубликованного проекта. Анонимные посещения тоже
    // считаются; личность гостя и дополнительные идентификаторы не собираются.
    const result = await prisma.project.updateMany({ where: { id: request.params.id, status: "PUBLISHED" }, data: { viewsCount: { increment: 1 } } });
    response.status(result.count ? 204 : 404).end();
  } catch (error) { next(error); }
});
socialRouter.get("/:id/activity", async (request, response, next) => {
  try {
    const project = await prisma.project.findFirst({ where: { id: request.params.id, status: "PUBLISHED" } });
    if (!project) { response.status(404).json({ error: "Project not found" }); return; }
    const session = readSessionUser(request);
    const key = session ? { userId: session.id, projectId: project.id } : null;
    const [comments, like, bookmark] = await Promise.all([
      prisma.comment.findMany({ where: { projectId: project.id }, include: { user: { select: { id: true, displayName: true } } }, orderBy: { createdAt: "asc" } }),
      key ? prisma.like.findUnique({ where: { userId_projectId: key } }) : null,
      key ? prisma.bookmark.findUnique({ where: { userId_projectId: key } }) : null
    ]);
    response.json({ comments, liked: Boolean(like), bookmarked: Boolean(bookmark) });
  } catch (error) { next(error); }
});

// Социальные действия разрешены только для опубликованных работ. Знание id
// не должно давать возможность комментировать или сохранять чужой черновик.
socialRouter.post("/:id/comments", requireAuth, async (request, response, next) => {
  try {
    const { body } = z.object({ body: z.string().trim().min(1).max(2000) }).parse(request.body);
    if (!await prisma.project.findFirst({ where: { id: request.params.id, status: "PUBLISHED" } })) { response.status(404).end(); return; }
    const comment = await prisma.comment.create({ data: { body, projectId: request.params.id, userId: (request as AuthedRequest).user.id } });
    response.status(201).json({ comment });
  } catch (error) { next(error); }
});
socialRouter.delete("/:id/comments/:commentId", requireAuth, async (request, response, next) => {
  try {
    const user = (request as AuthedRequest).user;
    const result = await prisma.comment.deleteMany({ where: { id: request.params.commentId, projectId: request.params.id, ...(user.role === "ADMIN" ? {} : { userId: user.id }) } });
    response.status(result.count ? 204 : 404).end();
  } catch (error) { next(error); }
});
socialRouter.post("/:id/bookmark", requireAuth, async (request, response, next) => {
  try {
    if (!await prisma.project.findFirst({ where: { id: request.params.id, status: "PUBLISHED" } })) { response.status(404).end(); return; }
    const key = { userId: (request as AuthedRequest).user.id, projectId: request.params.id };
    await prisma.bookmark.upsert({ where: { userId_projectId: key }, create: key, update: {} });
    response.status(204).end();
  } catch (error) { next(error); }
});
socialRouter.delete("/:id/bookmark", requireAuth, async (request, response, next) => {
  try {
    await prisma.bookmark.deleteMany({ where: { userId: (request as AuthedRequest).user.id, projectId: request.params.id } });
    response.status(204).end();
  } catch (error) { next(error); }
});
socialRouter.delete("/:id", requireAuth, async (request, response, next) => {
  try {
    const user = (request as AuthedRequest).user;
    // Удаление скрывает проект и предпросмотры, сохраняя оригиналы в архиве
    // для восстановления после случайного нажатия владельцем/администратором.
    const result = await prisma.project.updateMany({ where: { id: request.params.id, ...(user.role === "ADMIN" ? {} : { ownerId: user.id }) }, data: { status: "ARCHIVED" } });
    response.status(result.count ? 204 : 404).end();
  } catch (error) { next(error); }
});
