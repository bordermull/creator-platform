import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { config } from "../config.js";
import { readSessionUser, requireAuth, type AuthedRequest, type SessionUser } from "../lib/auth.js";
import { prisma } from "../lib/prisma.js";
import { toProjectDto } from "../lib/project-dto.js";

export const projectsRouter = Router();

// The SQLite Prisma schema cannot use the PostgreSQL enum definitions, so file
// kinds are kept as shared string constants that work with both local modes.
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
      // Upload storage is local for now. S3-compatible storage can replace this
      // later without changing the public API contract.
      fs.mkdir(config.uploadDir, { recursive: true }).then(
        () => callback(null, config.uploadDir),
        (error) => callback(error, config.uploadDir)
      );
    },
    filename(_request, file, callback) {
      // Preserve the extension for easier local inspection, but replace the
      // original base name so different users cannot overwrite each other.
      const extension = path.extname(file.originalname).toLowerCase();
      callback(null, `${randomUUID()}${extension}`);
    }
  }),
  limits: {
    // These limits keep the MVP useful for creative work while preventing an
    // accidental unlimited upload from exhausting local disk space.
    files: 12,
    fileSize: 250 * 1024 * 1024
  }
});

const projectMutationSchema = z.object({
  title: z.string().min(2).max(140),
  description: z.string().min(1).max(5000),
  categoryIds: z.array(z.string()).default([]),
  categorySlugs: z.array(z.string()).default([])
});
type ProjectMutationInput = z.infer<typeof projectMutationSchema>;

projectsRouter.get("/", async (request, response, next) => {
  try {
    const query = z.object({
      search: z.string().optional(),
      category: z.union([z.string(), z.array(z.string())]).optional()
    }).parse(request.query);

    // Query strings can arrive as ?category=a or repeated as ?category=a&category=b.
    // Normalizing to an array keeps the Prisma filter below simple.
    const categories = query.category
      ? Array.isArray(query.category)
        ? query.category
        : [query.category]
      : [];

    const categorySlugs = categories.map(normalizeCategoryFilter).filter(Boolean);
    const categoryFilters = await buildGroupedCategoryFilters(categorySlugs);
    const projects = await prisma.project.findMany({
      where: {
        // Public catalog returns only published projects. Drafts and moderation
        // states are reserved for owners and admins.
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
        ...categoryFilters
      },
      include: projectInclude,
      orderBy: { publishedAt: "desc" }
    });

    response.json({ projects: projects.map(toProjectDto) });
  } catch (error) {
    next(error);
  }
});

projectsRouter.post("/", requireAuth, async (request, response, next) => {
  try {
    const input = projectMutationSchema.parse(request.body);
    const user = (request as AuthedRequest).user;
    const categoryIds = await resolveCategoryIds(input);
    const project = await prisma.project.create({
      data: {
        ownerId: user.id,
        title: input.title,
        description: input.description,
        categories: {
          create: categoryIds.map((categoryId) => ({ categoryId }))
        }
      }
    });

    const createdProject = await prisma.project.findUniqueOrThrow({
      where: { id: project.id },
      include: projectInclude
    });

    response.status(201).json({ project: toProjectDto(createdProject) });
  } catch (error) {
    next(error);
  }
});

projectsRouter.get("/me", requireAuth, async (request, response, next) => {
  try {
    const user = (request as AuthedRequest).user;
    const projects = await prisma.project.findMany({
      // This route powers the personal account page, so it intentionally returns
      // every project owned by the current user: DRAFT, PENDING, PUBLISHED and
      // REJECTED. The public catalog route above remains PUBLISHED-only.
      where: { ownerId: user.id },
      include: projectInclude,
      orderBy: { createdAt: "desc" }
    });

    response.json({ projects: projects.map(toProjectDto) });
  } catch (error) {
    next(error);
  }
});

projectsRouter.patch("/:id", requireAuth, async (request, response, next) => {
  try {
    const input = projectMutationSchema.parse(request.body);
    const user = (request as AuthedRequest).user;
    const existingProject = await findEditableProjectForUser(request.params.id, user);

    if (!existingProject) {
      response.status(404).json({ error: "Project not found" });
      return;
    }

    if (!canEditProjectContent(existingProject)) {
      response.status(409).json({ error: "Only DRAFT and REJECTED projects can be edited" });
      return;
    }

    const categoryIds = await resolveCategoryIds(input);

    // Category links are replaced as one atomic edit. That keeps the UI simple:
    // the form sends the full selected tag set, not a fragile add/remove diff.
    await prisma.$transaction([
      prisma.project.update({
        where: { id: existingProject.id },
        data: {
          title: input.title,
          description: input.description
        }
      }),
      prisma.projectCategory.deleteMany({ where: { projectId: existingProject.id } }),
      ...categoryIds.map((categoryId) => prisma.projectCategory.create({
        data: { projectId: existingProject.id, categoryId }
      }))
    ]);

    const project = await prisma.project.findUniqueOrThrow({
      where: { id: existingProject.id },
      include: projectInclude
    });

    response.json({ project: toProjectDto(project) });
  } catch (error) {
    next(error);
  }
});

projectsRouter.get("/:id", async (request, response, next) => {
  try {
    const project = await findViewableProject(request.params.id, readSessionUser(request));

    if (!project) {
      // Return 404 instead of 403 for private project states. This avoids
      // confirming that a draft or rejected project id exists to strangers.
      response.status(404).json({ error: "Project not found" });
      return;
    }

    response.json({ project: toProjectDto(project) });
  } catch (error) {
    next(error);
  }
});

projectsRouter.get("/:id/files/:fileId/preview", async (request, response, next) => {
  try {
    const sessionUser = readSessionUser(request);
    const file = await prisma.projectFile.findFirst({
      where: {
        id: request.params.fileId,
        projectId: request.params.id
      },
      include: {
        project: {
          select: {
            id: true,
            ownerId: true,
            status: true
          }
        }
      }
    });

    if (!file || !canViewProject(file.project, sessionUser)) {
      response.status(404).json({ error: "File not found" });
      return;
    }

    // The MVP deliberately supports browser preview only. GLB/GLTF are allowed
    // because model-viewer can render them directly in the browser; heavier 3D
    // source formats stay listed as files until we add conversion/processing.
    if (!isPreviewableFile(file)) {
      response.status(415).json({ error: "Preview is not available for this file type" });
      return;
    }

    if (file.storageKey.startsWith("/assets")) {
      response.redirect(`${config.frontendOrigin}${file.storageKey}`);
      return;
    }

    const uploadRoot = path.resolve(config.uploadDir);
    const filePath = path.resolve(uploadRoot, file.storageKey);

    if (!filePath.startsWith(`${uploadRoot}${path.sep}`)) {
      response.status(400).json({ error: "Invalid file path" });
      return;
    }

    response.setHeader("Content-Type", contentTypeForPreview(file));
    response.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(file.originalName)}"`);
    response.setHeader("Cache-Control", "private, no-store");
    response.sendFile(filePath);
  } catch (error) {
    next(error);
  }
});

projectsRouter.post("/:id/submit", requireAuth, async (request, response, next) => {
  try {
    const user = (request as AuthedRequest).user;
    // Submit is owner/admin only. A normal logged-in user must not be able to
    // move another author's draft into the moderation queue.
    const existingProject = await prisma.project.findFirst({
      where: user.role === "ADMIN"
        ? { id: request.params.id }
        : { id: request.params.id, ownerId: user.id }
    });

    if (!existingProject) {
      response.status(404).json({ error: "Project not found" });
      return;
    }

    if (!canEditProjectContent(existingProject)) {
      response.status(409).json({ error: "Only DRAFT and REJECTED projects can be submitted" });
      return;
    }

    const project = await prisma.project.update({
      where: { id: request.params.id },
      data: {
        status: "PENDING",
        // A resubmitted project should start a fresh moderation pass. Keeping
        // the previous rejection reason would confuse both the author and admin.
        moderationNote: null
      }
    });

    const submittedProject = await prisma.project.findUniqueOrThrow({
      where: { id: project.id },
      include: projectInclude
    });

    response.json({ project: toProjectDto(submittedProject) });
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
  let filesPersisted = false;

  try {
    const user = (request as AuthedRequest).user;
    const files = (request.files as Express.Multer.File[] | undefined) || [];

    // Users may upload only to editable projects. A submitted or published
    // project is frozen so files cannot change while moderation/public viewers
    // may be looking at it.
    const project = await findEditableProjectForUser(request.params.id, user);

    if (!project) {
      await cleanupUploadedFiles(files);
      response.status(404).json({ error: "Project not found" });
      return;
    }

    if (!canEditProjectContent(project)) {
      await cleanupUploadedFiles(files);
      response.status(409).json({ error: "Only DRAFT and REJECTED projects can be edited" });
      return;
    }

    const sortOrderAggregate = await prisma.projectFile.aggregate({
      where: { projectId: project.id },
      _max: { sortOrder: true }
    });
    const nextSortOrder = (sortOrderAggregate._max.sortOrder ?? -1) + 1;
    // File metadata is written in one transaction so partial database rows do
    // not appear if one file record fails. The physical files are already on
    // disk at this point; later we can add cleanup for failed transactions.
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
          sortOrder: nextSortOrder + index
        }
      }))
    );
    filesPersisted = true;
    const firstImage = createdFiles.find((file) => file.kind === FileKind.IMAGE);

    // The first uploaded image becomes the cover automatically. This keeps the
    // MVP flow short: users do not need a separate “choose cover” control yet.
    if (firstImage && !project.coverFileId) {
      await prisma.project.update({
        where: { id: project.id },
        data: { coverFileId: firstImage.id }
      });
    }

    response.status(201).json({
      files: createdFiles.map((file) => ({
        id: file.id,
        projectId: file.projectId,
        storageKey: file.storageKey,
        originalName: file.originalName,
        mimeType: file.mimeType,
        // Prisma maps SQLite/PostgreSQL big integers to JS BigInt. JSON cannot
        // serialize BigInt directly, so API responses expose a plain number.
        sizeBytes: Number(file.sizeBytes),
        kind: file.kind,
        sortOrder: file.sortOrder
      }))
    });
  } catch (error) {
    if (!filesPersisted) {
      await cleanupUploadedFiles((request.files as Express.Multer.File[] | undefined) || []);
    }
    next(error);
  }
});

projectsRouter.delete("/:id/files/:fileId", requireAuth, async (request, response, next) => {
  try {
    const user = (request as AuthedRequest).user;
    const project = await findEditableProjectForUser(request.params.id, user);

    if (!project) {
      response.status(404).json({ error: "Project not found" });
      return;
    }

    if (!canEditProjectContent(project)) {
      response.status(409).json({ error: "Only DRAFT and REJECTED projects can be edited" });
      return;
    }

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
    if (project.coverFileId === file.id) {
      await prisma.project.update({
        where: { id: project.id },
        data: { coverFileId: null }
      });
    }
    await fs.rm(path.join(config.uploadDir, file.storageKey), { force: true });
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

function inferFileKind(file: Express.Multer.File) {
  const mime = file.mimetype.toLowerCase();
  const extension = path.extname(file.originalname).toLowerCase();

  // MIME type is best for browser uploads, but model/archive formats often
  // arrive as generic octet-stream, so extension checks are still necessary.
  if (mime.startsWith("image/") || [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".avif"].includes(extension)) return FileKind.IMAGE;
  if (mime.startsWith("video/") || [".mp4", ".webm", ".mov", ".m4v"].includes(extension)) return FileKind.VIDEO;
  if ([".fbx", ".obj", ".blend", ".glb", ".gltf", ".stl", ".usd", ".usdz"].includes(extension)) return FileKind.MODEL;
  if ([".zip", ".rar", ".7z"].includes(extension)) return FileKind.ARCHIVE;
  if ([".pdf", ".txt", ".md", ".doc", ".docx"].includes(extension)) return FileKind.DOCUMENT;

  return FileKind.OTHER;
}

function isPreviewableFile(file: { kind: string; mimeType: string; originalName: string }) {
  const extension = path.extname(file.originalName).toLowerCase();

  return file.kind === FileKind.IMAGE
    || file.kind === FileKind.VIDEO
    || isBrowserPreviewableModel(extension)
    || file.mimeType.toLowerCase().startsWith("image/")
    || file.mimeType.toLowerCase().startsWith("video/")
    || [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".avif", ".mp4", ".webm", ".mov", ".m4v"].includes(extension);
}

function contentTypeForPreview(file: { mimeType: string; originalName: string }) {
  const mime = file.mimeType.toLowerCase();
  const extension = path.extname(file.originalName).toLowerCase();

  if (mime.startsWith("image/") || mime.startsWith("video/")) return file.mimeType;

  const contentTypes: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".avif": "image/avif",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mov": "video/quicktime",
    ".m4v": "video/mp4",
    ".glb": "model/gltf-binary",
    ".gltf": "model/gltf+json"
  };

  return contentTypes[extension] || file.mimeType;
}

function isBrowserPreviewableModel(extension: string) {
  // GLB is the most convenient single-file 3D preview format. GLTF is also
  // allowed, but production upload validation should later handle its external
  // texture/bin dependencies explicitly. FBX/OBJ/BLEND/STL remain metadata-only
  // until we add conversion or a broader viewer pipeline.
  return [".glb", ".gltf"].includes(extension);
}

async function cleanupUploadedFiles(files: Express.Multer.File[]) {
  // Multer writes files before the route body runs. If authorization, status
  // checks, or database writes fail, we must remove those just-uploaded physical
  // files so rejected requests do not slowly litter local storage.
  await Promise.all(files.map((file) => fs.rm(file.path, { force: true })));
}

const projectInclude = {
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

function canViewProject(project: { ownerId: string; status: string }, sessionUser: SessionUser | null) {
  if (project.status === "PUBLISHED") return true;
  if (!sessionUser) return false;
  return sessionUser.role === "ADMIN" || project.ownerId === sessionUser.id;
}

function canEditProjectContent(project: { status: string }) {
  // Edits are allowed only before moderation or after rejection. PENDING is
  // frozen so moderators review a stable snapshot; PUBLISHED is frozen so the
  // public catalog cannot silently change under viewers.
  return ["DRAFT", "REJECTED"].includes(project.status);
}

async function findEditableProjectForUser(projectId: string, user: SessionUser) {
  return prisma.project.findFirst({
    where: user.role === "ADMIN"
      ? { id: projectId }
      : { id: projectId, ownerId: user.id }
  });
}

async function findViewableProject(projectId: string, sessionUser: SessionUser | null) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: projectInclude
  });

  if (!project || !canViewProject(project, sessionUser)) return null;
  return project;
}

async function resolveCategoryIds(input: Pick<ProjectMutationInput, "categoryIds" | "categorySlugs">) {
  const categoryIdsFromSlugs = input.categorySlugs.length
    ? await prisma.category.findMany({
        where: {
          // The upload/edit UI sends slugs because it should not know database
          // ids. Unknown/inactive slugs are ignored instead of creating invalid
          // project-category links.
          slug: { in: input.categorySlugs.map(normalizeCategoryFilter).filter(Boolean) },
          isActive: true
        },
        select: { id: true }
      })
    : [];

  return [...new Set([
    // Accepting both ids and slugs gives us room to evolve the frontend. Admin
    // tools may eventually use ids, while the current static UI uses slugs.
    ...input.categoryIds,
    ...categoryIdsFromSlugs.map((category) => category.id)
  ])];
}

function normalizeCategoryFilter(value: string) {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, "-");

  // These aliases bridge human UI labels and database slugs. Keep them small
  // and explicit; if the list grows, move it to a shared category mapping.
  if (normalized === "3d") return "3d";
  if (normalized === "game-art") return "game";

  return normalized;
}

async function buildGroupedCategoryFilters(categorySlugs: string[]) {
  if (!categorySlugs.length) return {};

  const selectedCategories = await prisma.category.findMany({
    where: {
      slug: { in: categorySlugs },
      isActive: true
    },
    select: {
      slug: true,
      group: true
    }
  });

  const slugsByGroup = selectedCategories.reduce<Record<string, string[]>>((groups, category) => {
    groups[category.group] ||= [];
    groups[category.group].push(category.slug);
    return groups;
  }, {});

  // Frontend filters work as OR inside one group and AND between groups:
  // one selected software OR another software, but software AND theme together.
  const groupedFilters = Object.values(slugsByGroup).map((slugs) => ({
    categories: {
      some: {
        category: {
          slug: { in: slugs }
        }
      }
    }
  }));

  return groupedFilters.length ? { AND: groupedFilters } : {};
}
