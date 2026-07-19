import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { config } from "../config.js";
import { requireAuth, type AuthedRequest } from "../lib/auth.js";
import { prisma } from "../lib/prisma.js";

export const projectsRouter = Router();

const FileKind = {
  IMAGE: "IMAGE",
  VIDEO: "VIDEO",
  MODEL: "MODEL",
  ARCHIVE: "ARCHIVE",
  DOCUMENT: "DOCUMENT",
  OTHER: "OTHER"
} as const;

const upload = multer({
  storage: multer.diskStorage({
    destination(_request, _file, callback) {
      fs.mkdir(config.uploadDir, { recursive: true }).then(
        () => callback(null, config.uploadDir),
        (error) => callback(error, config.uploadDir)
      );
    },
    filename(_request, file, callback) {
      const extension = path.extname(file.originalname).toLowerCase();
      callback(null, `${randomUUID()}${extension}`);
    }
  }),
  limits: {
    files: 12,
    fileSize: 250 * 1024 * 1024
  }
});

projectsRouter.get("/", async (request, response, next) => {
  try {
    const query = z.object({
      search: z.string().optional(),
      category: z.union([z.string(), z.array(z.string())]).optional()
    }).parse(request.query);
    const categories = query.category
      ? Array.isArray(query.category)
        ? query.category
        : [query.category]
      : [];

    const projects = await prisma.project.findMany({
      where: {
        status: "PUBLISHED",
        ...(query.search
          ? {
              OR: [
                { title: { contains: query.search } },
                { description: { contains: query.search } },
                { owner: { displayName: { contains: query.search } } }
              ]
            }
          : {}),
        ...(categories.length
          ? {
              categories: {
                some: {
                  category: {
                    slug: { in: categories }
                  }
                }
              }
            }
          : {})
      },
      include: {
        owner: true,
        files: { orderBy: { sortOrder: "asc" } },
        categories: { include: { category: true } },
        _count: { select: { likes: true, views: true } }
      },
      orderBy: { publishedAt: "desc" }
    });

    response.json({ projects });
  } catch (error) {
    next(error);
  }
});

projectsRouter.post("/", requireAuth, async (request, response, next) => {
  try {
    const input = z.object({
      title: z.string().min(2).max(140),
      description: z.string().min(1).max(5000),
      categoryIds: z.array(z.string()).default([])
    }).parse(request.body);
    const user = (request as AuthedRequest).user;
    const project = await prisma.project.create({
      data: {
        ownerId: user.id,
        title: input.title,
        description: input.description,
        categories: {
          create: input.categoryIds.map((categoryId) => ({ categoryId }))
        }
      }
    });

    response.status(201).json({ project });
  } catch (error) {
    next(error);
  }
});

projectsRouter.get("/:id", async (request, response, next) => {
  try {
    const project = await prisma.project.findUniqueOrThrow({
      where: { id: request.params.id },
      include: {
        owner: true,
        files: { orderBy: { sortOrder: "asc" } },
        categories: { include: { category: true } },
        _count: { select: { likes: true, views: true } }
      }
    });

    response.json({ project });
  } catch (error) {
    next(error);
  }
});

projectsRouter.post("/:id/submit", requireAuth, async (request, response, next) => {
  try {
    const project = await prisma.project.update({
      where: { id: request.params.id },
      data: { status: "PENDING" }
    });

    response.json({ project });
  } catch (error) {
    next(error);
  }
});

projectsRouter.post("/:id/like", requireAuth, async (request, response, next) => {
  try {
    const user = (request as AuthedRequest).user;
    await prisma.like.upsert({
      where: { userId_projectId: { userId: user.id, projectId: request.params.id } },
      update: {},
      create: { userId: user.id, projectId: request.params.id }
    });

    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

projectsRouter.delete("/:id/like", requireAuth, async (request, response, next) => {
  try {
    const user = (request as AuthedRequest).user;
    await prisma.like.deleteMany({
      where: { userId: user.id, projectId: request.params.id }
    });

    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

projectsRouter.post("/:id/files", requireAuth, upload.array("files", 12), async (request, response, next) => {
  try {
    const user = (request as AuthedRequest).user;
    const project = await prisma.project.findFirst({
      where: user.role === "ADMIN"
        ? { id: request.params.id }
        : { id: request.params.id, ownerId: user.id }
    });

    if (!project) {
      response.status(404).json({ error: "Project not found" });
      return;
    }

    const files = (request.files as Express.Multer.File[] | undefined) || [];
    const createdFiles = await prisma.$transaction(
      files.map((file, index) => prisma.projectFile.create({
        data: {
          projectId: project.id,
          uploaderId: user.id,
          storageKey: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          sizeBytes: BigInt(file.size),
          kind: inferFileKind(file),
          sortOrder: index
        }
      }))
    );

    response.status(201).json({ files: createdFiles });
  } catch (error) {
    next(error);
  }
});

projectsRouter.delete("/:id/files/:fileId", requireAuth, async (request, response, next) => {
  try {
    const user = (request as AuthedRequest).user;
    const file = await prisma.projectFile.findFirst({
      where: user.role === "ADMIN"
        ? { id: request.params.fileId, projectId: request.params.id }
        : { id: request.params.fileId, projectId: request.params.id, project: { ownerId: user.id } }
    });

    if (!file) {
      response.status(404).json({ error: "File not found" });
      return;
    }

    await prisma.projectFile.delete({ where: { id: file.id } });
    await fs.rm(path.join(config.uploadDir, file.storageKey), { force: true });
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

function inferFileKind(file: Express.Multer.File) {
  const mime = file.mimetype.toLowerCase();
  const extension = path.extname(file.originalname).toLowerCase();

  if (mime.startsWith("image/")) return FileKind.IMAGE;
  if (mime.startsWith("video/")) return FileKind.VIDEO;
  if ([".fbx", ".obj", ".blend", ".glb", ".gltf", ".stl", ".usd", ".usdz"].includes(extension)) return FileKind.MODEL;
  if ([".zip", ".rar", ".7z"].includes(extension)) return FileKind.ARCHIVE;
  if ([".pdf", ".txt", ".md", ".doc", ".docx"].includes(extension)) return FileKind.DOCUMENT;

  return FileKind.OTHER;
}
