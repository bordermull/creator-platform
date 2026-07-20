type ProjectRecord = {
  id: string;
  title: string;
  description: string;
  status: string;
  coverFileId: string | null;
  likesCount: number;
  viewsCount: number;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  owner: {
    id: string;
    displayName: string;
    avatarFileId: string | null;
  };
  files: Array<{
    id: string;
    storageKey: string;
    originalName: string;
    mimeType: string;
    kind: string;
    sortOrder: number;
  }>;
  categories: Array<{
    category: {
      id: string;
      slug: string;
      name: string;
      group: string;
    };
  }>;
  _count: {
    likes: number;
    views: number;
  };
};

// DTOs are the contract between backend and frontend. They keep Prisma records,
// database-only fields, password hashes, and future internal details away from UI code.
export function toProjectDto(project: ProjectRecord) {
  const imageFile = project.files.find((file) => file.id === project.coverFileId)
    || project.files.find((file) => file.kind === "IMAGE")
    || project.files[0]
    || null;
  const categories = project.categories.map(({ category }) => ({
    id: category.id,
    slug: category.slug,
    name: category.name,
    group: category.group
  }));

  return {
    id: project.id,
    title: project.title,
    description: project.description,
    status: project.status,
    author: {
      id: project.owner.id,
      name: project.owner.displayName,
      avatar: project.owner.avatarFileId
    },
    image: imageFile?.storageKey || null,
    files: project.files.map((file) => ({
      id: file.id,
      url: file.storageKey,
      name: file.originalName,
      mimeType: file.mimeType,
      kind: file.kind,
      sortOrder: file.sortOrder
    })),
    categories,
    categoryLabels: categories.map((category) => category.name),
    categorySlugs: categories.map((category) => category.slug),
    likes: project.likesCount + project._count.likes,
    views: project.viewsCount + project._count.views,
    publishedAt: project.publishedAt,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt
  };
}
