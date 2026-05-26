// Инициализация VK Bridge
vkBridge.send("VKWebAppInit", {})
  .then(data => {
    console.log("VK Bridge инициализирован успешно!", data);
  })
  .catch(error => {
    console.error("Ошибка инициализации моста:", error);
  });

const API_URL = 'https://todo-stasnau.amvera.io';

// Хелпер для безопасного чтения данных (учитывает пробелы в ключах бэкенда, если они есть)
function getField(obj, key) {
    return obj[key] || obj[key + ' '] || obj[' ' + key];
}

// === Авторизация через ВК ===
const vkMainBtn = document.getElementById('vk-login') || document.querySelector('.vk-button');

if (vkMainBtn) {
    console.log("Кнопка ВК успешно найдена в DOM! Вешаем событие клика...");
    
    vkMainBtn.addEventListener('click', async () => {
        console.log("Клик по кнопке ВК зафиксирован. Запрашиваем VKWebAppGetUserInfo...");
        try {
            // 1. Получаем данные пользователя из ВК
            const vkData = await vkBridge.send('VKWebAppGetUserInfo');
            console.log('Данные от ВК получены успешно:', vkData);

            // 2. Проверяем параметры / подпись (если требуется вашим бэкендом)
            console.log('Отправляем запрос на бэкенд:', `${API_URL}/check-password`);
            const response = await fetch(`${API_URL}/check-password`, { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    vk_id: vkData.id,
                    first_name: vkData.first_name,
                    last_name: vkData.last_name,
                    photo: vkData.photo_200,
                    launch_params: window.location.search 
                })
            });

            // 3. ДОБАВЛЕНО/ИСПРАВЛЕНО: Регистрируем пользователя в БД (как в Dev Mode!)
            console.log('Регистрируем пользователя на бэкенде...');
            const fullName = `${vkData.first_name} ${vkData.last_name}`.trim();
            const regRes = await fetch(`${API_URL}/user/register?vk_id=${vkData.id}&name=${encodeURIComponent(fullName)}`, { 
                method: 'POST' 
            });
            const regData = await regRes.json();
            console.log('Ответ от бэкенда user/register:', regData);

            const status = getField(regData, 'status')?.trim();
            
            if (status === 'already_exist' || status === 'user_created') {
                const userId = getField(regData, 'id');
                const userVk = getField(regData, 'vk_id');
                const userName = getField(regData, 'name');

                // Сохраняем ВСЕ варианты ID в localStorage, чтобы на странице создания семьи (create.js) ничего не потерялось
                localStorage.setItem('user_id', userId);
                localStorage.setItem('vk_user_id', userVk); // На всякий случай для create.js
                localStorage.setItem('vk_id', userVk);
                localStorage.setItem('user_name', userName);
                
                // 4. Проверяем, состоит ли пользователь в семье
                try {
                    const famRes = await fetch(`${API_URL}/user/load_user_family?vk_id=${userVk}`);
                    const famData = await famRes.json();
                    const famStatus = getField(famData, 'status')?.trim();

                    if (famStatus === 'family_found') {
                        const familyId = getField(famData, 'family_id');
                        localStorage.setItem('family_id', familyId);
                        console.log('Семья найдена. Перенаправление на tasks.html');
                        window.location.href = 'tasks.html';
                    } else {
                        console.log('Семья не найдена. Перенаправление на choose.html');
                        window.location.href = 'choose.html';
                    }
                } catch (famErr) {
                    console.warn('Не удалось проверить семью, переход на choose.html', famErr);
                    window.location.href = 'choose.html';
                }
                
            } else {
                alert('Ошибка регистрации пользователя в базе: ' + status);
            }

        } catch (error) {
            console.error('Ошибка в процессе авторизации VK Bridge:', error);
            alert('Вход через ВК был отменен или произошел сбой.');
        }
    });
} else {
    console.warn("Предупреждение: Кнопка для входа через ВК не найдена на этой странице.");
}

// === Временная панель разработчика (Dev Mode) ===
const devForm = document.getElementById('dev-form');
if (devForm) {
    devForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const vkIdInput = document.getElementById('dev-vk-id');
        const nameInput = document.getElementById('dev-name');
        const passwordInput = document.getElementById('dev-password');
        const errorDiv = document.getElementById('dev-error');
        const btn = document.getElementById('dev-login-btn');
        
        const vkId = vkIdInput.value.trim();
        const name = nameInput.value.trim();
        const password = passwordInput.value.trim();

        errorDiv.textContent = '';

        if (!vkId || !name) {
            errorDiv.textContent = 'Заполните VK ID и имя!';
            return;
        }

        btn.disabled = true;
        btn.textContent = 'Проверка...';

        try {
            const passRes = await fetch('https://todo-stasnau.amvera.io/check-password', {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "ngrok-skip-browser-warning": "true"
                },
                body: JSON.stringify({ password })
            });
            const passData = await passRes.json();
            
            if (!passData.valid) {
                errorDiv.textContent = 'Неправильный пароль';
                btn.disabled = false;
                btn.textContent = 'Зарегистрировать и войти';
                return;
            }
        } catch (e) {
            errorDiv.textContent = 'Нет связи с сервером!';
            console.error(e);
            btn.disabled = false;
            btn.textContent = 'Зарегистрировать и войти';
            return;
        }

        btn.disabled = true;
        btn.textContent = 'Регистрация...';

        try {
            const res = await fetch(`${API_URL}/user/register?vk_id=${vkId}&name=${encodeURIComponent(name)}`, { 
                method: 'POST' 
            });
            const data = await res.json();

            const status = getField(data, 'status')?.trim();
            
            if (status === 'already_exist' || status === 'user_created') {
                const userId = getField(data, 'id');
                const userVk = getField(data, 'vk_id');
                const userName = getField(data, 'name');

                localStorage.setItem('user_id', userId);
                localStorage.setItem('vk_user_id', userVk);
                localStorage.setItem('vk_id', userVk);
                localStorage.setItem('user_name', userName);
                
                try {
                    const famRes = await fetch(`${API_URL}/user/load_user_family?vk_id=${userVk}`);
                    const famData = await famRes.json();
                    const famStatus = getField(famData, 'status')?.trim();

                    if (famStatus === 'family_found') {
                        const familyId = getField(famData, 'family_id');
                        localStorage.setItem('family_id', familyId);
                        window.location.href = 'tasks.html';
                    } else {
                        window.location.href = 'choose.html';
                    }
                } catch (famErr) {
                    console.warn('Не удалось проверить семью, переход на choose.html', famErr);
                    window.location.href = 'choose.html';
                }
                
            } else {
                errorDiv.textContent = 'Ошибка: ' + status;
            }
        } catch (e) {
            errorDiv.textContent = 'Нет связи с сервером!';
            console.error(e);
        } finally {
            btn.disabled = false;
            btn.textContent = 'Зарегистрировать и войти';
        }
    });
}
