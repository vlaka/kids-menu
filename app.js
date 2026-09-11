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

const DATA_URL = 'data/menu.json';
const DISH_IMAGE_OVERRIDES = {
  banana: 'assets/dishes/banana-v2.jpg'
};
let currentData = null;
let activeCategory = 'home';
let lastRefreshCheck = localStorage.getItem('lastRefreshCheck');

function setStatus(message) { statusEl.textContent = message; }
function categoryIconMarkup(category, size = 32) {
  if (category.iconImage) return `<img src="${category.iconImage}" alt="" width="${size}" height="${size}" style="width:${size}px;height:${size}px;object-fit:cover;border-radius:22%;display:block" />`;
  return category.icon ?? '🍽️';
}
function buildDishCard(dish) {
  const dishNode = dishTemplate.content.cloneNode(true);
  const card = dishNode.querySelector('.dish-card');
  card.dataset.dishId = dish.id ?? '';
  if (dish.group) card.dataset.group = dish.group;
  dishNode.querySelector('.dish-name').textContent = dish.name ?? '';
  dishNode.querySelector('.dish-description').textContent = dish.description ?? '';
  const image = dishNode.querySelector('.dish-photo');
  const placeholder = dishNode.querySelector('.dish-placeholder');
  const dishImage = dish.image || DISH_IMAGE_OVERRIDES[dish.id];
  if (dishImage) { image.src = dishImage; image.alt = dish.name ?? 'Блюдо'; image.hidden = false; placeholder.hidden = true; }
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
    if (!dish.group) { grid.appendChild(buildDishCard(dish)); index += 1; continue; }
    const family = document.createElement('div'); family.className = 'dish-family'; family.dataset.group = dish.group;
    while (index < items.length && items[index].group === dish.group) { family.appendChild(buildDishCard(items[index])); index += 1; }
    grid.appendChild(family);
  }
  menuEl.appendChild(categoryNode);
}
function renderHome(categories) {
  categoryCardsEl.replaceChildren();
  for (const category of categories) {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'category-card';
    button.innerHTML = `<span class="category-card-icon">${categoryIconMarkup(category, 64)}</span><span class="category-card-name">${category.name}</span><span class="category-card-count">${category.items?.length ?? 0} блюд</span>`;
    button.addEventListener('click', () => selectCategory(category.id)); categoryCardsEl.appendChild(button);
  }
  const allButton = document.createElement('button'); allButton.type = 'button'; allButton.className = 'category-card';
  allButton.innerHTML = `<span class="category-card-icon">📋</span><span class="category-card-name">Показать всё</span><span class="category-card-count">Все блюда одним списком</span>`;
  allButton.addEventListener('click', () => selectCategory('all')); categoryCardsEl.appendChild(allButton);
}
function renderTabs(categories) {
  categoryNav.replaceChildren();
  const tabs = [{ id: 'home', name: 'Домой', icon: '🏠' }, ...categories.map(category => ({ id: category.id, name: category.name, icon: category.icon, iconImage: category.iconImage })), { id: 'all', name: 'Показать всё', icon: '📋' }];
  for (const tab of tabs) {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'bottom-nav-item'; button.dataset.category = tab.id;
    button.innerHTML = `<span>${categoryIconMarkup(tab, 24)}</span><small>${tab.name}</small>`;
    button.classList.toggle('active', tab.id === activeCategory); button.setAttribute('aria-pressed', tab.id === activeCategory ? 'true' : 'false');
    button.addEventListener('click', () => selectCategory(tab.id)); categoryNav.appendChild(button);
  }
}
function updateInfo(data) {
  const parts = [`Меню: ${data.menuVersion ?? 'неизвестно'}`, `данные: ${data.updatedAt ?? 'неизвестно'}`];
  if (lastRefreshCheck) parts.push(`проверено: ${lastRefreshCheck}`); lastUpdatedEl.textContent = parts.join(' · ');
}
function renderMenu(data) {
  currentData = data; const categories = data.categories ?? []; renderTabs(categories); renderHome(categories); menuEl.replaceChildren();
  const onHome = activeCategory === 'home'; homeView.hidden = !onHome; menuEl.hidden = onHome;
  if (activeCategory === 'all') for (const category of categories) renderCategory(category);
  else if (!onHome) { const selected = categories.find(category => category.id === activeCategory); if (selected) renderCategory(selected); }
  updateInfo(data);
}
function selectCategory(categoryId) { activeCategory = categoryId; if (currentData) renderMenu(currentData); window.scrollTo({ top: 0, behavior: 'smooth' }); }
function nowText() { return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date()).replace(',', ''); }
async function loadMenu({ force = false } = {}) {
  refreshButton.disabled = true; setStatus(force ? 'Обновляю меню…' : 'Загружаю меню…');
  try {
    const cacheBust = force ? `?t=${Date.now()}` : '';
    const response = await fetch(`${DATA_URL}${cacheBust}`, { cache: force ? 'no-store' : 'default' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (force) { lastRefreshCheck = nowText(); localStorage.setItem('lastRefreshCheck', lastRefreshCheck); }
    renderMenu(data); setStatus(force ? 'Меню проверено и обновлено.' : '');
  } catch (error) { console.error(error); setStatus('Не удалось загрузить меню. Открой настройки и попробуй обновить ещё раз.'); }
  finally { refreshButton.disabled = false; }
}
async function hardRefreshApp() {
  refreshButton.disabled = true; setStatus('Полностью обновляю приложение…');
  try {
    lastRefreshCheck = nowText(); localStorage.setItem('lastRefreshCheck', lastRefreshCheck);
    if ('serviceWorker' in navigator) { const registrations = await navigator.serviceWorker.getRegistrations(); await Promise.all(registrations.map(registration => registration.unregister())); }
    if ('caches' in window) { const keys = await caches.keys(); await Promise.all(keys.map(key => caches.delete(key))); }
    const url = new URL(window.location.origin + window.location.pathname); url.searchParams.set('refresh', Date.now().toString()); window.location.replace(url.toString());
  } catch (error) { console.error(error); setStatus('Не удалось полностью обновить приложение. Попробуй ещё раз.'); refreshButton.disabled = false; }
}
homeButton.addEventListener('click', () => selectCategory('home'));
settingsButton.addEventListener('click', () => settingsDialog.showModal());
closeSettingsButton.addEventListener('click', () => settingsDialog.close());
settingsDialog.addEventListener('click', event => { const rect = settingsDialog.getBoundingClientRect(); const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom; if (outside) settingsDialog.close(); });
refreshButton.addEventListener('click', hardRefreshApp);
if ('serviceWorker' in navigator) window.addEventListener('load', () => serviceWorkerRegistration());
async function serviceWorkerRegistration() { try { await navigator.serviceWorker.register('service-worker.js?v=16', { updateViaCache: 'none' }); } catch (error) { console.error('Service worker registration failed', error); } }
loadMenu();
