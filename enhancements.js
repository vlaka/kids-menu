const topOrderButton = document.getElementById('topOrderButton');
const topOrderCount = document.getElementById('topOrderCount');
const headerHomeButton = document.getElementById('homeButton');
const themeInputs = [...document.querySelectorAll('input[name="theme"]')];
const dishPopup = document.getElementById('dishDialog');
const dishPopupOrderButton = document.getElementById('dishDialogOrderButton');
const THEME_KEY = 'kidsMenuTheme';
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');

function syncTopOrderCount() {
  const bottomCount = document.querySelector('.bottom-nav-item[data-category="order"] .order-count');
  const count = bottomCount ? Number.parseInt(bottomCount.textContent || '0', 10) : 0;
  topOrderCount.textContent = String(count || 0);
  topOrderCount.hidden = !count;
}

function syncHeaderBackButton() {
  if (!headerHomeButton) return;
  const onHome = typeof activeCategory !== 'undefined' ? activeCategory === 'home' : true;
  headerHomeButton.classList.toggle('back-button', !onHome);
}

function syncDishPopupOrderButton() {
  if (!dishPopupOrderButton) return;
  const dishId = history.state?.dialog;
  if (!dishId) {
    dishPopupOrderButton.hidden = true;
    return;
  }

  dishPopupOrderButton.hidden = false;
  const inOrder = typeof orderIds !== 'undefined' && orderIds.has(dishId);
  dishPopupOrderButton.textContent = inOrder ? 'Убрать из моего заказа' : 'Добавить в заказ';
  dishPopupOrderButton.classList.toggle('remove', inOrder);
}

function getSavedTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  return ['light', 'dark', 'system'].includes(saved) ? saved : 'system';
}

function resolvedTheme(theme) {
  return theme === 'system' ? (systemTheme.matches ? 'dark' : 'light') : theme;
}

function applyTheme(theme, { save = false } = {}) {
  const resolved = resolvedTheme(theme);
  document.documentElement.dataset.theme = resolved;
  document.documentElement.dataset.themePreference = theme;
  document.documentElement.style.colorScheme = resolved;
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) themeMeta.content = resolved === 'dark' ? '#171411' : '#fff7ed';
  if (save) localStorage.setItem(THEME_KEY, theme);
  for (const input of themeInputs) input.checked = input.value === theme;
}

function swipeTabs() {
  if (!currentData || typeof activeCategory === 'undefined') return [];
  return [
    'home',
    'order',
    ...(currentData.categories ?? []).map(category => category.id),
    'all'
  ];
}

function scrollActiveTabIntoView() {
  requestAnimationFrame(() => {
    const active = document.querySelector('.bottom-nav-item.active');
    active?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  });
}

function moveBySwipe(direction) {
  if (typeof selectCategory !== 'function') return;
  const tabs = swipeTabs();
  const currentIndex = tabs.indexOf(activeCategory);
  if (currentIndex < 0) return;
  const nextIndex = currentIndex + direction;
  if (nextIndex < 0 || nextIndex >= tabs.length) return;
  selectCategory(tabs[nextIndex]);
  scrollActiveTabIntoView();
}

if (topOrderButton) {
  topOrderButton.addEventListener('click', () => {
    if (typeof selectCategory === 'function') selectCategory('order');
  });
}

if (headerHomeButton) {
  headerHomeButton.addEventListener('click', event => {
    if (typeof activeCategory === 'undefined' || activeCategory === 'home') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (typeof selectCategory === 'function') {
      selectCategory('home', { replace: true });
    }
  }, true);
}

if (dishPopupOrderButton) {
  dishPopupOrderButton.addEventListener('click', event => {
    event.stopPropagation();
    const dishId = history.state?.dialog;
    if (!dishId || typeof toggleOrder !== 'function') return;
    toggleOrder(dishId);
    syncDishPopupOrderButton();
  });
}

if (dishPopup) {
  const popupObserver = new MutationObserver(syncDishPopupOrderButton);
  popupObserver.observe(dishPopup, { attributes: true, attributeFilter: ['open'] });
}

for (const input of themeInputs) {
  input.addEventListener('change', () => {
    if (input.checked) applyTheme(input.value, { save: true });
  });
}

systemTheme.addEventListener('change', () => {
  if (getSavedTheme() === 'system') applyTheme('system');
});

let swipeStartX = 0;
let swipeStartY = 0;
let swipeTracking = false;

document.addEventListener('touchstart', event => {
  if (event.touches.length !== 1) return;
  if (dishPopup?.open || settingsDialog?.open) return;
  if (event.target.closest('.bottom-nav, dialog')) return;
  const touch = event.touches[0];
  swipeStartX = touch.clientX;
  swipeStartY = touch.clientY;
  swipeTracking = true;
}, { passive: true });

document.addEventListener('touchend', event => {
  if (!swipeTracking || event.changedTouches.length !== 1) return;
  swipeTracking = false;
  const touch = event.changedTouches[0];
  const dx = touch.clientX - swipeStartX;
  const dy = touch.clientY - swipeStartY;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  if (absX < 70 || absX < absY * 1.4) return;
  moveBySwipe(dx < 0 ? 1 : -1);
}, { passive: true });

const orderObserver = new MutationObserver(() => {
  syncTopOrderCount();
  syncHeaderBackButton();
  syncDishPopupOrderButton();
});
orderObserver.observe(document.getElementById('categoryNav'), { childList: true, subtree: true, characterData: true });
window.addEventListener('load', () => {
  syncTopOrderCount();
  syncHeaderBackButton();
  syncDishPopupOrderButton();
});

applyTheme(getSavedTheme());
syncTopOrderCount();
syncHeaderBackButton();
syncDishPopupOrderButton();
