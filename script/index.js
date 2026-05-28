const API_URL = 'https://todo-stasnau.amvera.io';

// Хелпер для безопасного чтения данных от бэкенда
function getField(obj, key) {
    if (!obj) return null;
    return obj[key] || obj[key + ' '] || obj[' ' + key];
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM успешно загружен. Инициализируем скрипты...");

    // 1. Инициализация VK Bridge (безопасный запуск)
    if (typeof vkBridge !== 'undefined') {
        vkBridge.send("VKWebAppInit", {})
            .then(data => {
                console.log("🍏 VK Bridge успешно инициализирован!", data);
            })
            .catch(error => {
                console.error("❌ Ошибка инициализации VK Bridge:", error);
            });
    } else {
        console.warn("⚠️ VK Bridge не найден. Если вы тестируете в обычном браузере, это нормально.");
    }

    // ==========================================
    // Логика: Вход через ВКонтакте
    // ==========================================
    // Теперь ищет в том числе класс .vk-button, который указан в HTML
    const vkBtn = document.querySelector('.vk-button') || document.querySelector('.vk-btn') || document.querySelector('.vk-login-btn') || document.getElementById('vk-login');

    if (vkBtn) {
        console.log("Кнопка ВК найдена, вешаем событие клика.");
        vkBtn.addEventListener('click', async () => {
            if (typeof vkBridge === 'undefined') {
                alert('Вы находитесь в обычном браузере. Для входа без ВК используйте форму Dev Mode ниже!');
                return;
            }

            try {
                const vkData = await vkBridge.send('VKWebAppGetUserInfo');
                console.log('Данные получены от VK API:', vkData);

                const registerUrl = `${API_URL}/user/register?vk_id=${vkData.id}&name=${encodeURIComponent(vkData.first_name)}`;
                const res = await fetch(registerUrl, { method: 'POST' });
                
                if (!res.ok) throw new Error(`Ошибка сервера при регистрации: ${res.status}`);
                const data = await res.json();
                
                const status = getField(data, 'status')?.trim();
                console.log('Статус регистрации:', status);
                
                if (status === 'already_exist' || status === 'user_created') {
                    localStorage.setItem('user_id', getField(data, 'id'));
                    localStorage.setItem('vk_id', getField(data, 'vk_id') || vkData.id);
                    localStorage.setItem('user_name', getField(data, 'name') || vkData.first_name);
                    
                    console.log('Проверяем семью для vk_id:', vkData.id);
                    try {
                        const famRes = await fetch(`${API_URL}/user/load_user_family?vk_id=${vkData.id}`);
                        if (!famRes.ok) throw new Error(`Ошибка сети при поиске семьи`);
                        
                        const famData = await famRes.json();
                        console.log('Ответ бэкенда по семье:', famData);
                        
                        const famStatus = getField(famData, 'status')?.trim();

                        if (famStatus === 'family_found') {
                            localStorage.setItem('family_id', getField(famData, 'family_id'));
                            const code = famData.invite_code || famData.code || getField(famData, 'invite_code') || famData.invite_key;
                            if (code) {
                                localStorage.setItem('invite_code', String(code).trim());
                            }
                            window.location.href = 'tasks.html';
                        } else {
                            window.location.href = 'choose.html';
                        }
                    } catch (famErr) {
                        console.error('Ошибка проверки семьи, отправляем на choose.html:', famErr);
                        window.location.href = 'choose.html';
                    }
                } else {
                    alert('Ошибка авторизации: ' + status);
                }
            } catch (error) {
                console.error('Критическая ошибка VK Login:', error);
                alert('Не удалось войти через ВК. Проверьте консоль.');
            }
        });
    }

    // ==========================================
    // Логика: Ручной вход (Dev Mode)
    // ==========================================
    const devForm = document.getElementById('dev-form');

    if (devForm) {
        console.log("Форма Dev Mode найдена, инициализируем.");
        devForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const vkIdInput = document.getElementById('dev-vk-id');
            const nameInput = document.getElementById('dev-name');
            const passwordInput = document.getElementById('dev-password');
            const errorDiv = document.getElementById('dev-error');
            const btn = document.getElementById('dev-login-btn');
            
            const vkId = vkIdInput?.value.trim();
            const name = nameInput?.value.trim();
            const password = passwordInput?.value.trim();

            if (errorDiv) errorDiv.textContent = '';

            if (!vkId || !name) {
                if (errorDiv) errorDiv.textContent = 'Заполните VK ID и имя!';
                return;
            }

            if (btn) {
                btn.disabled = true;
                btn.textContent = 'Проверка...';
            }

            try {
                // Проверка пароля разработчика
                const passRes = await fetch(`${API_URL}/check-password`, {
                    document: 'POST', // обрати внимание, в твоем коде тут было написано document вместо method, оставил структуру, но если бэк упадет — поменяй на method: 'POST'
                    method: 'POST', 
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ password })
                });
                const passData = await passRes.json();
                
                if (!passData.valid) {
                    if (errorDiv) errorDiv.textContent = 'Неправильный пароль';
                    return;
                }

                // Регистрация dev-пользователя
                const res = await fetch(`${API_URL}/user/register?vk_id=${vkId}&name=${encodeURIComponent(name)}`, { method: 'POST' });
                const data = await res.json();
                const status = getField(data, 'status')?.trim();
                
                if (status === 'already_exist' || status === 'user_created') {
                    localStorage.setItem('user_id', getField(data, 'id'));
                    localStorage.setItem('vk_id', getField(data, 'vk_id'));
                    localStorage.setItem('user_name', getField(data, 'name'));
                    
                    // Проверка семьи для dev-пользователя
                    const famRes = await fetch(`${API_URL}/user/load_user_family?vk_id=${vkId}`);
                    const famData = await famRes.json();
                    const famStatus = getField(famData, 'status')?.trim();

                    if (famStatus === 'family_found') {
                        localStorage.setItem('family_id', getField(famData, 'family_id'));
                        const code = famData.invite_code || famData.code || getField(famData, 'invite_code');
                        if (code) {
                            localStorage.setItem('invite_code', String(code).trim());
                        }
                        window.location.href = 'tasks.html';
                    } else {
                        window.location.href = 'choose.html';
                    }
                } else {
                    if (errorDiv) errorDiv.textContent = 'Ошибка бэкенда: ' + status;
                }
            } catch (err) {
                console.error(err);
                if (errorDiv) errorDiv.textContent = 'Нет связи с сервером!';
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = 'Зарегистрировать и войти';
                }
            }
        });
    }
});
