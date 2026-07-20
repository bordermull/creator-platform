const assets = {
  home: "./assets/extracted/home-before-registration/",
  authedHome: "./assets/extracted/home-after-registration/",
  userProfile: "./assets/extracted/user-profile/",
  account: "./assets/extracted/account-edit/",
  uploadEmpty: "./assets/extracted/project-upload-empty/",
  uploadFilled: "./assets/extracted/project-upload-filled/",
  projectOwn: "./assets/extracted/project-own-liked/",
  projectForeign: "./assets/extracted/project-public-foreign/"
};

const apiBaseUrl = "http://127.0.0.1:3000";

const filterGroups = [
  {
    id: "section",
    title: "Раздел",
    defaultSelected: ["ai", "3D", "design"],
    options: [
      { value: "ai", label: "ИИ-креаторы" },
      { value: "3D", label: "3D-креаторы" },
      { value: "design", label: "Дизайнеры" },
      { value: "code", label: "Программисты" }
    ]
  },
  {
    id: "software",
    title: "Инструменты",
    options: [
      { value: "Blender", label: "Blender" },
      { value: "ProCreate", label: "ProCreate" },
      { value: "Unreal", label: "Unreal Engine" },
      { value: "Unity", label: "Unity" },
      { value: "Photoshop", label: "Photoshop" },
      { value: "Figma", label: "Figma" },
      { value: "Illustrator", label: "Illustrator" },
      { value: "After Effects", label: "After Effects" },
      { value: "Maya", label: "Maya" },
      { value: "ZBrush", label: "ZBrush" },
      { value: "Cinema 4D", label: "Cinema 4D" },
      { value: "Houdini", label: "Houdini" },
      { value: "Substance Painter", label: "Substance Painter" }
    ]
  },
  {
    id: "content",
    title: "Тип проекта",
    options: [
      { value: "3d-models", label: "3D-модели" },
      { value: "illustration", label: "Иллюстрации" },
      { value: "concept", label: "Концепт-арт" },
      { value: "animation", label: "Анимация" },
      { value: "character", label: "Персонажи" },
      { value: "environment", label: "Окружение" },
      { value: "interface", label: "Интерфейсы" },
      { value: "prototype", label: "Код и прототипы" }
    ]
  },
  {
    id: "themes",
    title: "Тематика",
    options: [
      { value: "fantasy", label: "Fantasy" },
      { value: "sci-fi", label: "Sci-fi" },
      { value: "game", label: "Game art" },
      { value: "cyberpunk", label: "Cyberpunk" },
      { value: "hard-surface", label: "Hard surface" },
      { value: "magic", label: "Magic" },
      { value: "digital-art", label: "Digital art" },
      { value: "motion", label: "Motion" },
      { value: "gamedev", label: "GameDev" }
    ]
  }
];

function defaultFilterState() {
  return Object.fromEntries(filterGroups.map((group) => [group.id, group.defaultSelected || []]));
}

const fallbackProjects = [
  {
    id: "portal-cube",
    title: "Проект мистического куба",
    author: "Виктор Жестянщиков",
    avatar: `${assets.authedHome}image-01.png`,
    image: `${assets.home}image-01.png`,
    category: ["3D", "Blender", "sci-fi"],
    filters: ["ai", "3D", "Blender", "sci-fi", "3d-models", "game", "magic"],
    likes: 384,
    views: "2.1k",
    description: "Серия кадров для портального артефакта: свет, напряжение формы и ощущение большой игровой сцены."
  },
  {
    id: "iron-gloves",
    title: "Концепт перчаток для силы",
    author: "Клара Морт",
    avatar: `${assets.home}image-04.png`,
    image: `${assets.home}image-02.png`,
    category: ["3D", "Unreal", "game"],
    filters: ["3D", "design", "Unreal", "game", "concept", "3d-models", "hard-surface"],
    likes: 268,
    views: "1.7k",
    description: "Детализированный hard-surface объект с акцентом на металл, соединения и выразительный силуэт."
  },
  {
    id: "fire-ritual",
    title: "Арт магического ритуала",
    author: "Артем Нокс",
    avatar: `${assets.home}image-07.png`,
    image: `${assets.home}image-03.png`,
    category: ["digital", "fantasy"],
    filters: ["design", "ProCreate", "fantasy", "game", "illustration", "digital-art", "magic", "character"],
    likes: 421,
    views: "3.9k",
    description: "Иллюстрация с контрастом холодного пространства и теплого магического света."
  },
  {
    id: "night-drone",
    title: "Рычащий дрон разведчик",
    author: "Мария Рэй",
    avatar: `${assets.home}image-08.png`,
    image: `${assets.home}image-05.png`,
    category: ["3D", "Unity", "sci-fi"],
    filters: ["3D", "code", "Unity", "sci-fi", "3d-models", "hard-surface", "gamedev"],
    likes: 197,
    views: "980",
    description: "Игровой объект с агрессивной пластикой, темным корпусом и световыми акцентами."
  },
  {
    id: "signal-room",
    title: "Сигнальная комната",
    author: "Денис Варг",
    avatar: `${assets.authedHome}image-01.png`,
    image: `${assets.home}image-06.png`,
    category: ["digital", "sci-fi"],
    filters: ["ai", "design", "sci-fi", "environment", "interface", "digital-art"],
    likes: 512,
    views: "4.4k",
    description: "Окружение для сюжетной сцены, построенное вокруг света интерфейсов и глубины кадра."
  },
  {
    id: "ancient-key",
    title: "Ключ древнего механизма",
    author: "Лина Соул",
    avatar: `${assets.home}image-04.png`,
    image: `${assets.home}image-07.png`,
    category: ["3D", "Blender", "fantasy"],
    filters: ["3D", "Blender", "fantasy", "concept", "3d-models", "hard-surface", "game"],
    likes: 145,
    views: "760",
    description: "Пропс для приключенческой игры: потертый металл, декоративные детали и читаемая форма."
  },
  {
    id: "champion",
    title: "Портрет боевого чемпиона",
    author: "Виктор Жестянщиков",
    avatar: `${assets.authedHome}image-01.png`,
    image: `${assets.home}image-08.png`,
    category: ["digital", "game"],
    filters: ["design", "ProCreate", "game", "concept", "illustration", "digital-art", "character"],
    likes: 631,
    views: "5.2k",
    description: "Крупный эмоциональный портрет героя с напряженным взглядом и кинематографичным светом."
  },
  {
    id: "water-orb",
    title: "Чужой открытый проект",
    author: "Олег Фрост",
    avatar: `${assets.projectForeign}image-05.png`,
    image: `${assets.projectForeign}image-01.png`,
    category: ["motion", "sci-fi"],
    filters: ["ai", "design", "sci-fi", "motion", "digital-art"],
    likes: 229,
    views: "1.2k",
    description: "Экспериментальная работа с прозрачными материалами, свечением и плавным движением."
  }
];

let projects = [...fallbackProjects];
let projectsRequest = null;
let projectsRequestKey = "";
let latestProjectsRequestKey = "";

const state = {
  isAuthed: localStorage.getItem("creatur-auth") === "true",
  currentUser: null,
  authMode: "login",
  search: "",
  filters: defaultFilterState(),
  projectsSource: "fallback"
};

const app = document.querySelector("#app");
const header = document.querySelector("[data-header]");
const authActions = document.querySelector("[data-auth-actions]");

function route() {
  const hash = window.location.hash.replace("#", "") || "home";
  renderHeader();

  // The frontend is still a hash-based static app. This small router keeps all
  // screens in one HTML file, which is convenient while the backend contract is
  // actively changing and we do not want to introduce a full framework yet.
  if (hash === "login" || hash === "register") {
    renderHome();
    openAuth(hash);
    return;
  }

  if (hash === "profile") {
    renderProfile();
    return;
  }

  if (hash === "account" || hash === "account/edit") {
    if (!state.isAuthed) {
      window.location.hash = "login";
      return;
    }
    renderAccount(hash === "account/edit");
    return;
  }

  if (hash === "upload" || hash === "upload/filled") {
    if (!state.isAuthed) {
      window.location.hash = "login";
      return;
    }
    renderUpload(hash === "upload/filled");
    return;
  }

  if (hash === "admin") {
    // We check auth here for UX, but backend admin routes still enforce the real
    // permission with requireAdmin. Frontend checks should never be the only
    // security boundary; they only prevent users from walking into a dead end.
    if (!state.isAuthed) {
      window.location.hash = "login";
      return;
    }

    renderAdminModeration();
    return;
  }

  if (hash.startsWith("project/")) {
    renderProject(hash.split("/")[1]);
    return;
  }

  renderHome();
}

function cloneTemplate(id) {
  // All screens are stored as <template> blocks in index.html. Replacing the app
  // children is the simplest way to avoid stale event listeners between screens.
  const template = document.querySelector(`#${id}`);
  app.replaceChildren(template.content.cloneNode(true));
}

function renderHeader() {
  // The admin link is intentionally role-gated in the UI so regular users do
  // not see controls they cannot use. The backend still validates ADMIN on every
  // /api/admin request, so hiding this link is not treated as security.
  const adminLink = state.currentUser?.role === "ADMIN"
    ? `<a href="#admin">Модерация</a>`
    : "";

  authActions.innerHTML = state.isAuthed
    ? `
      <div class="account-menu" data-account-menu>
        <button class="avatar-button" type="button" data-account-toggle aria-expanded="false" aria-label="Открыть меню аккаунта">
          <img src="${assets.account}image-01.png" alt="" />
        </button>
        <div class="account-dropdown" data-account-dropdown hidden>
          <a href="#account">Личный кабинет</a>
          <a href="#upload">Загрузить проект</a>
          ${adminLink}
          <button type="button" data-logout>Выйти</button>
        </div>
      </div>
    `
    : `<a class="login-button" href="#login">Вход</a>`;

  const accountToggle = authActions.querySelector("[data-account-toggle]");
  const accountDropdown = authActions.querySelector("[data-account-dropdown]");
  accountToggle?.addEventListener("click", (event) => {
    event.stopPropagation();
    const isOpen = accountDropdown.hidden;
    accountDropdown.hidden = !isOpen;
    accountToggle.setAttribute("aria-expanded", String(isOpen));
  });

  authActions.querySelector("[data-logout]")?.addEventListener("click", () => {
    logout().then(() => {
      window.location.hash = "home";
      route();
    });
  });
}

function projectCard(project) {
  // The card renderer consumes the legacy UI shape, not the raw backend DTO.
  // mapApiProject is responsible for making API projects look like old mocks.
  const tags = project.category.map((tag) => `<span>${tag}</span>`).join("");
  return `
    <a class="project-card" href="#project/${project.id}">
      <div class="project-art">
        <img src="${project.image}" alt="${project.title}" loading="lazy" />
      </div>
      <div class="card-body">
        <img class="mini-avatar" src="${project.avatar}" alt="" />
        <div class="card-content">
          <h3>${project.title}</h3>
          <p>${project.author}</p>
          <div class="tag-row">${tags}</div>
          <div class="meta-row">
            <span>${project.likes} лайков</span>
            <span>${project.views} просмотров</span>
          </div>
        </div>
      </div>
    </a>
  `;
}

function formatCompactNumber(value) {
  // Frontend mock data used strings like "2.1k"; backend returns numbers.
  // Formatting here lets API data blend into the old visual design.
  const number = Number(value) || 0;

  if (number >= 1000) {
    return `${(number / 1000).toFixed(1).replace(".0", "")}k`;
  }

  return String(number);
}

function resolveProjectAssetUrl(url) {
  if (!url) return `${assets.home}image-01.png`;

  // Old Figma-exported assets live next to the static frontend, while newly
  // uploaded files are served by the API from /uploads. Keeping this translation
  // in one place lets the renderer stay simple during the frontend/backend merge.
  if (url.startsWith("http") || url.startsWith(".") || url.startsWith("/assets")) {
    return url;
  }

  if (url.startsWith("/uploads")) {
    return `${apiBaseUrl}${url}`;
  }

  return `${apiBaseUrl}/uploads/${encodeURIComponent(url)}`;
}

function mapApiProject(project) {
  const categories = Array.isArray(project.categories) ? project.categories : [];
  // SECTION categories are useful for filtering, but cards look cleaner when
  // they show tools/themes/content tags first. We keep SECTION in filters below.
  const displayCategories = categories
    .filter((category) => category.group !== "SECTION")
    .slice(0, 3)
    .map((category) => category.name);

  // The backend DTO is intentionally safer and more explicit than the old
  // frontend mock object. This mapper is the bridge that lets us connect the
  // current static UI without rewriting every rendering function at once.
  return {
    id: project.id,
    title: project.title,
    author: project.author?.name || "Автор CREATUR",
    avatar: project.author?.avatar || `${assets.account}image-01.png`,
    image: resolveProjectAssetUrl(project.image),
    category: displayCategories.length ? displayCategories : project.categoryLabels || [],
    // Local filtering still exists as a fallback when the backend is unavailable.
    // It needs both slugs and labels because old mock projects mix display names
    // and filter ids. This is transitional glue, not the final data model.
    filters: [
      ...(project.categorySlugs || []),
      ...(project.categoryLabels || []),
      ...categories.map((category) => category.group)
    ],
    likes: Number(project.likes) || 0,
    views: formatCompactNumber(project.views),
    description: project.description || "",
    status: project.status,
    files: Array.isArray(project.files)
      ? project.files.map((file) => ({ ...file, url: resolveProjectAssetUrl(file.url) }))
      : []
  };
}

function upsertProject(project) {
  // Detail fetches return one authoritative project. Keeping it in the shared
  // array means back/forward navigation can reuse the freshest data immediately.
  const existingIndex = projects.findIndex((item) => item.id === project.id);

  if (existingIndex >= 0) {
    projects[existingIndex] = project;
    return;
  }

  projects = [project, ...projects];
}

function normalizeCategoryParam(value) {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, "-");

  // The UI label can be "3D" while the database slug is lowercase "3d".
  // Explicit aliases keep the mapping readable and avoid leaking seed details
  // into every place that builds query params.
  if (normalized === "3d") return "3d";
  if (normalized === "game-art") return "game";

  return normalized;
}

function displayNameFromEmail(email) {
  const localPart = email.split("@")[0] || "creatur";
  const words = localPart
    .replace(/[._-]+/g, " ")
    .split(" ")
    .filter(Boolean);

  return words.length
    ? words.map((word) => word[0].toUpperCase() + word.slice(1)).join(" ")
    : "CREATUR User";
}

async function apiJson(path, options = {}) {
  // credentials: "include" is required for httpOnly cookie auth. Without it the
  // browser would call the API successfully, but protected routes would see no
  // session cookie and return 401.
  const response = await fetch(`${apiBaseUrl}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    throw new Error(`API ${path} returned ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

async function apiMultipart(path, formData) {
  // Browser FormData must set its own multipart boundary. If we force
  // Content-Type manually here, multer will not be able to parse uploaded files.
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: "POST",
    credentials: "include",
    body: formData
  });

  if (!response.ok) {
    throw new Error(`API ${path} returned ${response.status}`);
  }

  return response.json();
}

function setAuthedUser(user) {
  // localStorage is only a UX hint for fast initial rendering. The authoritative
  // auth state is always refreshed from /api/auth/me on startup.
  state.currentUser = user;
  state.isAuthed = Boolean(user);

  if (user) {
    localStorage.setItem("creatur-auth", "true");
    return;
  }

  localStorage.removeItem("creatur-auth");
}

async function syncAuthFromApi() {
  try {
    // This call reconciles the visible UI with the backend cookie. If the cookie
    // expired or was cleared, the UI should stop showing private screens.
    const payload = await apiJson("/api/auth/me");
    setAuthedUser(payload.user);
  } catch {
    setAuthedUser(null);
  }
}

function selectedUploadCategorySlugs(root) {
  // Upload tags are still the visual buttons from the static MVP. We translate
  // their human labels into backend category slugs instead of exposing category
  // database ids to the frontend.
  return [...root.querySelectorAll("[data-tag].selected")]
    .map((button) => normalizeCategoryParam(button.dataset.tag || ""))
    .filter(Boolean);
}

async function createProjectFromUpload({ title, description, categorySlugs, files }) {
  // Project metadata and binary files are sent in two steps. The database needs
  // a project id before ProjectFile rows can point at it.
  const { project } = await apiJson("/api/projects", {
    method: "POST",
    body: JSON.stringify({ title, description, categorySlugs })
  });

  if (files.length) {
    const formData = new FormData();
    // The backend multer route expects every uploaded item under the "files"
    // field name. append() is repeated because the user can select many files.
    files.forEach((file) => formData.append("files", file));
    await apiMultipart(`/api/projects/${encodeURIComponent(project.id)}/files`, formData);
  }

  // New projects do not become public immediately. Submit moves them from DRAFT
  // to PENDING so the future admin moderation screen can publish or reject them.
  const { project: submittedProject } = await apiJson(`/api/projects/${encodeURIComponent(project.id)}/submit`, {
    method: "POST"
  });
  const mappedProject = mapApiProject(submittedProject);
  upsertProject(mappedProject);
  return mappedProject;
}

async function loadAdminProjects(status = "PENDING") {
  // Keep frontend status values whitelisted. If a button typo or manual hash
  // tweak sends something unexpected, the admin page falls back to PENDING.
  const normalizedStatus = ["DRAFT", "PENDING", "PUBLISHED", "REJECTED", "ALL"].includes(status)
    ? status
    : "PENDING";
  const payload = await apiJson(`/api/admin/projects?status=${encodeURIComponent(normalizedStatus)}`);
  return (payload.projects || []).map(mapApiProject);
}

async function loadMyProjects() {
  // Personal projects are separate from the public catalog because the account
  // page must show non-public statuses. Reusing /api/projects would hide DRAFT,
  // PENDING and REJECTED projects by design.
  const payload = await apiJson("/api/projects/me");
  return (payload.projects || []).map(mapApiProject);
}

async function moderateProject(projectId, action) {
  // The UI exposes only publish/reject. Mapping the action to a known endpoint
  // here avoids building arbitrary admin URLs from button data.
  const endpoint = action === "publish" ? "publish" : "reject";
  const payload = await apiJson(`/api/admin/projects/${encodeURIComponent(projectId)}/${endpoint}`, {
    method: "POST"
  });
  return mapApiProject(payload.project);
}

async function logout() {
  try {
    await apiJson("/api/auth/logout", { method: "POST" });
  } catch {
    // Logout should clear local UI state even when the backend is unavailable.
  }

  setAuthedUser(null);
}

function activeCategoryParams() {
  // Filters are stored grouped for UI checkboxes, but the API expects repeated
  // ?category=slug params. Flattening happens right before URL construction.
  return Object.values(state.filters)
    .flat()
    .map(normalizeCategoryParam)
    .filter(Boolean);
}

function buildProjectsUrl() {
  const url = new URL(`${apiBaseUrl}/api/projects`);
  const search = state.search.trim();

  if (search) {
    url.searchParams.set("search", search);
  }

  activeCategoryParams().forEach((category) => {
    url.searchParams.append("category", category);
  });

  return url;
}

async function loadProjectFromApi(id) {
  try {
    // Detail pages use a dedicated endpoint because an item may not be present
    // in the public catalog cache, especially after upload while it is PENDING.
    const response = await fetch(`${apiBaseUrl}/api/projects/${encodeURIComponent(id)}`);

    if (!response.ok) {
      throw new Error(`Project API returned ${response.status}`);
    }

    const payload = await response.json();

    if (!payload.project) {
      throw new Error("Project API returned an invalid payload");
    }

    const project = mapApiProject(payload.project);
    upsertProject(project);
    return project;
  } catch (error) {
    // Detail pages keep the old local project data when backend is unavailable.
    console.warn("Using fallback project detail:", error);
    return projects.find((project) => project.id === id) || fallbackProjects[0];
  }
}

async function loadProjectsFromApi() {
  const url = buildProjectsUrl();
  const requestKey = url.toString();

  if (state.projectsSource === "api" && projectsRequestKey === requestKey) return projects;
  if (projectsRequest && projectsRequestKey === requestKey) return projectsRequest;

  projectsRequestKey = requestKey;
  latestProjectsRequestKey = requestKey;
  projectsRequest = fetch(requestKey)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Projects API returned ${response.status}`);
      }

      return response.json();
    })
    .then((payload) => {
      if (!Array.isArray(payload.projects)) {
        throw new Error("Projects API returned an invalid payload");
      }

      const apiProjects = payload.projects.map(mapApiProject);

      if (latestProjectsRequestKey === requestKey) {
        projects = apiProjects;
        state.projectsSource = "api";
      }

      return projects;
    })
    .catch((error) => {
      // The frontend must remain usable when the backend is not running. During
      // this transition stage we keep rendering the original mock catalog.
      console.warn("Using fallback projects:", error);
      if (latestProjectsRequestKey === requestKey) {
        projects = [...fallbackProjects];
        state.projectsSource = "fallback";
      }
      return projects;
    })
    .finally(() => {
      if (projectsRequestKey === requestKey) {
        projectsRequest = null;
      }
    });

  return projectsRequest;
}

function refreshProjectCards(target) {
  loadProjectsFromApi().then(() => {
    if (!document.body.contains(target)) return;
    renderCards(target, filteredProjects());
  });
}

function updateProjectCards(target) {
  renderCards(target, filteredProjects());
  refreshProjectCards(target);
}

function filteredProjects() {
  const q = state.search.trim().toLowerCase();
  const activeFilters = Object.values(state.filters);
  return projects.filter((project) => {
    const haystack = `${project.title} ${project.author} ${project.category.join(" ")} ${project.filters.join(" ")}`.toLowerCase();
    const matchesSearch = !q || haystack.includes(q);
    const projectFilters = project.filters.map((item) => item.toLowerCase());
    const matchesFilters = activeFilters.every((group) => {
      if (!group.length) return true;
      return group.some((value) => projectFilters.includes(value.toLowerCase()));
    });
    return matchesSearch && matchesFilters;
  });
}

function renderCards(target, items) {
  target.innerHTML = items.length
    ? items.map(projectCard).join("")
    : `<div class="empty-results">По выбранным фильтрам пока нет проектов.</div>`;
}

function renderFilterControls(target) {
  target.innerHTML = filterGroups
    .map((group) => {
      const options = group.options
        .map((option) => `<label><input type="checkbox" value="${option.value}" /> ${option.label}</label>`)
        .join("");
      return `
        <div class="filter-group" data-filter-group="${group.id}">
          <p class="filter-title">${group.title}</p>
          ${options}
        </div>
      `;
    })
    .join("");
}

function syncFilterInputs(filters) {
  filters.querySelectorAll("[data-filter-group]").forEach((group) => {
    const groupName = group.dataset.filterGroup;
    const active = state.filters[groupName] || [];
    group.querySelectorAll("input[type='checkbox']").forEach((input) => {
      input.checked = active.includes(input.value);
    });
  });
}

function readFilterInputs(filters) {
  const next = {};
  filters.querySelectorAll("[data-filter-group]").forEach((group) => {
    next[group.dataset.filterGroup] = Array.from(group.querySelectorAll("input[type='checkbox']:checked")).map((input) => input.value);
  });
  state.filters = Object.fromEntries(filterGroups.map((group) => [group.id, next[group.id] || []]));
}

function renderHome() {
  cloneTemplate("home-template");
  const home = app.querySelector("[data-home-screen]");
  const grid = app.querySelector("[data-project-grid]");
  const search = app.querySelector("[data-search]");
  const filters = app.querySelector("[data-filters]");
  const filterGroupsTarget = app.querySelector("[data-filter-groups]");
  const filtersOverlay = app.querySelector("[data-filters-overlay]");
  const uploadShortcut = app.querySelector("[data-upload-shortcut]");

  home.classList.toggle("is-authed", state.isAuthed);
  uploadShortcut.hidden = !state.isAuthed;
  renderFilterControls(filterGroupsTarget);
  renderCards(grid, filteredProjects());
  refreshProjectCards(grid);
  syncFilterInputs(filters);

  if (search) {
    search.value = state.search;
    search.addEventListener("input", (event) => {
      state.search = event.target.value;
      updateProjectCards(grid);
    });
  }

  app.querySelector("[data-filter-toggle]").addEventListener("click", () => {
    syncFilterInputs(filters);
    filtersOverlay.hidden = false;
    filters.classList.add("open");
  });

  app.querySelector("[data-close-filters]").addEventListener("click", () => {
    closeFilters();
  });

  filtersOverlay.addEventListener("click", (event) => {
    if (event.target === filtersOverlay) closeFilters();
  });

  app.querySelector("[data-clear-filters]").addEventListener("click", () => {
    filters.querySelectorAll("input[type='checkbox']").forEach((input) => {
      input.checked = false;
    });
    readFilterInputs(filters);
    updateProjectCards(grid);
  });

  app.querySelector("[data-apply-filters]").addEventListener("click", () => {
    readFilterInputs(filters);
    updateProjectCards(grid);
    closeFilters();
  });

  uploadShortcut.addEventListener("click", () => {
    window.location.hash = "upload";
  });
}

function closeFilters() {
  const overlay = app.querySelector("[data-filters-overlay]");
  const filters = app.querySelector("[data-filters]");
  if (!overlay || overlay.hidden) return;
  filters?.classList.remove("open");
  overlay.hidden = true;
}

function openAuth(mode = "login") {
  state.authMode = mode;
  document.querySelector("[data-modal-backdrop]")?.remove();

  const template = document.querySelector("#auth-modal-template");
  document.body.appendChild(template.content.cloneNode(true));
  updateAuthModal();

  document.querySelector("[data-close-modal]").addEventListener("click", closeAuth);
  document.querySelector("[data-modal-backdrop]").addEventListener("click", (event) => {
    if (event.target.matches("[data-modal-backdrop]")) closeAuth();
  });
  document.querySelector("[data-switch-auth]").addEventListener("click", (event) => {
    state.authMode = event.currentTarget.dataset.switchAuth;
    updateAuthModal();
  });
  document.querySelector("[data-auth-form]").addEventListener("submit", submitAuth);
  document.querySelector("#email").focus();
}

function updateAuthModal() {
  const isRegister = state.authMode === "register";
  const title = document.querySelector("[data-auth-title]");
  const subtitle = document.querySelector("[data-auth-subtitle]");
  const submit = document.querySelector("[data-auth-submit]");
  const password = document.querySelector("#password");
  const error = document.querySelector("[data-form-error]");

  title.textContent = isRegister ? "Регистрация" : "Вход";
  subtitle.innerHTML = isRegister
    ? `Уже есть аккаунт? <button type="button" data-switch-auth="login">Войти</button>`
    : `Нет аккаунта? <button type="button" data-switch-auth="register">Создать профиль</button>`;
  submit.textContent = isRegister ? "Создать профиль" : "Продолжить";
  password.autocomplete = isRegister ? "new-password" : "current-password";
  error.textContent = "";

  document.querySelector("[data-switch-auth]").addEventListener("click", (event) => {
    state.authMode = event.currentTarget.dataset.switchAuth;
    updateAuthModal();
  });
}

function closeAuth() {
  document.querySelector("[data-modal-backdrop]")?.remove();
  if (window.location.hash === "#login" || window.location.hash === "#register") {
    window.location.hash = "home";
  }
}

function closeAccountMenu() {
  const dropdown = document.querySelector("[data-account-dropdown]");
  const toggle = document.querySelector("[data-account-toggle]");
  if (!dropdown || dropdown.hidden) return;
  dropdown.hidden = true;
  toggle?.setAttribute("aria-expanded", "false");
}

async function submitAuth(event) {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const email = String(data.get("email") || "");
  const password = String(data.get("password") || "");
  const error = document.querySelector("[data-form-error]");

  if (!email.includes("@") || (state.authMode === "register" ? password.length < 8 : !password)) {
    error.textContent = state.authMode === "login" ? "Проверьте логин и пароль." : "Укажите почту и пароль от 8 символов.";
    return;
  }

  const submit = event.currentTarget.querySelector("[data-auth-submit]");
  submit.disabled = true;
  submit.textContent = "Проверяем...";
  error.textContent = "";

  try {
    const payload = state.authMode === "register"
      ? await apiJson("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({
            email,
            password,
            displayName: displayNameFromEmail(email)
          })
        })
      : await apiJson("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password })
        });

    setAuthedUser(payload.user);
    document.querySelector("[data-modal-backdrop]")?.remove();
    window.location.hash = state.authMode === "register" ? "account" : "home";
    route();
  } catch {
    error.textContent = state.authMode === "login"
      ? "Не удалось войти. Проверьте почту и пароль."
      : "Не удалось создать профиль. Возможно, почта уже зарегистрирована.";
    submit.disabled = false;
    updateAuthModal();
  }
}

function renderProfile() {
  cloneTemplate("profile-template");
  const grid = app.querySelector("[data-profile-grid]");
  const ownProjects = () => projects.filter((project) => project.author === "Виктор Жестянщиков");
  renderCards(grid, ownProjects());
  loadProjectsFromApi().then(() => {
    if (!document.body.contains(grid)) return;
    renderCards(grid, ownProjects());
  });
}

function renderAccount(editing = false) {
  cloneTemplate("account-template");
  const screen = app.querySelector("[data-account-screen]");
  const accountView = app.querySelector("[data-account-view]");
  const accountForm = app.querySelector("[data-account-form]");
  const emptyState = app.querySelector("[data-account-empty]");
  const preview = app.querySelector("[data-account-preview]");
  const projectsTarget = app.querySelector("[data-account-projects]");
  const primary = app.querySelector("[data-account-primary]");
  const secondary = app.querySelector("[data-account-secondary]");
  const accountName = app.querySelector("[data-account-name]");
  const accountCopy = app.querySelector("[data-account-copy]");
  const projectsCount = app.querySelector("[data-account-projects-count]");
  const pendingCount = app.querySelector("[data-account-pending-count]");
  const likesCount = app.querySelector("[data-account-likes-count]");

  screen.classList.toggle("is-editing", editing);
  accountView.hidden = editing;
  accountForm.hidden = !editing;
  emptyState.hidden = editing;
  preview.hidden = !editing;
  projectsTarget.hidden = true;
  primary.textContent = editing ? "Сохранить" : "Загрузить проект";
  secondary.textContent = editing ? "Отменить" : "Редактировать";
  accountName.textContent = state.currentUser?.displayName || "Ваш профиль";
  accountCopy.textContent = state.currentUser?.email
    ? `${state.currentUser.email} · ${state.currentUser.role === "ADMIN" ? "Администратор" : "Автор"}`
    : "Добавьте описание, чтобы другие авторы быстрее понимали ваш стиль и опыт.";

  if (!editing) {
    // The account page is now backend-backed. We show the familiar empty state
    // immediately, then replace it with real projects once /api/projects/me
    // responds. This keeps the screen usable even on a slow local backend.
    emptyState.querySelector("h2").textContent = "Загружаем ваши проекты";
    emptyState.querySelector("p").textContent = "Проверяем черновики, модерацию и опубликованные работы.";

    loadMyProjects()
      .then((items) => {
        if (!document.body.contains(screen)) return;
        renderAccountProjects(items, { emptyState, projectsTarget, projectsCount, pendingCount, likesCount });
      })
      .catch((error) => {
        console.warn("My projects load failed:", error);
        if (!document.body.contains(screen)) return;
        emptyState.hidden = false;
        projectsTarget.hidden = true;
        emptyState.querySelector("h2").textContent = "Не удалось загрузить проекты";
        emptyState.querySelector("p").textContent = "Проверьте backend и повторите попытку. Локальный кабинет остаётся доступен для загрузки новой работы.";
      });
  }

  app.querySelector("[data-edit-account]").addEventListener("click", () => {
    window.location.hash = "account/edit";
  });
  app.querySelector("[data-account-upload]").addEventListener("click", () => {
    window.location.hash = "upload";
  });
  primary.addEventListener("click", () => {
    window.location.hash = editing ? "account" : "upload";
  });
  secondary.addEventListener("click", () => {
    window.location.hash = editing ? "account" : "account/edit";
  });
  app.querySelector("[data-save-account]")?.addEventListener("click", () => {
    window.location.hash = "account";
  });
}

function renderAccountProjects(items, targets) {
  const { emptyState, projectsTarget, projectsCount, pendingCount, likesCount } = targets;
  const totalLikes = items.reduce((sum, project) => sum + project.likes, 0);

  projectsCount.textContent = String(items.length);
  pendingCount.textContent = String(items.filter((project) => project.status === "PENDING").length);
  likesCount.textContent = formatCompactNumber(totalLikes);

  if (!items.length) {
    emptyState.hidden = false;
    projectsTarget.hidden = true;
    emptyState.querySelector("h2").textContent = "Здесь будут ваши проекты";
    emptyState.querySelector("p").textContent = "Загрузите первую работу, заполните карточку проекта и отправьте её на модерацию.";
    return;
  }

  // We keep this as a separate renderer instead of reusing public projectCard:
  // the account card must show workflow status, while public catalog cards do
  // not need to reveal moderation details.
  emptyState.hidden = true;
  projectsTarget.hidden = false;
  projectsTarget.innerHTML = `
    <div class="section-head">
      <div>
        <p class="eyebrow">Мои проекты</p>
        <h2>Ваши работы и статусы</h2>
      </div>
      <a class="primary-button" href="#upload">Добавить проект</a>
    </div>
    <div class="cards-grid account-projects-grid">
      ${items.map(accountProjectCard).join("")}
    </div>
  `;
}

function projectStatusLabel(status) {
  const labels = {
    DRAFT: "Черновик",
    PENDING: "На модерации",
    PUBLISHED: "Опубликован",
    REJECTED: "Отклонён"
  };

  return labels[status] || "Без статуса";
}

function accountProjectCard(project) {
  const tags = project.category.length
    ? project.category.map((tag) => `<span>${tag}</span>`).join("")
    : "<span>Без тегов</span>";

  return `
    <a class="project-card account-project-card" href="#project/${project.id}">
      <div class="project-art">
        <img src="${project.image}" alt="${project.title}" loading="lazy" />
        <span class="status-pill account-status-pill">${projectStatusLabel(project.status)}</span>
      </div>
      <div class="card-body">
        <img class="mini-avatar" src="${project.avatar}" alt="" />
        <div class="card-content">
          <h3>${project.title}</h3>
          <p>${project.author}</p>
          <div class="tag-row">${tags}</div>
          <div class="meta-row">
            <span>${project.likes} лайков</span>
            <span>${project.views} просмотров</span>
          </div>
        </div>
      </div>
    </a>
  `;
}

function renderUpload(filled = false) {
  cloneTemplate("upload-template");
  const screen = app.querySelector("[data-upload-screen]");
  const image = app.querySelector("[data-upload-image]");
  const copy = app.querySelector("[data-upload-copy]");
  const title = app.querySelector("[data-upload-title]");
  const description = app.querySelector("[data-upload-desc]");
  const status = app.querySelector("[data-upload-status]");
  const fileInput = app.querySelector("[data-upload-files]");
  const submit = app.querySelector("[data-upload-submit]");
  // These variables live inside renderUpload because the current static app
  // recreates the screen on every route change. Keeping upload state local makes
  // reset/navigation behavior predictable and avoids global stale File objects.
  let selectedFiles = [];
  let previewObjectUrl = "";

  screen.classList.toggle("is-filled", filled);
  image.src = filled ? `${assets.uploadFilled}image-02.png` : `${assets.uploadEmpty}image-01.png`;
  copy.textContent = filled ? "Обложка загружена" : "Загрузите обложку проекта";
  title.value = filled ? "Кинетический куб: путь портала" : "";
  description.value = filled
    ? "Короткое описание проекта, задачи, инструментов и художественного решения. Работа построена вокруг портального объекта, плотного света и игрового настроения."
    : "";

  app.querySelectorAll("[data-tag]").forEach((button) => {
    const selected = filled && ["3D", "Blender", "Game art", "Sci-fi"].includes(button.dataset.tag);
    button.classList.toggle("selected", selected);
    button.addEventListener("click", () => {
      button.classList.toggle("selected");
    });
  });

  const showSelectedFiles = (files) => {
    selectedFiles = files;

    // Object URLs are browser-managed memory. Revoke the previous preview before
    // creating a new one so repeated file selections do not leak memory.
    if (previewObjectUrl) {
      URL.revokeObjectURL(previewObjectUrl);
      previewObjectUrl = "";
    }

    const firstImage = selectedFiles.find((file) => file.type.startsWith("image/"));
    screen.classList.toggle("is-filled", selectedFiles.length > 0 || filled);

    // Only image files can be previewed directly in the big cover area. Other
    // supported formats still upload, but keep the designed placeholder preview.
    if (firstImage) {
      previewObjectUrl = URL.createObjectURL(firstImage);
      image.src = previewObjectUrl;
    } else if (selectedFiles.length) {
      image.src = `${assets.uploadFilled}image-02.png`;
    } else {
      image.src = filled ? `${assets.uploadFilled}image-02.png` : `${assets.uploadEmpty}image-01.png`;
    }

    copy.textContent = selectedFiles.length
      ? `Выбрано файлов: ${selectedFiles.length}`
      : "Загрузите обложку проекта";
    status.textContent = selectedFiles.length
      ? `Готово к отправке файлов: ${selectedFiles.map((file) => file.name).join(", ")}`
      : "";

    if (selectedFiles[0] && !title.value.trim()) {
      // A filename is not a perfect title, but it is a helpful low-friction
      // default while we do not yet have a richer project creation wizard.
      title.value = selectedFiles[0].name.replace(/\.[^/.]+$/, "");
    }

    if (selectedFiles.length && !description.value.trim()) {
      description.value = "Коротко опишите идею проекта, использованные инструменты и что именно загружено в файлах.";
    }
  };

  fileInput.addEventListener("change", () => {
    showSelectedFiles([...fileInput.files]);
  });

  app.querySelectorAll("[data-upload-fill]").forEach((button) => {
    button.addEventListener("click", () => {
      // The old mock flow used these round preview buttons to switch to a filled
      // screen. In the API-backed flow they now open the same native file picker.
      fileInput.click();
    });
  });

  app.querySelector("[data-upload-drop]").addEventListener("click", () => {
    fileInput.click();
  });

  app.querySelector("[data-upload-reset]").addEventListener("click", () => {
    if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
    window.location.hash = "upload";
  });

  app.querySelector("[data-upload-form]").addEventListener("submit", async (event) => {
    event.preventDefault();
    // We validate the minimum required fields client-side to give immediate
    // feedback. Backend Zod validation still remains the source of truth.
    if (!title.value.trim() || !description.value.trim()) {
      status.textContent = "Заполните название и описание проекта.";
      return;
    }

    if (!selectedFiles.length) {
      status.textContent = "Добавьте хотя бы один файл проекта.";
      return;
    }

    submit.disabled = true;
    submit.textContent = "Загружаем...";
    status.textContent = "Создаём проект, загружаем файлы и отправляем на модерацию.";

    try {
      const project = await createProjectFromUpload({
        title: title.value.trim(),
        description: description.value.trim(),
        categorySlugs: selectedUploadCategorySlugs(screen),
        files: selectedFiles
      });

      status.textContent = "Проект отправлен на модерацию. Открываем страницу проекта.";
      if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
      window.location.hash = `project/${project.id}`;
    } catch (error) {
      console.warn("Upload failed:", error);
      submit.disabled = false;
      submit.textContent = "Опубликовать";
      status.textContent = "Не удалось загрузить проект. Проверьте backend и попробуйте ещё раз.";
    }
  });
}

function renderAdminModeration(status = "PENDING") {
  cloneTemplate("admin-template");
  const screen = app.querySelector("[data-admin-screen]");
  const list = app.querySelector("[data-admin-list]");
  const statusCopy = app.querySelector("[data-admin-status-copy]");
  const tabs = app.querySelector("[data-admin-tabs]");

  if (state.currentUser?.role !== "ADMIN") {
    // This branch should be rare because the route already checks isAuthed and
    // the menu hides the admin link. It is still useful for manual #admin visits.
    list.innerHTML = `
      <div class="admin-empty">
        <h2>Недостаточно прав</h2>
        <p>Модерация доступна только пользователю с ролью ADMIN.</p>
      </div>
    `;
    statusCopy.textContent = "Войдите под администратором, например admin@creatur.local из seed-данных.";
    return;
  }

  const activateTab = (nextStatus) => {
    // Tabs are plain buttons, not links, because the current MVP keeps the
    // selected admin status as local screen state rather than another hash route.
    tabs.querySelectorAll("[data-admin-status]").forEach((button) => {
      button.classList.toggle("selected", button.dataset.adminStatus === nextStatus);
    });
  };

  const renderList = (items) => {
    // The whole list is re-rendered after each moderation action. That is simple
    // and reliable for the MVP; later we can update only one row if the list
    // becomes large enough for performance to matter.
    list.innerHTML = items.length
      ? items.map(adminProjectCard).join("")
      : `
        <div class="admin-empty">
          <h2>Очередь пуста</h2>
          <p>Для выбранного статуса сейчас нет проектов. Это редкий приятный случай: либо всё проверено, либо пользователи ещё не успели насыпать искусства в печь.</p>
        </div>
      `;

    list.querySelectorAll("[data-admin-action]").forEach((button) => {
      button.addEventListener("click", async () => {
        const projectId = button.dataset.projectId;
        const action = button.dataset.adminAction;
        const row = button.closest("[data-admin-project]");
        // Disable the row visually while the request is in-flight. This prevents
        // accidental double-publish/double-reject clicks.
        row?.classList.add("is-busy");
        statusCopy.textContent = action === "publish" ? "Публикуем проект..." : "Отклоняем проект...";

        try {
          const updatedProject = await moderateProject(projectId, action);
          upsertProject(updatedProject);
          await refreshAdminList(status);
          statusCopy.textContent = action === "publish"
            ? "Проект опубликован и теперь доступен в каталоге."
            : "Проект отклонён и убран из очереди модерации.";
        } catch (error) {
          console.warn("Moderation action failed:", error);
          row?.classList.remove("is-busy");
          statusCopy.textContent = "Не удалось выполнить действие. Проверьте backend и права администратора.";
        }
      });
    });
  };

  const refreshAdminList = async (nextStatus) => {
    // Keep all admin list loading in one function so tab clicks and post-action
    // refreshes behave the same way.
    activateTab(nextStatus);
    list.innerHTML = `<div class="admin-empty"><h2>Загружаем...</h2><p>Получаем проекты из backend.</p></div>`;
    statusCopy.textContent = "Загрузка списка модерации.";

    try {
      const items = await loadAdminProjects(nextStatus);
      if (!document.body.contains(screen)) return;
      renderList(items);
      statusCopy.textContent = `Найдено проектов: ${items.length}.`;
    } catch (error) {
      console.warn("Admin projects load failed:", error);
      list.innerHTML = `
        <div class="admin-empty">
          <h2>Не удалось загрузить модерацию</h2>
          <p>Проверьте, что backend запущен, а текущий пользователь имеет роль ADMIN.</p>
        </div>
      `;
      statusCopy.textContent = "Backend не вернул список проектов.";
    }
  };

  tabs.querySelectorAll("[data-admin-status]").forEach((button) => {
    button.addEventListener("click", () => {
      refreshAdminList(button.dataset.adminStatus);
    });
  });

  refreshAdminList(status);
}

function adminProjectCard(project) {
  // Status labels live near the admin card because they are presentation copy.
  // The backend continues to speak stable enum values.
  const tags = project.category.length
    ? project.category.map((tag) => `<span>${tag}</span>`).join("")
    : "<span>Без тегов</span>";
  const canModerate = project.status === "PENDING" || project.status === "DRAFT";

  return `
    <article class="admin-project" data-admin-project>
      <a class="admin-project-art" href="#project/${project.id}">
        <img src="${project.image}" alt="${project.title}" loading="lazy" />
      </a>
      <div class="admin-project-body">
        <div>
          <span class="status-pill">${projectStatusLabel(project.status)}</span>
          <h2>${project.title}</h2>
          <p>${project.description}</p>
        </div>
        <div class="tag-row">${tags}</div>
        <div class="admin-project-meta">
          <span>Автор: ${project.author}</span>
          <span>${project.likes} лайков</span>
          <span>${project.views} просмотров</span>
        </div>
        <div class="admin-project-actions">
          <a class="ghost-button" href="#project/${project.id}">Открыть</a>
          <button class="primary-button" type="button" data-admin-action="publish" data-project-id="${project.id}" ${canModerate ? "" : "disabled"}>Опубликовать</button>
          <button class="ghost-button" type="button" data-admin-action="reject" data-project-id="${project.id}" ${canModerate ? "" : "disabled"}>Отклонить</button>
        </div>
      </div>
    </article>
  `;
}

function renderProject(id) {
  cloneTemplate("project-template");
  const page = app.querySelector("[data-project-page]");
  const project = projects.find((item) => item.id === id) || fallbackProjects[0];

  // Render immediately from current data, then refresh with the dedicated
  // detail endpoint. This keeps navigation instant while still using backend truth.
  renderProjectContent(page, project);

  loadProjectFromApi(id).then((apiProject) => {
    if (window.location.hash !== `#project/${id}` || !document.body.contains(page)) return;
    renderProjectContent(page, apiProject);
  });
}

function renderProjectContent(target, project) {
  const altImage = project.id === "water-orb" ? `${assets.projectForeign}image-02.png` : `${assets.projectOwn}image-02.png`;

  target.innerHTML = `
    <aside class="project-sidebar">
      <img class="mini-avatar" src="${project.avatar}" alt="" />
      <h1>${project.title}</h1>
      <p>${project.author}</p>
      <button class="primary-button like-button" type="button" data-like-button>Нравится: ${project.likes}</button>
      <div class="project-description">${project.description}</div>
    </aside>
    <div class="project-gallery">
      <img src="${project.image}" alt="${project.title}" />
      <img src="${altImage}" alt="" />
    </div>
  `;

  target.querySelector("[data-like-button]").addEventListener("click", async (event) => {
    if (!state.isAuthed) {
      window.location.hash = "login";
      return;
    }

    const button = event.currentTarget;
    button.disabled = true;
    button.textContent = "Ставим лайк...";

    try {
      await apiJson(`/api/projects/${encodeURIComponent(project.id)}/like`, { method: "POST" });
      const refreshedProject = await loadProjectFromApi(project.id);
      if (document.body.contains(target)) {
        renderProjectContent(target, refreshedProject);
      }
    } catch (error) {
      console.warn("Like failed:", error);
      button.disabled = false;
      button.textContent = `Нравится: ${project.likes}`;
    }
  });
}

document.querySelector("[data-menu-button]").addEventListener("click", () => {
  header.classList.toggle("menu-open");
});

document.addEventListener("click", (event) => {
  if (!event.target.closest("[data-account-menu]")) {
    closeAccountMenu();
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeAuth();
    closeAccountMenu();
    closeFilters();
  }
});

window.addEventListener("hashchange", route);
syncAuthFromApi().finally(route);
