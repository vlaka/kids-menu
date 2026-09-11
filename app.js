const menuEl = document.getElementById('menu');
const statusEl = document.getElementById('status');
const refreshButton = document.getElementById('refreshButton');
const settingsButton = document.getElementById('settingsButton');
const settingsDialog = document.getElementById('settingsDialog');
const closeSettingsButton = document.getElementById('closeSettingsButton');
const lastUpdatedEl = document.getElementById('lastUpdated');
const categoryNav = document.getElementById('categoryNav');
const categoryTemplate = document.getElementById('categoryTemplate');
const dishTemplate = document.getElementById('dishTemplate');

const DATA_URL = 'data/menu.json';

function setStatus(message) {
  statusEl.textContent = message;
}

function renderMenu(data) {
  menuEl.replaceChildren();
  categoryNav.replaceChildren();

  const categories = data.categories ?? [];

  for (const category of categories) {
    const sectionId = `category-${category.id}`;

    const navButton = document.createElement('button');
    navButton.type = 'button';
    navButton.className = 'category-chip';
    navButton.textContent = `${category.icon ?? '🍽️'} ${category.name}`;
    navButton.addEventListener('click', () => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    categoryNav.appendChild(navButton);

    const categoryNode = categoryTemplate.content.cloneNode(true);
    const section = categoryNode.querySelector('.category-section');
    section.id = sectionId;
    categoryNode.querySelector('.category-icon').textContent = category.icon ?? '🍽️';
    categoryNode.querySelector('.category-title').textContent = category.name;
    const grid = categoryNode.querySelector('.dish-grid');

    for (const dish of category.items ?? []) {
      const dishNode = dishTemplate.content.cloneNode(true);
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

      grid.appendChild(dishNode);
    }

    menuEl.appendChild(categoryNode);
  }

  lastUpdatedEl.textContent = `Последнее обновление: ${data.updatedAt ?? 'неизвестно'}`;
}

async function loadMenu({ force = false } = {}) {
  refreshButton.disabled = true;
  setStatus(force ? 'Обновляю меню…' : 'Загружаю меню…');

  try {
    const cacheBust = force ? `?t=${Date.now()}` : '';
    const response = await fetch(`${DATA_URL}${cacheBust}`, {
      cache: force ? 'no-store' : 'default'
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    renderMenu(data);
    setStatus('');
  } catch (error) {
    console.error(error);
    setStatus('Не удалось загрузить меню. Открой настройки и попробуй обновить ещё раз.');
  } finally {
    refreshButton.disabled = false;
  }
}

settingsButton.addEventListener('click', () => settingsDialog.showModal());
closeSettingsButton.addEventListener('click', () => settingsDialog.close());
settingsDialog.addEventListener('click', event => {
  const rect = settingsDialog.getBoundingClientRect();
  const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
  if (outside) settingsDialog.close();
});
refreshButton.addEventListener('click', async () => {
  await loadMenu({ force: true });
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('service-worker.js'));
}

loadMenu();
