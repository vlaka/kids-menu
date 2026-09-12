const menuEl = document.getElementById('menu');
const homeView = document.getElementById('homeView');
const categoryCardsEl = document.getElementById('categoryCards');
const statusEl = document.getElementById('status');
const refreshButton = document.getElementById('refreshButton');
const settingsButton = document.getElementById('settingsButton');
const settingsDialog = document.getElementById('settingsDialog');
const closeSettingsButton = document.getElementById('closeSettingsButton');
const lastUpdatedEl = document.getElementById('lastUpdated');
const categoryNav = document.getElementById('categoryNav');
const categoryTemplate = document.getElementById('categoryTemplate');
const dishTemplate = document.getElementById('dishTemplate');
const homeButton = document.getElementById('homeButton');
const dishDialog = document.getElementById('dishDialog');
const closeDishButton = document.getElementById('closeDishButton');
const dishDialogImage = document.getElementById('dishDialogImage');
const dishDialogPlaceholder = document.getElementById('dishDialogPlaceholder');
const dishDialogTitle = document.getElementById('dishDialogTitle');
const dishDialogDescription = document.getElementById('dishDialogDescription');

const DATA_URL = 'data/menu.json';
const ORDER_STORAGE_KEY = 'kidsMenuOrder';
let currentData = null;
let activeCategory = 'home';
let lastRefreshCheck = localStorage.getItem('lastRefreshCheck');
let orderIds = loadOrderIds();

function loadOrderIds() {
  try {
    const saved = JSON.parse(localStorage.getItem(ORDER_STORAGE_KEY) || '[]');
    return new Set(Array.isArray(saved) ? saved : []);
  } catch {
    return new Set();
  }
}

function saveOrderIds() {
  localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify([...orderIds]));
}

function setStatus(message) {
  statusEl.textContent = message;
}

function categoryIconMarkup(category, size = 32) {
  if (category.iconImage) {
    return `<img src="${category.iconImage}" alt="" width="${size}" height="${size}" style="width:${size}px;height:${size}px;object-fit:cover;border-radius:22%;display:block" />`;
  }
  return category.icon ?? '🍽️';
}

function formatDishCount(count) {
  const mod100 = count % 100;
  const mod10 = count % 10;
  let word = 'блюд';

  if (mod100 < 11 || mod100 > 14) {
    if (mod10 === 1) word = 'блюдо';
    else if (mod10 >= 2 && mod10 <= 4) word = 'блюда';
  }

  return `${count} ${word}`;
}

function syncHeaderNavigation() {
  const onHome = activeCategory === 'home';
  homeButton.textContent = onHome ? '🏠' : '⬅︎';
  homeButton.setAttribute('aria-label', onHome ? 'Главная' : 'Назад');
  homeButton.title = onHome ? 'Главная' : 'Назад';
}

function openDishDialog(dish) {
  dishDialogTitle.textContent = dish.name ?? '';
  dishDialogDescription.textContent = dish.description ?? '';

  if (dish.image) {
    dishDialogImage.src = dish.image;
    dishDialogImage.alt = dish.name ?? 'Блюдо';
    dishDialogImage.hidden = false;
    dishDialogPlaceholder.hidden = true;
  } else {
    dishDialogImage.removeAttribute('src');
    dishDialogImage.hidden = true;
    dishDialogPlaceholder.hidden = false;
  }

  if (!history.state?.dialog) {
    history.pushState({ view: activeCategory, dialog: dish.id }, '');
  }
  dishDialog.showModal();
}

function closeDishDialogWithHistory() {
  if (history.state?.dialog) history.back();
  else if (dishDialog.open) dishDialog.close();
}

function toggleOrder(dishId) {
  if (orderIds.has(dishId)) orderIds.delete(dishId);
  else orderIds.add(dishId);
  saveOrderIds();
  if (currentData) renderMenu(currentData);
}

function clearOrder() {
  if (!orderIds.size) return;
  orderIds.clear();
  saveOrderIds();
  if (currentData) renderMenu(currentData);
}

function buildDishCard(dish, { orderView = false } = {}) {
  const dishNode = dishTemplate.content.cloneNode(true);
  const card = dishNode.querySelector('.dish-card');
  card.dataset.dishId = dish.id ?? '';
  if (dish.group) card.dataset.group = dish.group;

  dishNode.querySelector('.dish-name').textContent = dish.name ?? '';
  dishNode.querySelector('.dish-description').textContent = dish.description ?? '';

  const image = dishNode.querySelector('.dish-photo');
  const placeholder = dishNode.querySelector('.dish-placeholder');
  if (dish.image) {
    image.src = dish.image;
    image.alt = dish.name ?? 'Блюдо';
    image.hidden = false;
    placeholder.hidden = true;
  }

  const orderButton = dishNode.querySelector('.order-button');
  const inOrder = orderIds.has(dish.id);
  orderButton.textContent = orderView || inOrder ? 'Убрать из моего заказа' : 'Добавить в заказ';
  orderButton.classList.toggle('remove', orderView || inOrder);
  orderButton.addEventListener('click', event => {
    event.stopPropagation();
    toggleOrder(dish.id);
  });

  card.addEventListener('click', () => openDishDialog(dish));
  card.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openDishDialog(dish);
    }
  });

  return dishNode;
}

function renderCategory(category) {
  const categoryNode = categoryTemplate.content.cloneNode(true);
  categoryNode.querySelector('.category-icon').innerHTML = categoryIconMarkup(category, 32);
  categoryNode.querySelector('.category-title').textContent = category.name;
  const grid = categoryNode.querySelector('.dish-grid');
  const items = category.items ?? [];
  let index = 0;

  while (index < items.length) {
    const dish = items[index];
    if (!dish.group) {
      grid.appendChild(buildDishCard(dish));
      index += 1;
      continue;
    }

    const family = document.createElement('div');
    family.className = 'dish-family';
    family.dataset.group = dish.group;
    while (index < items.length && items[index].group === dish.group) {
      family.appendChild(buildDishCard(items[index]));
      index += 1;
    }
    grid.appendChild(family);
  }

  menuEl.appendChild(categoryNode);
}

function renderOrder() {
  const section = document.createElement('section');
  section.className = 'category-section order-section';
  section.innerHTML = `
    <div class="section-heading">
      <span class="category-icon">🧾</span>
      <h2 class="category-title">Мой заказ</h2>
    </div>
  `;

  const selected = [];
  for (const category of currentData?.categories ?? []) {
    for (const dish of category.items ?? []) {
      if (orderIds.has(dish.id)) selected.push(dish);
    }
  }

  if (!selected.length) {
    const empty = document.createElement('div');
    empty.className = 'order-empty';
    empty.innerHTML = '<div class="order-empty-icon">🧾</div><strong>Заказ пока пуст</strong><span>Добавьте блюда из меню — они появятся здесь.</span>';
    section.appendChild(empty);
  } else {
    const clearButton = document.createElement('button');
    clearButton.type = 'button';
    clearButton.className = 'order-button remove';
    clearButton.textContent = 'Очистить заказ';
    clearButton.style.marginBottom = '12px';
    clearButton.addEventListener('click', clearOrder);
    section.appendChild(clearButton);

    const grid = document.createElement('div');
    grid.className = 'dish-grid';
    for (const dish of selected) grid.appendChild(buildDishCard(dish, { orderView: true }));
    section.appendChild(grid);
  }

  menuEl.appendChild(section);
}

function renderHome(categories) {
  categoryCardsEl.replaceChildren();
  for (const category of categories) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'category-card';
    const count = category.items?.length ?? 0;
    button.innerHTML = `<span class="category-card-icon">${categoryIconMarkup(category, 64)}</span><span class="category-card-name">${category.name}</span><span class="category-card-count">${formatDishCount(count)}</span>`;
    button.addEventListener('click', () => selectCategory(category.id));
    categoryCardsEl.appendChild(button);
  }

  const allButton = document.createElement('button');
  allButton.type = 'button';
  allButton.className = 'category-card';
  allButton.innerHTML = '<span class="category-card-icon">📋</span><span class="category-card-name">Показать всё</span><span class="category-card-count">Все блюда одним списком</span>';
  allButton.addEventListener('click', () => selectCategory('all'));
  categoryCardsEl.appendChild(allButton);
}

function renderTabs(categories) {
  categoryNav.replaceChildren();
  const tabs = [
    { id: 'home', name: 'Домой', icon: '🏠' },
    { id: 'order', name: 'Мой заказ', icon: '🧾', count: orderIds.size },
    ...categories.map(category => ({ id: category.id, name: category.name, icon: category.icon, iconImage: category.iconImage })),
    { id: 'all', name: 'Показать всё', icon: '📋' }
  ];

  for (const tab of tabs) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'bottom-nav-item';
    button.dataset.category = tab.id;
    const count = tab.count ? `<b class="order-count">${tab.count}</b>` : '';
    button.innerHTML = `<span class="bottom-nav-icon">${categoryIconMarkup(tab, 24)}${count}</span><small>${tab.name}</small>`;
    button.classList.toggle('active', tab.id === activeCategory);
    button.setAttribute('aria-pressed', tab.id === activeCategory ? 'true' : 'false');
    button.addEventListener('click', () => selectCategory(tab.id));
    categoryNav.appendChild(button);
  }
}

function updateInfo(data) {
  const parts = [`Меню: ${data.menuVersion ?? 'неизвестно'}`, `данные: ${data.updatedAt ?? 'неизвестно'}`];
  if (lastRefreshCheck) parts.push(`проверено: ${lastRefreshCheck}`);
  lastUpdatedEl.textContent = parts.join(' · ');
}

function renderMenu(data) {
  currentData = data;
  const categories = data.categories ?? [];
  renderTabs(categories);
  renderHome(categories);
  menuEl.replaceChildren();

  const onHome = activeCategory === 'home';
  homeView.hidden = !onHome;
  menuEl.hidden = onHome;
  syncHeaderNavigation();

  if (activeCategory === 'all') {
    for (const category of categories) renderCategory(category);
  } else if (activeCategory === 'order') {
    renderOrder();
  } else if (!onHome) {
    const selected = categories.find(category => category.id === activeCategory);
    if (selected) renderCategory(selected);
  }

  updateInfo(data);
}

function selectCategory(categoryId, { fromHistory = false, replace = false } = {}) {
  if (!fromHistory && categoryId !== activeCategory) {
    const method = replace ? 'replaceState' : 'pushState';
    history[method]({ view: categoryId }, '');
  }
  activeCategory = categoryId;
  if (currentData) renderMenu(currentData);
  window.scrollTo({ top: 0, behavior: fromHistory ? 'auto' : 'smooth' });
}

function nowText() {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
  }).format(new Date()).replace(',', '');
}

async function loadMenu({ force = false } = {}) {
  refreshButton.disabled = true;
  setStatus(force ? 'Обновляю меню…' : 'Загружаю меню…');
  try {
    const response = await fetch(`${DATA_URL}?t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (force) {
      lastRefreshCheck = nowText();
      localStorage.setItem('lastRefreshCheck', lastRefreshCheck);
    }
    renderMenu(data);
    setStatus(force ? 'Меню проверено и обновлено.' : '');
  } catch (error) {
    console.error(error);
    setStatus('Не удалось загрузить меню. Открой настройки и попробуй обновить ещё раз.');
  } finally {
    refreshButton.disabled = false;
  }
}

async function hardRefreshApp() {
  refreshButton.disabled = true;
  setStatus('Полностью обновляю приложение…');
  try {
    lastRefreshCheck = nowText();
    localStorage.setItem('lastRefreshCheck', lastRefreshCheck);

    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(key => caches.delete(key)));
    }

    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(async registration => {
        try { await registration.update(); } catch (_) {}
        await registration.unregister();
      }));
    }

    const url = new URL(window.location.href);
    url.searchParams.set('refresh', Date.now().toString());
    window.location.replace(url.toString());
  } catch (error) {
    console.error(error);
    setStatus('Не удалось полностью обновить приложение. Пробую обновить данные напрямую…');
    await loadMenu({ force: true });
  }
}

homeButton.addEventListener('click', () => {
  if (activeCategory === 'home') return;
  if (history.state?.view) history.back();
  else selectCategory('home', { replace: true });
});

window.addEventListener('popstate', event => {
  if (dishDialog.open) dishDialog.close();
  if (settingsDialog.open) settingsDialog.close();
  const view = event.state?.view ?? 'home';
  selectCategory(view, { fromHistory: true });
});

settingsButton.addEventListener('click', () => settingsDialog.showModal());
closeSettingsButton.addEventListener('click', () => settingsDialog.close());
settingsDialog.addEventListener('click', event => {
  const rect = settingsDialog.getBoundingClientRect();
  const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
  if (outside) settingsDialog.close();
});
closeDishButton.addEventListener('click', closeDishDialogWithHistory);
dishDialog.addEventListener('cancel', event => {
  if (history.state?.dialog) {
    event.preventDefault();
    history.back();
  }
});
dishDialog.addEventListener('click', event => {
  if (event.target === dishDialog) closeDishDialogWithHistory();
});
refreshButton.addEventListener('click', hardRefreshApp);

if (!history.state?.view) {
  history.replaceState({ view: 'home' }, '');
} else {
  activeCategory = history.state.view;
}

if ('serviceWorker' in navigator) window.addEventListener('load', () => serviceWorkerRegistration());
async function serviceWorkerRegistration() {
  try {
    await navigator.serviceWorker.register('service-worker.js?v=48', { updateViaCache: 'none' });
  } catch (error) {
    console.error('Service worker registration failed', error);
  }
}

loadMenu({ force: new URLSearchParams(window.location.search).has('refresh') });
