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

const orderObserver = new MutationObserver(() => {
  syncTopOrderCount();
  syncHeaderBackButton();
  syncDishPopupOrderButton();
});
orderObserver.observe(document.getElementById('categoryNav'), { childList: true, subtree: true, characterData: true });
window.addEventListener('load', async () => {
  syncTopOrderCount();
  syncHeaderBackButton();
  syncDishPopupOrderButton();
  if ('serviceWorker' in navigator) {
    try { await navigator.serviceWorker.register('service-worker.js?v=30', { updateViaCache: 'none' }); } catch (error) { console.error(error); }
  }
});

applyTheme(getSavedTheme());
syncTopOrderCount();
syncHeaderBackButton();
syncDishPopupOrderButton();
