const menuEl = document.getElementById('menu');
const statusEl = document.getElementById('status');
const refreshButton = document.getElementById('refreshButton');
const dayTemplate = document.getElementById('dayTemplate');
const mealTemplate = document.getElementById('mealTemplate');

const DATA_URL = 'data/menu.json';

function setStatus(message) {
  statusEl.textContent = message;
}

function renderMenu(data) {
  menuEl.replaceChildren();

  for (const day of data.days ?? []) {
    const dayNode = dayTemplate.content.cloneNode(true);
    dayNode.querySelector('.day-name').textContent = day.name;
    dayNode.querySelector('.day-date').textContent = day.date ?? '';
    const mealsEl = dayNode.querySelector('.meals');

    for (const meal of day.meals ?? []) {
      const mealNode = mealTemplate.content.cloneNode(true);
      mealNode.querySelector('.meal-time').textContent = meal.time ?? '';
      mealNode.querySelector('.meal-name').textContent = meal.name ?? '';
      mealNode.querySelector('.meal-description').textContent = meal.description ?? '';

      const image = mealNode.querySelector('.meal-image');
      if (meal.image) {
        image.src = meal.image;
        image.alt = meal.name ? `${meal.name}: ${meal.description ?? ''}` : meal.description ?? 'Блюдо';
        image.hidden = false;
      }

      mealsEl.appendChild(mealNode);
    }

    menuEl.appendChild(dayNode);
  }
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
    const updated = data.updatedAt ? ` Обновлено: ${data.updatedAt}.` : '';
    setStatus(`Меню загружено.${updated}`);
  } catch (error) {
    console.error(error);
    setStatus('Не удалось загрузить меню. Проверь интернет и нажми «Обновить».');
  } finally {
    refreshButton.disabled = false;
  }
}

refreshButton.addEventListener('click', () => loadMenu({ force: true }));

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('service-worker.js'));
}

loadMenu();
