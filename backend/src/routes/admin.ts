import { Router } from "express";
import { requireAdmin } from "../lib/auth.js";
import { prisma } from "../lib/prisma.js";

export const adminRouter = Router();

adminRouter.use(requireAdmin);

adminRouter.get("/projects", async (_request, response, next) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        owner: true,
        _count: { select: { likes: true, views: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    response.json({ projects });
  } catch (error) {
    next(error);
  }
});

adminRouter.post("/projects/:id/publish", async (request, response, next) => {
  try {
    const project = await prisma.project.update({
      where: { id: request.params.id },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date()
      }
    });

    response.json({ project });
  } catch (error) {
    next(error);
  }
});

adminRouter.post("/projects/:id/reject", async (request, response, next) => {
  try {
    const project = await prisma.project.update({
      where: { id: request.params.id },
      data: { status: "REJECTED" }
    });

    response.json({ project });
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/users", async (_request, response, next) => {
  try {
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
