// Инициализация VK Bridge
vkBridge.send("VKWebAppInit", {})
  .then(data => {
    console.log("VK Bridge инициализирован!", data);
  })
  .catch(error => {
    console.error("Ошибка инициализации моста:", error);
  });

const API_URL = 'https://todo-stasnau.amvera.io';

// Хелпер для безопасного чтения данных
function getField(obj, key) {
    return obj[key] || obj[key + ' '] || obj[' ' + key];
}

// === Авторизация через ВК ===
const vkMainBtn = document.querySelector('.vk-btn') || document.querySelector('.vk-login-btn');

if (vkMainBtn) {
    vkMainBtn.addEventListener('click', async () => {
        try {
            const vkData = await vkBridge.send('VKWebAppGetUserInfo');
            console.log('Данные от ВК:', vkData);

            const res = await fetch(`${API_URL}/user/register?vk_id=${vkData.id}&name=${encodeURIComponent(vkData.first_name)}`, { 
                method: 'POST' 
            });
            const data = await res.json();
            const status = getField(data, 'status')?.trim();
            
            if (status === 'already_exist' || status === 'user_created') {
                localStorage.setItem('user_id', getField(data, 'id'));
                localStorage.setItem('vk_id', getField(data, 'vk_id'));
                localStorage.setItem('user_name', getField(data, 'name'));
                
                // Проверяем семью
                try {
                    const famRes = await fetch(`${API_URL}/user/load_user_family?vk_id=${getField(data, 'vk_id')}`);
                    const famData = await famRes.json();
                    const famStatus = getField(famData, 'status')?.trim();

                    if (famStatus === 'family_found') {
                        localStorage.setItem('family_id', getField(famData, 'family_id'));
                        // СУЩЕСТВЕННО: Сохраняем инвайт-код, если бэкенд его возвращает
                        if (famData.invite_code || famData.code) {
                            localStorage.setItem('invite_code', famData.invite_code || famData.code);
                        }
                        window.location.href = 'tasks.html';
                    } else {
                        window.location.href = 'choose.html';
                    }
                } catch (famErr) {
                    console.warn('Ошибка проверки семьи, переход на choose.html', famErr);
                    window.location.href = 'choose.html';
                }
            } else {
                alert('Ошибка: ' + status);
            }
        } catch (error) {
            console.error('Ошибка VK Bridge:', error);
            alert('Вход через ВК отменен или произошел сбой.');
        }
    });
}

// === Ручной Dev Mode вход ===
document.getElementById('dev-form').addEventListener('submit', async (e) => {
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
        const passRes = await fetch(`${API_URL}/check-password`, {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
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
            localStorage.setItem('user_id', getField(data, 'id'));
            localStorage.setItem('vk_id', getField(data, 'vk_id'));
            localStorage.setItem('user_name', getField(data, 'name'));
            
            try {
                const famRes = await fetch(`${API_URL}/user/load_user_family?vk_id=${vkId}`);
                const famData = await famRes.json();
                console.log("Данные семьи в dev-mode:", famData);
                const famStatus = getField(famData, 'status')?.trim();

                if (famStatus === 'family_found') {
                    localStorage.setItem('family_id', getField(famData, 'family_id'));
                    
                    // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Записываем инвайт-код в localStorage
                    // Проверяем все возможные ключи, которые может прислать бэкенд
                    const code = famData.invite_code || famData.code || getField(famData, 'invite_code');
                    if (code) {
                        localStorage.setItem('invite_code', code);
                    }
                    
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
