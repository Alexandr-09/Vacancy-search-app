// Базовый URL API (уже содержит /api в конце)
const BASE_URL = 'https://vacancies-test-task-api.jobs-sandbox.workers.dev/c/d8e26c7029ceaa23599bc8fce547d2ef/api';

/**
 * 1. Отримання списку міст для <select>
 */
export async function fetchCities() {

    const response = await fetch(`${BASE_URL}/cities`);
    if (!response.ok) {
        throw new Error("Не вдалося завантажити міста");
    }
    return await response.json();
}

/**
 * 2. Отримання списку вакансій з урахуванням фільтрів
 * @param {Object} filters
 */
export async function fetchVacancies(filters = {}) {
    const searchParams = new URLSearchParams(); // Об'єкт для збирання URL-параметрів

    if (filters.q) {
        searchParams.append('q', filters.q);                  // Пошук за назвою або компанією
    }
    if (filters.city) {
        searchParams.append('city', filters.city);            // ID міста
    }
    if (filters.salaryFrom) {
        searchParams.append('salaryFrom', filters.salaryFrom); // Мінімальна зарплата
    }
    if (filters.remote) {
        searchParams.append('remote', '1');                   // Чекбокс "Віддалено"
    }
    if (filters.page) {
        searchParams.append('page', filters.page);            // Номер сторінки
    }

    // Використовуємо змінну BASE_URL замість чистого URL всередині ${}
    const response = await fetch(`${BASE_URL}/vacancies?${searchParams.toString()}`);

    if (!response.ok) {
        const errorData = await response.json(); // Якщо статус 422 — читаємо об'єкт з помилками
        throw errorData;
    }

    return await response.json(); // Повертає { items: [...], total: 37, page: 1, pages: 4 }
}

/**
 * 3. Додавання вакансії в обране
 */
export async function addToFavorites(id) {
    const response = await fetch(`${BASE_URL}/favorites/${id}`, {
        method: 'POST', // Метод POST
    });
    if (!response.ok) {
        throw new Error('Помилка збереження вакансії');
    }
}

/**
 * 4. Видалення вакансії з обраного
 */
export async function removeFromFavorites(id) {
    const response = await fetch(`${BASE_URL}/favorites/${id}`, {
        method: 'DELETE', // Метод DELETE за ТЗ
    });
    if (!response.ok) {
        throw new Error('Помилка видалення з обраного');
    }
}