import type { PrismaClient } from "@prisma/client";
import fs from "node:fs/promises";
import path from "node:path";
import { hashPassword } from "../src/lib/passwords.js";

// Имена, описания, даты и изображения взяты из блока «Люди в БД» макета.
// Это вымышленные демонстрационные авторы, а не реальные пользователи.
// Стабильные id позволяют повторять заполнение без дубликатов и потери правок.
const authors = [
  { key: "viktor", displayName: "Виктор Хекстекович", specialty: "3D-креатор, программист, ИИ-креатор", contact: "t.me/ViktorHEX52321", location: "Piltover", bio: "Знание — это парадокс. Чем больше человек понимает, тем больше он осознаёт необъятность своего невежества", date: "2020-03-11", title: "Проект хекстекового ядра с использованием природной магии рун", description: "Хекстековое ядро способно изменить мир к лучшему. Оно стабильно и поможет нуждающимся", tags: ["design", "3d"], images: ["viktor-project-1", "viktor-project-2", "viktor-project-3"] },
  { key: "mel", displayName: "Mel Medarda", specialty: "Художник иллюстратор", contact: "", location: "Piltover", bio: "Raised in Noxus, shaped by Piltover, tainted with magic. Many question my motives, but their whispers do not define me", date: "2024-02-09", title: "Арт иллюстрация для игры Лига Легенд", description: "Raised in Noxus", tags: ["design", "illustration", "procreate"], images: ["mel-project"] },
  { key: "jinx", displayName: "Джинкс", specialty: "3D художник", contact: "", location: "Zaun", bio: "Джинкс — это Джинкс.", date: "2021-02-21", title: "Иллюстрация к синематику Arcane", description: "gEt jInxEd", tags: ["illustration", "3d", "design", "concept"], images: ["jinx-project"] },
  { key: "jayce", displayName: "Джейс Талис", specialty: "3D дизайнер", contact: "Пишите Виктору", location: "Piltover", bio: "Viktor, humanity isn't weakness. It's why I stand against you.", date: "2020-03-10", title: "Концепт перчаток «Атлас» для специалистов горного дела", description: "Перчатки «Атлас» станут настоящим прорывом в профессии шахтеров. Люди будут меньше уставать, но их работоспособность и эффективность достигнет пика!", tags: ["3d", "design", "concept"], images: ["jayce-project"] }
];

export async function seedFigma(prisma: PrismaClient) {
  for (const author of authors) {
    const { key, displayName, specialty, contact, location, bio } = author;
    const avatarFileId = `/assets/figma/${key}-avatar.png`;
    const coverUrl = `/assets/figma/${author.images[0]}.png`;
    const passwordHash = await hashPassword("password123");
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.upsert({ where: { email: `${key}@creatur.local` }, update: {}, create: { id: `figma-${key}`, email: `${key}@creatur.local`, passwordHash, displayName, specialty, contact, location, bio, avatarFileId, coverUrl, createdAt: new Date(author.date) } });
      const id = `figma-${key}-project`;
      if (await tx.project.findUnique({ where: { id } })) return;
      const categories = await tx.category.findMany({ where: { slug: { in: author.tags } } });
      await tx.project.create({ data: { id, ownerId: user.id, title: author.title, description: author.description, status: "PUBLISHED", publishedAt: new Date("2026-09-08T12:00:00Z"), coverFileId: `${id}-0`, categories: { create: categories.map((category) => ({ categoryId: category.id })) } } });
      for (const [sortOrder, image] of author.images.entries()) {
        const storageKey = `/assets/figma/${image}.png`;
        const stat = await fs.stat(path.resolve("../frontend", `.${storageKey}`));
        await tx.projectFile.create({ data: { id: `${id}-${sortOrder}`, projectId: id, uploaderId: user.id, storageKey, originalName: `${image}.png`, kind: "IMAGE", mimeType: "image/png", sizeBytes: BigInt(stat.size), sortOrder } });
      }
    });
  }
}
