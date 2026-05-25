// display.js - Отображение кода семьи, роли пользователя и имени семьи

console.log(" Файл display.js загружен");

// ИСПРАВЛЕНО: Убрана лишняя буква 'h' из протокола
const API_URL = 'https://todo-stasnau.amvera.io';

// Безопасное обновление текста элемента
function setTextContent(elementId, text, fallback = '', errorStyle = false) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = text || fallback;
        if (errorStyle && !text) {
            el.style.color = '#ff6b6b';
        }
    }
}

// ===== Загрузка имени семьи с бэкенда =====
async function loadFamilyName() {
    const inviteCode = localStorage.getItem('invite_code');
    if (!inviteCode) {
        console.warn(' invite_code не найден в localStorage');
        return;
    }

    try {
        // Запрос к бэкенду (теперь с правильным URL)
        const res = await fetch(`${API_URL}/family/get-by-code?invite_code=${encodeURIComponent(inviteCode)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        const data = await res.json();
        console.log(" Данные от бэкенда при получении семьи:", data);
        
        // Извлекаем имя, проверяя как data.name, так и data.family_name на случай разных ответов бэкенда
        const familyName = data?.name || data?.family_name;

        if (familyName) {
            const familyTitleDisplay = document.getElementById('family-title') || document.querySelector('.header .title') || document.querySelector('h1');
            if (familyTitleDisplay) {
                familyTitleDisplay.textContent = familyName.trim().toUpperCase();
            }
            // Кэшируем имя, чтобы не запрашивать каждый раз
            localStorage.setItem('family_name', familyName.trim());
            console.log(' Имя семьи загружено и закэшировано:', familyName);
        }
    } catch (e) {
        console.error(' Не удалось загрузить имя семьи:', e);
        const familyTitleDisplay = document.getElementById('family-title') || document.querySelector('.header .title') || document.querySelector('h1');
        if (familyTitleDisplay) {
            // Если сервер упал, но в кэше хоть что-то было — оставим старое, иначе пишем дефолт
            familyTitleDisplay.textContent = localStorage.getItem('family_name')?.toUpperCase() || 'СЕМЬЯ';
        }
    }
}

// ===== Основная инициализация =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM загружен, инициализация display.js');

    // 1. Код приглашения (используется на created.html и settings.html)
    const inviteCode = localStorage.getItem('invite_code');
    console.log(' Код из localStorage:', inviteCode);

    setTextContent('invite-code', inviteCode, 'Не найден', true);
    setTextContent('family-code', inviteCode, 'Не найден', true);

    // 2. Роль пользователя (settings.html)
    const userRole = localStorage.getItem('user_role');
    setTextContent('user-role', userRole, 'Не определена');

    // 3. Имя семьи в заголовке (tasks.html)
    // Ищем элемент по ID, а если его в верстке нет — страхуемся через селекторы шапки
    const familyTitleDisplay = document.getElementById('family-title') || document.querySelector('.header .title') || document.querySelector('h1');
    
    if (familyTitleDisplay) {
        const cachedName = localStorage.getItem('family_name');
        if (cachedName) {
            // Используем кэш — мгновенно
            familyTitleDisplay.textContent = cachedName.toUpperCase();
            console.log('Имя семьи взято из кэша:', cachedName);
            
            // На всякий случай обновляем в фоне, если имя изменилось на сервере
            loadFamilyName();
        } else {
            // Кэша нет — запрашиваем с бэкенда
            console.log(' Кэш пуст, запрашиваем имя семьи с сервера...');
            loadFamilyName();
        }
    }
});
