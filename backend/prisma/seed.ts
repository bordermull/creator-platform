import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/passwords.js";

dotenv.config();

const prisma = new PrismaClient();

// The seed is intentionally independent from Prisma enums. PostgreSQL uses
// real enums, while SQLite dev mode stores the same values as strings.
const CategoryGroup = {
  SECTION: "SECTION",
  SOFTWARE: "SOFTWARE",
  CONTENT: "CONTENT",
  THEME: "THEME"
} as const;

const categories = [
  { group: CategoryGroup.SECTION, slug: "ai", name: "ИИ-креаторы", sortOrder: 10 },
  { group: CategoryGroup.SECTION, slug: "3d", name: "3D-креаторы", sortOrder: 20 },
  { group: CategoryGroup.SECTION, slug: "design", name: "Дизайнеры", sortOrder: 30 },
  { group: CategoryGroup.SECTION, slug: "code", name: "Программисты", sortOrder: 40 },

  { group: CategoryGroup.SOFTWARE, slug: "blender", name: "Blender", sortOrder: 10 },
  { group: CategoryGroup.SOFTWARE, slug: "procreate", name: "ProCreate", sortOrder: 20 },
  { group: CategoryGroup.SOFTWARE, slug: "unreal", name: "Unreal Engine", sortOrder: 30 },
  { group: CategoryGroup.SOFTWARE, slug: "unity", name: "Unity", sortOrder: 40 },
  { group: CategoryGroup.SOFTWARE, slug: "photoshop", name: "Photoshop", sortOrder: 50 },
  { group: CategoryGroup.SOFTWARE, slug: "figma", name: "Figma", sortOrder: 60 },
  { group: CategoryGroup.SOFTWARE, slug: "illustrator", name: "Illustrator", sortOrder: 70 },
  { group: CategoryGroup.SOFTWARE, slug: "after-effects", name: "After Effects", sortOrder: 80 },
  { group: CategoryGroup.SOFTWARE, slug: "maya", name: "Maya", sortOrder: 90 },
  { group: CategoryGroup.SOFTWARE, slug: "zbrush", name: "ZBrush", sortOrder: 100 },
  { group: CategoryGroup.SOFTWARE, slug: "cinema-4d", name: "Cinema 4D", sortOrder: 110 },
  { group: CategoryGroup.SOFTWARE, slug: "houdini", name: "Houdini", sortOrder: 120 },
  { group: CategoryGroup.SOFTWARE, slug: "substance-painter", name: "Substance Painter", sortOrder: 130 },

  { group: CategoryGroup.CONTENT, slug: "3d-models", name: "3D-модели", sortOrder: 10 },
  { group: CategoryGroup.CONTENT, slug: "illustration", name: "Иллюстрации", sortOrder: 20 },
  { group: CategoryGroup.CONTENT, slug: "concept", name: "Концепт-арт", sortOrder: 30 },
  { group: CategoryGroup.CONTENT, slug: "animation", name: "Анимация", sortOrder: 40 },
  { group: CategoryGroup.CONTENT, slug: "character", name: "Персонажи", sortOrder: 50 },
  { group: CategoryGroup.CONTENT, slug: "environment", name: "Окружение", sortOrder: 60 },
  { group: CategoryGroup.CONTENT, slug: "interface", name: "Интерфейсы", sortOrder: 70 },
  { group: CategoryGroup.CONTENT, slug: "prototype", name: "Код и прототипы", sortOrder: 80 },

  { group: CategoryGroup.THEME, slug: "fantasy", name: "Fantasy", sortOrder: 10 },
  { group: CategoryGroup.THEME, slug: "sci-fi", name: "Sci-fi", sortOrder: 20 },
  { group: CategoryGroup.THEME, slug: "game", name: "Game art", sortOrder: 30 },
  { group: CategoryGroup.THEME, slug: "cyberpunk", name: "Cyberpunk", sortOrder: 40 },
  { group: CategoryGroup.THEME, slug: "hard-surface", name: "Hard surface", sortOrder: 50 },
  { group: CategoryGroup.THEME, slug: "magic", name: "Magic", sortOrder: 60 },
  { group: CategoryGroup.THEME, slug: "digital-art", name: "Digital art", sortOrder: 70 },
  { group: CategoryGroup.THEME, slug: "motion", name: "Motion", sortOrder: 80 },
  { group: CategoryGroup.THEME, slug: "gamedev", name: "GameDev", sortOrder: 90 }
];

const demoAuthors = [
  {
    email: "admin@creatur.local",
    password: "password123",
    displayName: "Виктор Жестянщиков",
    bio: "3D-художник, концепт-дизайнер, автор игровых объектов.",
    avatarFileId: "/assets/extracted/home-after-registration/image-01.png",
    role: "ADMIN"
  },
  {
    email: "klara@creatur.local",
    password: "password123",
    displayName: "Клара Морт",
    bio: "Hard-surface artist with a focus on playable props.",
    avatarFileId: "/assets/extracted/home-before-registration/image-04.png",
    role: "USER"
  },
  {
    email: "artem@creatur.local",
    password: "password123",
    displayName: "Артем Нокс",
    bio: "Digital illustrator exploring fantasy rituals and character art.",
    avatarFileId: "/assets/extracted/home-before-registration/image-07.png",
    role: "USER"
  },
  {
    email: "maria@creatur.local",
    password: "password123",
    displayName: "Мария Рэй",
    bio: "Game artist building sci-fi objects and realtime scenes.",
    avatarFileId: "/assets/extracted/home-before-registration/image-08.png",
    role: "USER"
  },
  {
    email: "denis@creatur.local",
    password: "password123",
    displayName: "Денис Варг",
    bio: "Environment and interface-driven visual storyteller.",
    avatarFileId: "/assets/extracted/home-after-registration/image-01.png",
    role: "USER"
  },
  {
    email: "lina@creatur.local",
    password: "password123",
    displayName: "Лина Соул",
    bio: "Fantasy prop artist working with readable silhouettes.",
    avatarFileId: "/assets/extracted/home-before-registration/image-04.png",
    role: "USER"
  },
  {
    email: "oleg@creatur.local",
    password: "password123",
    displayName: "Олег Фрост",
    bio: "Motion designer and experimental material artist.",
    avatarFileId: "/assets/extracted/project-public-foreign/image-05.png",
    role: "USER"
  }
] as const;

const demoProjects = [
  {
    id: "portal-cube",
    ownerEmail: "admin@creatur.local",
    title: "Проект мистического куба",
    description: "Серия кадров для портального артефакта: свет, напряжение формы и ощущение большой игровой сцены.",
    image: "/assets/extracted/home-before-registration/image-01.png",
    categorySlugs: ["ai", "3d", "blender", "sci-fi", "3d-models", "game", "magic"],
    likesCount: 384,
    viewsCount: 2100,
    publishedAt: new Date("2026-07-12T10:00:00.000Z")
  },
  {
    id: "iron-gloves",
    ownerEmail: "klara@creatur.local",
    title: "Концепт перчаток для силы",
    description: "Детализированный hard-surface объект с акцентом на металл, соединения и выразительный силуэт.",
    image: "/assets/extracted/home-before-registration/image-02.png",
    categorySlugs: ["3d", "design", "unreal", "game", "concept", "3d-models", "hard-surface"],
    likesCount: 268,
    viewsCount: 1700,
    publishedAt: new Date("2026-07-12T11:00:00.000Z")
  },
  {
    id: "fire-ritual",
    ownerEmail: "artem@creatur.local",
    title: "Арт магического ритуала",
    description: "Иллюстрация с контрастом холодного пространства и теплого магического света.",
    image: "/assets/extracted/home-before-registration/image-03.png",
    categorySlugs: ["design", "procreate", "fantasy", "game", "illustration", "digital-art", "magic", "character"],
    likesCount: 421,
    viewsCount: 3900,
    publishedAt: new Date("2026-07-12T12:00:00.000Z")
  },
  {
    id: "night-drone",
    ownerEmail: "maria@creatur.local",
    title: "Рычащий дрон разведчик",
    description: "Игровой объект с агрессивной пластикой, темным корпусом и световыми акцентами.",
    image: "/assets/extracted/home-before-registration/image-05.png",
    categorySlugs: ["3d", "code", "unity", "sci-fi", "3d-models", "hard-surface", "gamedev"],
    likesCount: 197,
    viewsCount: 980,
    publishedAt: new Date("2026-07-12T13:00:00.000Z")
  },
  {
    id: "signal-room",
    ownerEmail: "denis@creatur.local",
    title: "Сигнальная комната",
    description: "Окружение для сюжетной сцены, построенное вокруг света интерфейсов и глубины кадра.",
    image: "/assets/extracted/home-before-registration/image-06.png",
    categorySlugs: ["ai", "design", "sci-fi", "environment", "interface", "digital-art"],
    likesCount: 512,
    viewsCount: 4400,
    publishedAt: new Date("2026-07-12T14:00:00.000Z")
  },
  {
    id: "ancient-key",
    ownerEmail: "lina@creatur.local",
    title: "Ключ древнего механизма",
    description: "Пропс для приключенческой игры: потертый металл, декоративные детали и читаемая форма.",
    image: "/assets/extracted/home-before-registration/image-07.png",
    categorySlugs: ["3d", "blender", "fantasy", "concept", "3d-models", "hard-surface", "game"],
    likesCount: 145,
    viewsCount: 760,
    publishedAt: new Date("2026-07-12T15:00:00.000Z")
  },
  {
    id: "champion",
    ownerEmail: "admin@creatur.local",
    title: "Портрет боевого чемпиона",
    description: "Крупный эмоциональный портрет героя с напряженным взглядом и кинематографичным светом.",
    image: "/assets/extracted/home-before-registration/image-08.png",
    categorySlugs: ["design", "procreate", "game", "concept", "illustration", "digital-art", "character"],
    likesCount: 631,
    viewsCount: 5200,
    publishedAt: new Date("2026-07-12T16:00:00.000Z")
  },
  {
    id: "water-orb",
    ownerEmail: "oleg@creatur.local",
    title: "Чужой открытый проект",
    description: "Экспериментальная работа с прозрачными материалами, свечением и плавным движением.",
    image: "/assets/extracted/project-public-foreign/image-01.png",
    categorySlugs: ["ai", "design", "sci-fi", "motion", "digital-art"],
    likesCount: 229,
    viewsCount: 1200,
    publishedAt: new Date("2026-07-12T17:00:00.000Z")
  }
] as const;

async function main() {
  // Upsert makes the seed repeatable. Running it again updates labels/order
  // without duplicating categories in the database.
  for (const category of categories) {
    await prisma.category.upsert({
      where: {
        group_slug: {
          group: category.group,
          slug: category.slug
        }
      },
      update: {
        name: category.name,
        sortOrder: category.sortOrder,
        isActive: true
      },
      create: category
    });
  }

  const passwordHashByEmail = new Map<string, string>();

  for (const author of demoAuthors) {
    passwordHashByEmail.set(author.email, await hashPassword(author.password));
  }

  const usersByEmail = new Map<string, { id: string }>();

  // Demo authors let the API return realistic project owners and avatars.
  // Password is the same local-only value for all seeded accounts: password123.
  for (const author of demoAuthors) {
    const user = await prisma.user.upsert({
      where: { email: author.email },
      update: {
        displayName: author.displayName,
        bio: author.bio,
        avatarFileId: author.avatarFileId,
        role: author.role
      },
      create: {
        email: author.email,
        passwordHash: passwordHashByEmail.get(author.email) || "",
        displayName: author.displayName,
        bio: author.bio,
        avatarFileId: author.avatarFileId,
        role: author.role
      }
    });

    usersByEmail.set(author.email, user);
  }

  const categoryRecords = await prisma.category.findMany();
  const categoryIdBySlug = new Map(categoryRecords.map((category) => [category.slug, category.id]));

  // Seeded projects mirror the frontend mock catalog. Each project receives a
  // cover file record so the API DTO can expose the same image paths the static
  // frontend already knows how to render.
  for (const demoProject of demoProjects) {
    const owner = usersByEmail.get(demoProject.ownerEmail);

    if (!owner) {
      throw new Error(`Missing seed owner for ${demoProject.ownerEmail}`);
    }

    const project = await prisma.project.upsert({
      where: { id: demoProject.id },
      update: {
        ownerId: owner.id,
        title: demoProject.title,
        description: demoProject.description,
        status: "PUBLISHED",
        likesCount: demoProject.likesCount,
        viewsCount: demoProject.viewsCount,
        publishedAt: demoProject.publishedAt
      },
      create: {
        id: demoProject.id,
        ownerId: owner.id,
        title: demoProject.title,
        description: demoProject.description,
        status: "PUBLISHED",
        likesCount: demoProject.likesCount,
        viewsCount: demoProject.viewsCount,
        publishedAt: demoProject.publishedAt
      }
    });

    await prisma.projectCategory.deleteMany({ where: { projectId: project.id } });
    await prisma.projectFile.deleteMany({ where: { projectId: project.id } });

    await prisma.projectFile.create({
      data: {
        id: `${project.id}-cover`,
        projectId: project.id,
        uploaderId: owner.id,
        storageKey: demoProject.image,
        originalName: demoProject.image.split("/").at(-1) || "cover.png",
        mimeType: "image/png",
        sizeBytes: BigInt(0),
        kind: "IMAGE",
        sortOrder: 0
      }
    });

    await prisma.projectCategory.createMany({
      data: demoProject.categorySlugs.map((slug) => {
        const categoryId = categoryIdBySlug.get(slug);

        if (!categoryId) {
          throw new Error(`Missing seed category: ${slug}`);
        }

        return {
          projectId: project.id,
          categoryId
        };
      })
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
