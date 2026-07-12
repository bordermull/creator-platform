const projects = [
  {
    id: "portal-cube",
    title: "Проект мистического куба",
    author: "Виктор Жестянщиков",
    category: ["3D", "Blender", "sci-fi"],
    likes: 384,
    views: "2.1k",
    art: "blue",
    description:
      "Серия кадров для портального артефакта: свет, напряжение формы и ощущение большой игровой сцены."
  },
  {
    id: "iron-gloves",
    title: "Концепт перчаток для силы",
    author: "Клара Морт",
    category: ["3D", "Unreal", "game"],
    likes: 268,
    views: "1.7k",
    art: "orange",
    description:
      "Детализированный hard-surface объект с акцентом на металл, соединения и выразительный силуэт."
  },
  {
    id: "fire-ritual",
    title: "Арт магического ритуала",
    author: "Артем Нокс",
    category: ["digital", "fantasy"],
    likes: 421,
    views: "3.9k",
    art: "purple",
    description:
      "Иллюстрация с контрастом холодного пространства и теплого магического света."
  },
  {
    id: "night-drone",
    title: "Рычащий дрон разведчик",
    author: "Мария Рэй",
    category: ["3D", "Unity", "sci-fi"],
    likes: 197,
    views: "980",
    art: "steel",
    description:
      "Игровой объект с агрессивной пластикой, темным корпусом и световыми акцентами."
  },
  {
    id: "signal-room",
    title: "Сигнальная комната",
    author: "Денис Варг",
    category: ["digital", "sci-fi"],
    likes: 512,
    views: "4.4k",
    art: "blue",
    description:
      "Окружение для сюжетной сцены, построенное вокруг света интерфейсов и глубины кадра."
  },
  {
    id: "ancient-key",
    title: "Ключ древнего механизма",
    author: "Лина Соул",
    category: ["3D", "Blender", "fantasy"],
    likes: 145,
    views: "760",
    art: "orange",
    description:
      "Пропс для приключенческой игры: потертый металл, декоративные детали и читаемая форма."
  },
  {
    id: "champion",
    title: "Портрет боевого чемпиона",
    author: "Виктор Жестянщиков",
    category: ["digital", "game"],
    likes: 631,
    views: "5.2k",
    art: "steel",
    description:
      "Крупный эмоциональный портрет героя с напряженным взглядом и кинематографичным светом."
  },
  {
    id: "water-orb",
    title: "Чужой открытый проект",
    author: "Олег Фрост",
    category: ["motion", "sci-fi"],
    likes: 229,
    views: "1.2k",
    art: "purple",
    description:
      "Экспериментальная работа с прозрачными материалами, свечением и плавным движением."
  }
];

const state = {
  isAuthed: false,
  search: "",
  filtersOpen: false
};

const app = document.querySelector("#app");
const header = document.querySelector("[data-header]");
const authActions = document.querySelector("[data-auth-actions]");

function route() {
  const hash = window.location.hash.replace("#", "") || "home";
  renderHeader();

  if (hash === "login" || hash === "register") {
    renderAuth(hash);
    return;
  }

  if (hash === "profile") {
    renderProfile();
    return;
  }

  if (hash === "upload") {
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
    ? `<a class="ghost-button" href="#upload">Загрузить</a><a class="primary-button" href="#profile">Профиль</a>`
    : `<a class="ghost-button" href="#login">Вход</a>`;
}

function projectCard(project) {
  return `
    <a class="project-card" href="#project/${project.id}">
      <div class="project-art ${project.art}"></div>
      <div class="card-body">
        <div class="mini-avatar">${project.author[0]}</div>
        <div>
          <h3>${project.title}</h3>
          <p>${project.author}</p>
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
    return `${project.title} ${project.author}`.toLowerCase().includes(q);
  });
}

function renderCards(target, items) {
  target.innerHTML = items.map(projectCard).join("");
}

function renderHome() {
  cloneTemplate("home-template");
  const grid = app.querySelector("[data-project-grid]");
  const search = app.querySelector("[data-search]");
  const filters = app.querySelector("[data-filters]");

  renderCards(grid, filteredProjects());
  search.value = state.search;
  search.addEventListener("input", (event) => {
    state.search = event.target.value;
    renderCards(grid, filteredProjects());
  });

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
}

function renderAuth(mode) {
  cloneTemplate("auth-template");
  const isRegister = mode === "register";
  const title = app.querySelector("[data-auth-title]");
  const subtitle = app.querySelector("[data-auth-subtitle]");
  const submit = app.querySelector("[data-auth-submit]");
  const error = app.querySelector("[data-form-error]");

  title.textContent = isRegister ? "Регистрация" : "Вход";
  subtitle.innerHTML = isRegister
    ? `Уже есть аккаунт? <a href="#login">Войти</a>`
    : `Нет аккаунта? <a href="#register">Создать профиль</a>`;
  submit.textContent = isRegister ? "Создать профиль" : "Продолжить";

  app.querySelector("[data-auth-form]").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") || "");
    const password = String(data.get("password") || "");

    if (!email.includes("@") || password.length < 4) {
      error.textContent = "Проверьте логин и пароль.";
      return;
    }

    state.isAuthed = true;
    window.location.hash = "profile";
  });
}

function renderProfile() {
  cloneTemplate("profile-template");
  renderCards(
    app.querySelector("[data-profile-grid]"),
    projects.filter((project) => project.author === "Виктор Жестянщиков")
  );
}

function renderUpload() {
  cloneTemplate("upload-template");
}

function renderProject(id) {
  cloneTemplate("project-template");
  const project = projects.find((item) => item.id === id) || projects[0];
  app.querySelector("[data-project-page]").innerHTML = `
    <aside class="project-sidebar">
      <div class="mini-avatar">${project.author[0]}</div>
      <h1>${project.title}</h1>
      <p>${project.author}</p>
      <button class="primary-button like-button" type="button" data-like-button>Нравится: ${project.likes}</button>
      <div class="project-description">${project.description}</div>
    </aside>
    <div class="project-gallery">
      <div class="project-art ${project.art}"></div>
      <div class="project-art ${project.art === "blue" ? "steel" : "blue"}"></div>
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

window.addEventListener("hashchange", route);
route();
