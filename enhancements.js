const topOrderButton = document.getElementById('topOrderButton');
const topOrderCount = document.getElementById('topOrderCount');
const headerHomeButton = document.getElementById('homeButton');

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

const orderObserver = new MutationObserver(() => {
  syncTopOrderCount();
  syncHeaderBackButton();
});
orderObserver.observe(document.getElementById('categoryNav'), { childList: true, subtree: true, characterData: true });
window.addEventListener('load', () => {
  syncTopOrderCount();
  syncHeaderBackButton();
});
syncTopOrderCount();
syncHeaderBackButton();
