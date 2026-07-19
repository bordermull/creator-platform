import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

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
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
