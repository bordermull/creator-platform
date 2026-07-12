const assets = {
  home: "./assets/extracted/home-before-registration/",
  authedHome: "./assets/extracted/home-after-registration/",
  userProfile: "./assets/extracted/user-profile/",
  account: "./assets/extracted/account-edit/",
  projectOwn: "./assets/extracted/project-own-liked/",
  projectForeign: "./assets/extracted/project-public-foreign/"
};

const projects = [
  {
    id: "portal-cube",
    title: "Проект мистического куба",
    author: "Виктор Жестянщиков",
    avatar: `${assets.authedHome}image-01.png`,
    image: `${assets.home}image-01.png`,
    category: ["3D", "Blender", "sci-fi"],
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
    likes: 229,
    views: "1.2k",
    description: "Экспериментальная работа с прозрачными материалами, свечением и плавным движением."
  }
];

const state = {
  isAuthed: localStorage.getItem("creatur-auth") === "true",
  authMode: "login",
  search: ""
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

  if (hash === "upload") {
    if (!state.isAuthed) {
      window.location.hash = "login";
      return;
    }
    renderUpload();
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
      <a class="ghost-button" href="#upload">Загрузить</a>
      <a class="avatar-button" href="#account" aria-label="Перейти в личный кабинет">
        <img src="${assets.account}image-01.png" alt="" />
      </a>
    `
    : `<a class="ghost-button" href="#login">Вход</a>`;
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
  return projects.filter((project) => {
    if (!q) return true;
    return `${project.title} ${project.author} ${project.category.join(" ")}`.toLowerCase().includes(q);
  });
}

function renderCards(target, items) {
  target.innerHTML = items.map(projectCard).join("");
}

function renderHome() {
  cloneTemplate("home-template");
  const home = app.querySelector("[data-home-screen]");
  const grid = app.querySelector("[data-project-grid]");
  const search = app.querySelector("[data-search]");
  const filters = app.querySelector("[data-filters]");
  const authedToolbar = app.querySelector("[data-authed-toolbar]");

  home.classList.toggle("is-authed", state.isAuthed);
  authedToolbar.hidden = !state.isAuthed;
  renderCards(grid, filteredProjects());

  if (search) {
    search.value = state.search;
    search.addEventListener("input", (event) => {
      state.search = event.target.value;
      renderCards(grid, filteredProjects());
    });
  }

  app.querySelector("[data-filter-toggle]").addEventListener("click", () => {
    filters.classList.toggle("open");
  });

  app.querySelector("[data-clear-filters]").addEventListener("click", () => {
    app.querySelectorAll("input[type='checkbox']").forEach((input) => {
      input.checked = false;
    });
  });

  app.querySelector("[data-apply-filters]").addEventListener("click", () => {
    filters.classList.remove("open");
  });

  app.querySelector("[data-upload-shortcut]").addEventListener("click", () => {
    window.location.hash = "upload";
  });
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

function renderUpload() {
  cloneTemplate("upload-template");
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

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeAuth();
});

window.addEventListener("hashchange", route);
route();
