const API_URL = 'https://todo-stasnau.amvera.io';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Достаем ID и сразу проверяем на все возможные кривые значения (строки 'undefined' или 'null')
    let userId = localStorage.getItem('user_id');
    
    // Резервный вариант: если чистого user_id нет, пробуем взять vk_id
    if (!userId || userId === 'undefined' || userId === 'null') {
        userId = localStorage.getItem('vk_id') || localStorage.getItem('vk_user_id');
    }
    
    // Если вообще ничего живого не нашли — отправляем на авторизацию
        else if (!userId || userId === 'undefined' || userId === 'null') {
        console.error('Критическая ошибка: ID пользователя не найден в localStorage или равен undefined.');
        alert('Сессия устарела или не зафиксирована. Пожалуйста, войдите снова на главной странице.');
        window.location.href = 'index.html';
        return;
        }
    
    console.log('Страница создания семьи готова. Используем user_id:', userId);

    // Ищем кнопку создания семьи
    const createBtn = document.getElementById('create-family-btn');
    if (!createBtn) {
        console.error('Кнопка #create-family-btn не найдена на странице!');
        return;
    }

    createBtn.addEventListener('click', async () => {
        const nameInput = document.getElementById('family-name-input');
        const errorDiv = document.getElementById('create-error');
        
        if (!nameInput || !errorDiv) {
            console.error('Элементы ввода или вывода ошибок не найдены в DOM');
            return;
        }

        const name = nameInput.value.trim();
        errorDiv.textContent = '';

        if (!name) {
            errorDiv.textContent = 'Введите имя семьи!';
            return;
        }

        try {
            console.log(`Отправляем запрос на создание семьи "${name}" для user_id: ${userId}`);
            
            const res = await fetch(`${API_URL}/family/create?name=${encodeURIComponent(name)}&user_id=${userId}`, {
                method: 'POST'
            });
            
            const data = await res.json();
            console.log('Ответ сервера на создание семьи:', data);

            // Проверяем статус (приводим к нижнему регистру на случай сюрпризов от бэкенда)
            const status = data.status?.toLowerCase().trim();

            if (status === 'family created' || data.family_id) {
                // Сохраняем данные для следующих страниц
                localStorage.setItem('family_id', data.family_id);
                localStorage.setItem('invite_code', data.invite_code || '');
                localStorage.setItem('family_name', data.name || name);
                
                console.log('Семья успешно создана! Перенаправление на created.html');
                window.location.href = 'created.html';
            } else {
                errorDiv.textContent = 'Ошибка: ' + (data.error || data.detail || 'Попробуйте позже');
            }
        } catch (e) {
            errorDiv.textContent = 'Нет связи с сервером';
            console.error('Ошибка при отправке fetch запроса:', e);
        }
    });
});
