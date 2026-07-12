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

const projects = [
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

const state = {
  isAuthed: localStorage.getItem("creatur-auth") === "true",
  authMode: "login",
  search: "",
  filters: defaultFilterState()
};

const app = document.querySelector("#app");
const header = document.querySelector("[data-header]");
const authActions = document.querySelector("[data-auth-actions]");

function route() {
  const hash = window.location.hash.replace("#", "") || "home";
  renderHeader();

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

  if (hash.startsWith("project/")) {
    renderProject(hash.split("/")[1]);
    return;
  }

  renderHome();
}

function cloneTemplate(id) {
  const template = document.querySelector(`#${id}`);
  app.replaceChildren(template.content.cloneNode(true));
}

function renderHeader() {
  authActions.innerHTML = state.isAuthed
    ? `
      <div class="account-menu" data-account-menu>
        <button class="avatar-button" type="button" data-account-toggle aria-expanded="false" aria-label="Открыть меню аккаунта">
          <img src="${assets.account}image-01.png" alt="" />
        </button>
        <div class="account-dropdown" data-account-dropdown hidden>
          <a href="#account">Личный кабинет</a>
          <a href="#upload">Загрузить проект</a>
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
    state.isAuthed = false;
    localStorage.removeItem("creatur-auth");
    window.location.hash = "home";
    route();
  });
}

function projectCard(project) {
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
  syncFilterInputs(filters);

  if (search) {
    search.value = state.search;
    search.addEventListener("input", (event) => {
      state.search = event.target.value;
      renderCards(grid, filteredProjects());
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
    renderCards(grid, filteredProjects());
  });

  app.querySelector("[data-apply-filters]").addEventListener("click", () => {
    readFilterInputs(filters);
    renderCards(grid, filteredProjects());
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

function submitAuth(event) {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const email = String(data.get("email") || "");
  const password = String(data.get("password") || "");
  const error = document.querySelector("[data-form-error]");

  if (!email.includes("@") || password.length < 4) {
    error.textContent = state.authMode === "login" ? "Проверьте логин и пароль." : "Укажите почту и пароль от 4 символов.";
    return;
  }

  state.isAuthed = true;
  localStorage.setItem("creatur-auth", "true");
  document.querySelector("[data-modal-backdrop]")?.remove();
  window.location.hash = state.authMode === "register" ? "account" : "home";
  route();
}

function renderProfile() {
  cloneTemplate("profile-template");
  renderCards(
    app.querySelector("[data-profile-grid]"),
    projects.filter((project) => project.author === "Виктор Жестянщиков")
  );
}

function renderAccount(editing = false) {
  cloneTemplate("account-template");
  const screen = app.querySelector("[data-account-screen]");
  const accountView = app.querySelector("[data-account-view]");
  const accountForm = app.querySelector("[data-account-form]");
  const emptyState = app.querySelector("[data-account-empty]");
  const preview = app.querySelector("[data-account-preview]");
  const primary = app.querySelector("[data-account-primary]");
  const secondary = app.querySelector("[data-account-secondary]");

  screen.classList.toggle("is-editing", editing);
  accountView.hidden = editing;
  accountForm.hidden = !editing;
  emptyState.hidden = editing;
  preview.hidden = !editing;
  primary.textContent = editing ? "Сохранить" : "Загрузить проект";
  secondary.textContent = editing ? "Отменить" : "Редактировать";

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

function renderUpload(filled = false) {
  cloneTemplate("upload-template");
  const screen = app.querySelector("[data-upload-screen]");
  const image = app.querySelector("[data-upload-image]");
  const copy = app.querySelector("[data-upload-copy]");
  const title = app.querySelector("[data-upload-title]");
  const description = app.querySelector("[data-upload-desc]");
  const status = app.querySelector("[data-upload-status]");

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

  app.querySelectorAll("[data-upload-fill]").forEach((button) => {
    button.addEventListener("click", () => {
      window.location.hash = "upload/filled";
    });
  });

  app.querySelector("[data-upload-drop]").addEventListener("click", () => {
    if (!screen.classList.contains("is-filled")) {
      window.location.hash = "upload/filled";
    }
  });

  app.querySelector("[data-upload-reset]").addEventListener("click", () => {
    window.location.hash = "upload";
  });

  app.querySelector("[data-upload-form]").addEventListener("submit", (event) => {
    event.preventDefault();
    if (!title.value.trim() || !description.value.trim()) {
      status.textContent = "Заполните название и описание проекта.";
      return;
    }
    status.textContent = "Проект подготовлен к публикации. Следующий шаг - страница проекта.";
  });
}

function renderProject(id) {
  cloneTemplate("project-template");
  const project = projects.find((item) => item.id === id) || projects[0];
  const altImage = project.id === "water-orb" ? `${assets.projectForeign}image-02.png` : `${assets.projectOwn}image-02.png`;

  app.querySelector("[data-project-page]").innerHTML = `
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

  app.querySelector("[data-like-button]").addEventListener("click", (event) => {
    project.likes += 1;
    event.currentTarget.textContent = `Нравится: ${project.likes}`;
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
route();
