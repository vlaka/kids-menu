const topOrderButton = document.getElementById('topOrderButton');
const topOrderCount = document.getElementById('topOrderCount');

function syncTopOrderCount() {
  const bottomCount = document.querySelector('.bottom-nav-item[data-category="order"] .order-count');
  const count = bottomCount ? Number.parseInt(bottomCount.textContent || '0', 10) : 0;
  topOrderCount.textContent = String(count || 0);
  topOrderCount.hidden = !count;
}

if (topOrderButton) {
  topOrderButton.addEventListener('click', () => {
    if (typeof selectCategory === 'function') selectCategory('order');
  });
}

const orderObserver = new MutationObserver(syncTopOrderCount);
orderObserver.observe(document.getElementById('categoryNav'), { childList: true, subtree: true, characterData: true });
window.addEventListener('load', syncTopOrderCount);
syncTopOrderCount();
