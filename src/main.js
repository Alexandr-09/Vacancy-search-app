import { fetchCities, fetchVacancies } from './api.js';

// Находим основные элементы DOM
const vacanciesGrid = document.querySelector('.vacancies-grid');     // Сетка карточек
const citySelect = document.querySelector('#city-select');           // Выпадающий список городов
const filtersForm = document.querySelector('#filters-form');         // Форма поиска
const searchInput = document.querySelector('#search-input');         // Поле "Посада або компанія"
const salaryInput = document.querySelector('#salary-input');         // Поле "Зарплата від"
const remoteCheckbox = document.querySelector('#remote-checkbox');   // Чекбокс "Віддалено"
const totalTitle = document.querySelector('#total-title');           // Заголовок количества
const paginationPages = document.querySelector('#pagination-pages'); // Контейнер цифр пагинации
const prevBtn = document.querySelector('#prev-page-btn');             // Кнопка Назад
const nextBtn = document.querySelector('#next-page-btn');             // Кнопка Вперед

let currentPage = 1; // Храним текущую активную страницу

/**
 * 1. Заполнение списка городов (<select>)
 */
function renderCities(cities) {
    if (!citySelect) return;
    cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city.id;
        option.textContent = city.name || city.title;
        citySelect.appendChild(option);
    });
}

/**
 * 2. Генерация HTML карточки
 */
function createVacancyCardHTML(vacancy) {
    // 1. Безопасное получение названия компании и города (защита от undefined)
    const companyName = vacancy.companyName || vacancy.company?.title || 'Компанія';
    const cityName = vacancy.cityName || vacancy.city?.title || 'Всі міста';

    // 2. Форматирование зарплаты
    let salaryText = 'Зарплата за домовленістю';
    if (vacancy.salaryFrom && vacancy.salaryTo) {
        salaryText = `${vacancy.salaryFrom.toLocaleString()} – ${vacancy.salaryTo.toLocaleString()} грн`;
    } else if (vacancy.salaryFrom) {
        salaryText = `від ${vacancy.salaryFrom.toLocaleString()} грн`;
    }

    // 3. Аватар компании (логотип или первая буква)
    const avatarHTML = vacancy.companyLogo
        ? `<img src="${vacancy.companyLogo}" alt="${companyName}" class="card-avatar-img">`
        : `<div class="card-avatar">${companyName.charAt(0).toUpperCase()}</div>`;

    // 4. Форматирование тегов навыков (если передаются в массиве)
    const tagsArray = vacancy.skills || vacancy.tags || [];
    const tagsHTML = tagsArray.length > 0
        ? `<div class="card-tags">${tagsArray.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>`
        : '';

    // 5. Бейдж "Гаряча"
    const hotBadgeHTML = vacancy.isHot ? `<div class="badge-hot">Гаряча</div>` : '';

    return `
    <article class="card" data-id="${vacancy.id}">
      <div class="card-header">
        ${avatarHTML}
        <div class="card-title-group">
          <h3 class="card-title">${vacancy.title}</h3>
          <p class="card-company">${companyName}</p>
        </div>
        <button type="button" class="favorite-btn" data-id="${vacancy.id}" aria-label="Додати в обране">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="${vacancy.isFavorite ? '#D81B60' : 'none'}" stroke="${vacancy.isFavorite ? '#D81B60' : '#1F2937'}" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>
      </div>

      ${hotBadgeHTML}

      <div class="card-location">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
        <span>${cityName}${vacancy.remote || vacancy.isRemote ? ' • Віддалено' : ''}</span>
      </div>

      <div class="card-salary">${salaryText}</div>

      ${tagsHTML}

      <div class="card-time">${vacancy.createdAt || 'Нещодавно'}</div>
    </article>
  `;
}

/**
 * 3. Отрисовка списка вакансий
 */
function renderVacancies(vacancies) {
    if (!vacanciesGrid) return;
    if (!vacancies || vacancies.length === 0) {
        vacanciesGrid.innerHTML = '<p class="no-results">За вашим запитом вакансій не знайдено</p>';
        return;
    }
    vacanciesGrid.innerHTML = vacancies.map(createVacancyCardHTML).join('');
}

/**
 * 4. Отрисовка кнопок пагинации
 */
function renderPagination(totalPages, activePage) {
    if (!paginationPages) return;
    paginationPages.innerHTML = ''; // Очищаем старые кнопки

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `pagination-page ${i === activePage ? 'active' : ''}`;
        btn.textContent = i;
        btn.addEventListener('click', () => goToPage(i));
        paginationPages.appendChild(btn);
    }

    // Обновляем состояние стрелочек "Назад" / "Вперед"
    if (prevBtn) prevBtn.disabled = activePage <= 1;
    if (nextBtn) nextBtn.disabled = activePage >= totalPages;
}

/**
 * 5. Считывание фильтров из URL
 */
function getFiltersFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
        q: urlParams.get('q') || '',
        city: urlParams.get('city') || '',
        salaryFrom: urlParams.get('salaryFrom') || '',
        remote: urlParams.get('remote') === '1',
        page: parseInt(urlParams.get('page') || '1', 10)
    };
}

/**
 * 6. Заполнение полей формы на основе данных из URL
 */
function fillFormFromURL(filters) {
    if (searchInput) searchInput.value = filters.q;
    if (citySelect) citySelect.value = filters.city;
    if (salaryInput) salaryInput.value = filters.salaryFrom;
    if (remoteCheckbox) remoteCheckbox.checked = filters.remote;
}

/**
 * 7. Обновление URL-адреса без перезагрузки страницы
 */
function updateURL(filters) {
    const searchParams = new URLSearchParams();

    if (filters.q) searchParams.set('q', filters.q);
    if (filters.city) searchParams.set('city', filters.city);
    if (filters.salaryFrom) searchParams.set('salaryFrom', filters.salaryFrom);
    if (filters.remote) searchParams.set('remote', '1');
    if (filters.page > 1) searchParams.set('page', filters.page);

    const newRelativePathQuery = window.location.pathname + (searchParams.toString() ? '?' + searchParams.toString() : '');
    window.history.pushState(null, '', newRelativePathQuery);
}

/**
 * 8. Основная функция загрузки данных по фильтрам
 */
async function loadData() {
    const filters = getFiltersFromURL();
    currentPage = filters.page;

    try {
        const vacanciesData = await fetchVacancies(filters);

        renderVacancies(vacanciesData.items);
        renderPagination(vacanciesData.pages, currentPage);

        if (totalTitle) {
            totalTitle.textContent = `Знайдено ${vacanciesData.total} вакансій`;
        }
    } catch (error) {
        console.error('Помилка при завантаженні вакансій:', error);
    }
}

/**
 * Переход на выбранную страницу
 */
function goToPage(pageNumber) {
    const filters = getFiltersFromURL();
    filters.page = pageNumber;
    updateURL(filters);
    loadData();
}

/**
 * Инициализация приложения и навешивание слушателей событий
 */
async function initApp() {
    try {
        // 1. Загружаем города
        const cities = await fetchCities();
        renderCities(cities);

        // 2. Считываем параметры из URL и заполняем форму
        const initialFilters = getFiltersFromURL();
        fillFormFromURL(initialFilters);

        // 3. Загружаем первую порцию данных
        await loadData();

        // 4. Слушатель сабмита формы (нажатие кнопки "Знайти")
        if (filtersForm) {
            filtersForm.addEventListener('submit', (e) => {
                e.preventDefault();

                const newFilters = {
                    q: searchInput ? searchInput.value.trim() : '',
                    city: citySelect ? citySelect.value : '',
                    salaryFrom: salaryInput ? salaryInput.value : '',
                    remote: remoteCheckbox && remoteCheckbox.checked ? '1' : '',
                    page: 1
                };

                updateURL(newFilters);
                loadData();
            });
        }

        // 5. Слушатели для стрелочек пагинации (исправлена опечатка в prevBtn)
        if (prevBtn) prevBtn.addEventListener('click', () => goToPage(currentPage - 1));
        if (nextBtn) nextBtn.addEventListener('click', () => goToPage(currentPage + 1));

        // 6. Реакция на кнопки "Назад/Вперед" в самом браузере
        window.addEventListener('popstate', () => {
            const filters = getFiltersFromURL();
            fillFormFromURL(filters);
            loadData();
        });

    } catch (error) {
        console.error('Помилка ініціалізації:', error);
    }
}

initApp().catch(err => console.error(err));