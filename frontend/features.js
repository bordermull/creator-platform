// Эти экраны дополняют исходный hash-router без сборщика. Данные приходят
// только из API: перезагрузка страницы не теряет профиль, подписки и закладки.
// Пользовательский текст экранируется перед вставкой в HTML.
const safe = escapeHtml;
const avatarOf = (user) => user.avatarFileId || "/assets/favicon.svg";

function featureRoot(message = "Загружаем данные…") {
  const root = document.createElement("section");
  root.className = "feature-screen";
  root.innerHTML = `<p role="status">${safe(message)}</p>`;
  app.replaceChildren(root);
  return root;
}
function featureError(root, message = "Не удалось выполнить действие. Проверьте соединение и попробуйте ещё раз.") {
  let alert = root.querySelector("[data-feature-error]");
  if (!alert) { alert = document.createElement("p"); alert.dataset.featureError = ""; alert.setAttribute("role", "alert"); root.prepend(alert); }
  alert.textContent = message;
}
function requireLogin() {
  if (state.currentUser) return true;
  window.location.hash = "login";
  return false;
}

async function renderPersistedProfile(id, editing = false, ownPage = false) {
  const root = featureRoot();
  if (!id) { root.innerHTML = '<h1>Выберите автора</h1><a href="#home">Перейти в каталог</a>'; return; }
  try {
    const payload = await apiJson(`/api/users/${encodeURIComponent(id)}`);
    if (!root.isConnected) return;
    const user = payload.user;
    const isOwner = state.currentUser?.id === id;
    const canEdit = isOwner || state.currentUser?.role === "ADMIN";
    if (editing && !canEdit) { featureError(root, "Редактирование этого профиля недоступно."); return; }
    const items = isOwner && ownPage ? await loadMyProjects() : payload.projects.map(mapApiProject);
    if (!root.isConnected) return;
    root.classList.add("creator-page");
    root.innerHTML = `
      <div class="creator-cover">${user.coverUrl ? `<img src="${safe(user.coverUrl)}" alt="Обложка профиля" />` : ""}</div>
      <div class="creator-layout">
        <aside class="creator-sidebar">
          <img class="creator-avatar" src="${safe(avatarOf(user))}" alt="Аватар автора" />
          ${canEdit ? `<a class="creator-edit" href="#${isOwner ? "account/edit" : `profile/${id}/edit`}">Ред.</a>` : ""}
          <p class="creator-followers">Подписчиков: ${user._count.followers}</p>
          <h1>${safe(user.displayName)}</h1>
          ${isOwner ? '<a class="primary-button full" href="#upload">+ Загрузить проект</a>' : '<button class="primary-button full" data-follow>+ Подписаться</button>'}
          <div class="creator-details">
            <p><img src="/assets/figma/info.svg" alt="" />${safe(user.specialty || "Специализация не указана")}</p>
            <p><img src="/assets/figma/contact.svg" alt="" />${safe(user.contact || "Контакт не указан")}</p>
            <p><img src="/assets/figma/location.svg" alt="" />${safe(user.location || "Город не указан")}</p>
          </div>
          <p class="creator-bio">${safe(user.bio || "Автор ещё не добавил описание.")}</p>
          <dl><div><dt>Всего проектов:</dt><dd>${items.length}</dd></div><div><dt>Дата регистрации:</dt><dd>${new Date(user.createdAt).toLocaleDateString("ru-RU")}</dd></div></dl>
        </aside>
        <div class="creator-content">
          ${editing ? profileForm(user) : `<h2>${isOwner && ownPage ? "Мои проекты" : "Проекты автора"}</h2><div class="cards-grid">${items.map((item) => `<div class="creator-project">${projectCard(item)}${isOwner ? `<p class="status-pill">${projectStatusLabel(item.status)}</p>${canEditProjectInUi(item) ? `<a class="ghost-button" href="#project/${item.id}/edit">Редактировать</a>` : ""}` : ""}${canEdit ? `<button class="ghost-button" data-delete-project="${item.id}">Удалить</button>` : ""}</div>`).join("") || '<p>Здесь пока нет проектов.</p>'}</div>`}
        </div>
      </div>`;
    const follow = root.querySelector("[data-follow]");
    if (follow) bindFollow(follow, id, user.isFollowing, (following) => {
      // Обновляем число только после успешного ответа БД, а не оптимистично.
      const count = user._count.followers + (following ? 1 : 0) - (user.isFollowing ? 1 : 0);
      root.querySelector(".creator-followers").textContent = `Подписчиков: ${count}`;
    });
    root.querySelectorAll("[data-delete-project]").forEach((button) => button.addEventListener("click", async () => {
      if (!confirm("Удалить проект из профиля и каталога?")) return;
      button.disabled = true;
      try { await apiJson(`/api/projects/${button.dataset.deleteProject}`, { method: "DELETE" }); invalidateCatalog(); renderPersistedProfile(id, false, ownPage); }
      catch { featureError(root); button.disabled = false; }
    }));
    if (editing) bindProfileForm(root, user, isOwner);
  } catch { if (root.isConnected) featureError(root, "Профиль не найден или сервер недоступен."); }
}

function profileForm(user) {
  const field = (name, label, max) => `<label>${label}<input name="${name}" value="${safe(user[name] || "")}" maxlength="${max}" ${name === "displayName" ? 'required minlength="2"' : ""} /></label>`;
  return `<form class="profile-editor" data-profile-form>
    <h2>Редактирование профиля</h2>
    ${field("displayName", "Имя автора", 80)}${field("specialty", "Специализация", 160)}${field("contact", "Контакт", 200)}${field("location", "Город", 100)}
    <label>О себе<textarea name="bio" maxlength="2000">${safe(user.bio || "")}</textarea></label>
    <label>Аватар · PNG, JPEG, WebP до 2 МБ<input type="file" name="avatarFileId" accept="image/png,image/jpeg,image/webp" /></label>
    <label>Обложка · PNG, JPEG, WebP до 2 МБ<input type="file" name="coverUrl" accept="image/png,image/jpeg,image/webp" /></label>
    <button class="primary-button" type="submit">Сохранить</button><a class="ghost-button" href="#${state.currentUser?.id === user.id ? "account" : `profile/${user.id}`}">Отменить</a>
    <p role="status" data-save-status></p>
  </form>`;
}
function readProfileImage(file) {
  if (file.size > 2 * 1024 * 1024 || !["image/png", "image/jpeg", "image/webp"].includes(file.type)) throw new Error("Выберите PNG, JPEG или WebP размером до 2 МБ.");
  return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });
}
function bindProfileForm(root, user, isOwner) {
  root.querySelector("form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const status = form.querySelector("[data-save-status]");
    const button = form.querySelector("[type=submit]");
    button.disabled = true;
    try {
      const data = new FormData(form);
      const body = Object.fromEntries(["displayName", "specialty", "contact", "location", "bio"].map((key) => [key, data.get(key)]));
      for (const key of ["avatarFileId", "coverUrl"]) { const file = data.get(key); if (file?.size) body[key] = await readProfileImage(file); }
      status.textContent = "Сохраняем…";
      await apiJson(`/api/users/${user.id}`, { method: "PATCH", body: JSON.stringify(body) });
      if (isOwner) await syncAuthFromApi();
      window.location.hash = isOwner ? "account" : `profile/${user.id}`;
    } catch (error) { status.textContent = error.message.startsWith("Выберите") ? error.message : "Не удалось сохранить профиль."; }
    finally { button.disabled = false; }
  });
}

function bindFollow(button, id, following, onChange = () => {}) {
  const update = () => { button.textContent = following ? "Отписаться" : "+ Подписаться"; button.classList.toggle("is-following", following); button.setAttribute("aria-pressed", String(following)); };
  update();
  button.addEventListener("click", async () => {
    if (!requireLogin()) return;
    button.disabled = true;
    try { await apiJson(`/api/users/${id}/follow`, { method: following ? "DELETE" : "POST" }); following = !following; update(); onChange(following); }
    catch { featureError(app); }
    finally { button.disabled = false; }
  });
}

async function renderSavedPage(kind) {
  if (!requireLogin()) return;
  const root = featureRoot();
  try {
    const payload = await apiJson(`/api/users/me/${kind}`);
    if (!root.isConnected) return;
    root.innerHTML = `<h1 class="saved-title">ВАШИ <span>${kind === "following" ? "ПОДПИСКИ" : "ЗАКЛАДКИ"}</span></h1><div class="${kind === "following" ? "following-grid" : "cards-grid"}"></div>`;
    const grid = root.lastElementChild;
    if (kind === "bookmarks") { renderCards(grid, payload.projects.map(mapApiProject)); return; }
    grid.innerHTML = payload.users.map((user) => `<article class="following-card"><a href="#profile/${user.id}"><img src="${safe(avatarOf(user))}" alt="" /><h2>${safe(user.displayName)}</h2><p>Подписчиков: ${user._count.followers}</p><p>${safe(user.specialty || "Автор CREATUR")}</p></a><button class="primary-button full" data-follow="${user.id}"></button></article>`).join("") || "<p>Вы пока ни на кого не подписаны. Откройте проект и перейдите к его автору.</p>";
    // После отписки перечитываем список: в нём должны остаться только действующие связи.
    grid.querySelectorAll("[data-follow]").forEach((button) => bindFollow(button, button.dataset.follow, true, () => renderSavedPage(kind)));
  } catch { featureError(root); }
}

function invalidateCatalog() { projectsRequestKey = ""; projects = []; }

async function wireProjectFeatures(target, project) {
  target.querySelectorAll("model-viewer").forEach((viewer) => {
    viewer.addEventListener("error", () => { viewer.querySelector(".model-viewer-fallback").hidden = false; });
  });
  const sidebar = target.querySelector(".project-sidebar");
  const mine = state.currentUser?.id === project.authorId;
  // Профиль открывается по id автора из PostgreSQL, а не по имени из макета.
  const actions = document.createElement("div");
  actions.className = "project-actions";
  actions.innerHTML = `<a class="ghost-button" href="#profile/${project.authorId}">Профиль автора</a>${!mine ? '<button class="primary-button" data-follow></button>' : ""}<div class="tag-row">${project.category.map((tag) => `<span>${safe(tag)}</span>`).join("")}</div>${mine || state.currentUser?.role === "ADMIN" ? '<button class="ghost-button" data-delete>Удалить проект</button>' : ""}`;
  sidebar.append(actions);
  const follow = actions.querySelector("[data-follow]");
  if (follow) {
    follow.disabled = true;
    try { const payload = await apiJson(`/api/users/${project.authorId}`); if (!target.isConnected) return; follow.disabled = false; bindFollow(follow, project.authorId, payload.user.isFollowing); }
    catch { follow.remove(); }
  }
  actions.querySelector("[data-delete]")?.addEventListener("click", async () => {
    if (!confirm("Удалить проект из каталога?")) return;
    try { await apiJson(`/api/projects/${project.id}`, { method: "DELETE" }); invalidateCatalog(); window.location.hash = "account"; }
    catch { featureError(target); }
  });
  if (project.status !== "PUBLISHED") { target.querySelector("[data-like-button]").hidden = true; return; }
  try {
    const activity = await apiJson(`/api/projects/${project.id}/activity`);
    if (!target.isConnected) return;
    const like = target.querySelector("[data-like-button]");
    like.dataset.liked = String(activity.liked);
    like.setAttribute("aria-pressed", String(activity.liked));
    like.textContent = `${activity.liked ? "Убрать лайк" : "Нравится"}: ${project.likes}`;
    const bookmark = document.createElement("button");
    bookmark.className = "ghost-button";
    bookmark.textContent = activity.bookmarked ? "Убрать из закладок" : "В закладки";
    actions.append(bookmark);
    bookmark.addEventListener("click", async () => {
      if (!requireLogin()) return;
      bookmark.disabled = true;
      try { await apiJson(`/api/projects/${project.id}/bookmark`, { method: activity.bookmarked ? "DELETE" : "POST" }); activity.bookmarked = !activity.bookmarked; bookmark.textContent = activity.bookmarked ? "Убрать из закладок" : "В закладки"; }
      catch { featureError(target); } finally { bookmark.disabled = false; }
    });
    const comments = document.createElement("section");
    comments.className = "project-comments";
    comments.innerHTML = `<h2>Комментарии</h2>${activity.comments.map((comment) => `<article><a href="#profile/${comment.user.id}">${safe(comment.user.displayName)}</a><p>${safe(comment.body)}</p>${state.currentUser?.id === comment.userId || state.currentUser?.role === "ADMIN" ? `<button class="ghost-button" data-remove-comment="${comment.id}">Удалить</button>` : ""}</article>`).join("") || '<p>Пока нет комментариев.</p>'}${state.currentUser ? '<form><label>Ваш комментарий<textarea name="body" required maxlength="2000"></textarea></label><button class="primary-button">Отправить</button></form>' : '<a href="#login">Войдите, чтобы оставить комментарий</a>'}`;
    target.querySelector(".project-gallery").append(comments);
    comments.querySelector("form")?.addEventListener("submit", async (event) => {
      event.preventDefault(); const form = event.currentTarget; form.querySelector("button").disabled = true;
      try { await apiJson(`/api/projects/${project.id}/comments`, { method: "POST", body: JSON.stringify({ body: new FormData(form).get("body") }) }); renderProject(project.id); }
      catch { featureError(comments); form.querySelector("button").disabled = false; }
    });
    comments.querySelectorAll("[data-remove-comment]").forEach((button) => button.addEventListener("click", async () => {
      try { await apiJson(`/api/projects/${project.id}/comments/${button.dataset.removeComment}`, { method: "DELETE" }); renderProject(project.id); } catch { featureError(comments); }
    }));
  } catch { featureError(target, "Не удалось загрузить реакции и комментарии."); }
}

function renderPasswordReset(hash) {
  document.querySelector("[data-modal-backdrop]")?.remove();
  const confirmReset = hash.startsWith("reset-password/");
  const root = featureRoot();
  root.innerHTML = `<form class="profile-editor reset-form"><h1>${confirmReset ? "Новый пароль" : "Восстановление доступа"}</h1><label>${confirmReset ? 'Пароль от 8 символов<input type="password" name="password" minlength="8" required autocomplete="new-password" />' : 'Почта<input type="email" name="email" required autocomplete="email" />'}</label><button class="primary-button">Продолжить</button><p role="status"></p><a href="#login">Вернуться ко входу</a></form>`;
  root.querySelector("form").addEventListener("submit", async (event) => {
    event.preventDefault(); const form = event.currentTarget; const button = form.querySelector("button"); button.disabled = true;
    try {
      const body = Object.fromEntries(new FormData(form)); if (confirmReset) body.token = hash.split("/")[1];
      await apiJson(`/api/auth/password-reset/${confirmReset ? "confirm" : "request"}`, { method: "POST", body: JSON.stringify(body) });
      form.querySelector("[role=status]").textContent = confirmReset ? "Пароль изменён. Теперь можно войти." : "Если такая почта зарегистрирована, письмо для восстановления сформировано.";
    } catch { form.querySelector("[role=status]").textContent = "Не удалось выполнить запрос. Ссылка могла истечь или сервер недоступен."; }
    finally { button.disabled = false; }
  });
}

// Категории в шапке выбирают раздел из той же БД, что и панель фильтров.
document.querySelectorAll("[data-section]").forEach((link) => link.addEventListener("click", (event) => {
  event.preventDefault(); state.filters = defaultFilterState();
  const group = filterGroups.find((entry) => entry.options.some((option) => option.value === link.dataset.section));
  if (group) state.filters[group.id] = [link.dataset.section];
  invalidateCatalog(); header.classList.remove("menu-open"); window.location.hash = "home"; route();
}));
document.querySelectorAll(".logo[href='#home']").forEach((link) => link.addEventListener("click", () => { state.search = ""; state.filters = defaultFilterState(); invalidateCatalog(); if (location.hash === "#home") route(); }));
