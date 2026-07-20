import { Router } from "express";
import { z } from "zod";
import { requireAdmin } from "../lib/auth.js";
import { prisma } from "../lib/prisma.js";
import { toProjectDto } from "../lib/project-dto.js";

export const adminRouter = Router();

adminRouter.use(requireAdmin);

adminRouter.get("/projects", async (request, response, next) => {
  try {
    // The first moderation screen defaults to PENDING because that is the daily
    // admin queue. ALL is still available for debugging and future back-office
    // views without adding another endpoint.
    const query = z.object({
      status: z.enum(["DRAFT", "PENDING", "PUBLISHED", "REJECTED", "ALL"]).default("PENDING")
    }).parse(request.query);
    const projects = await prisma.project.findMany({
      // Admin UI should still consume the same frontend-friendly DTO as the
      // public catalog. That prevents password hashes or Prisma relation shapes
      // from leaking into browser code just because the user is an admin.
      where: query.status === "ALL" ? {} : { status: query.status },
      include: adminProjectInclude,
      orderBy: { createdAt: "desc" }
    });

    response.json({ projects: projects.map(toProjectDto) });
  } catch (error) {
    next(error);
  }
});

adminRouter.post("/projects/:id/publish", async (request, response, next) => {
  try {
    // Publishing is the only transition that sets publishedAt. Rejected and
    // pending projects keep publishedAt null so catalog ordering stays clean.
    const project = await prisma.project.update({
      where: { id: request.params.id },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date()
      },
      include: adminProjectInclude
    });

    response.json({ project: toProjectDto(project) });
  } catch (error) {
    next(error);
  }
});

adminRouter.post("/projects/:id/reject", async (request, response, next) => {
  try {
    // Rejection is deliberately minimal in this MVP. A future moderation note
    // column can be added here without changing the basic route shape.
    const project = await prisma.project.update({
      where: { id: request.params.id },
      data: { status: "REJECTED" },
      include: adminProjectInclude
    });

    response.json({ project: toProjectDto(project) });
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/users", async (_request, response, next) => {
  try {
    // User admin is read-only for now. The select list is explicit so password
    // hashes and auth internals never leave the server by accident.
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        createdAt: true
      }
    });

    response.json({ users });
  } catch (error) {
    next(error);
  }
});

const adminProjectInclude = {
  // This include mirrors the public project include because both routes return
  // the same DTO. Keeping it explicit here makes admin.ts self-contained and
  // easy to adjust when moderation needs more project context.
  owner: {
    select: {
      id: true,
      displayName: true,
      avatarFileId: true
    }
  },
  files: { orderBy: { sortOrder: "asc" as const } },
  categories: { include: { category: true } },
  _count: { select: { likes: true, views: true } }
} as const;
