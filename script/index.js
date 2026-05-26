// Инициализация
vkBridge.send("VKWebAppInit", {})
  .then(data => {
    console.log("VK Bridge инициализирован!", data);
  })
  .catch(error => {
    console.error("Ошибка инициализации моста:", error);
  });

const API_URL = 'https://todo-stasnau.amvera.io';

    // Хелпер для безопасного чтения данных (учитывает пробелы в ключах бэкенда если есть)
    function getField(obj, key) {
        return obj[key] || obj[key + ' '] || obj[' ' + key];
    }
// === Авторизация через ВК ===
const vkMainBtn = document.querySelector('.vk-btn') || document.querySelector('.vk-login-btn');

if (vkMainBtn) {
    vkMainBtn.addEventListener('click', async () => {
        try {
            // 1. Получаем данные пользователя из ВК
            const vkData = await vkBridge.send('VKWebAppGetUserInfo');
            console.log('Данные от ВК:', vkData);

            // 2. Отправляем данные на бэкенд (уточни эндпоинт у бэкендера, если он отличается)
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
                    launch_params: window.location.search // Передаем параметры для проверки подписи vk_sign
                })
            });

            const result = await response.json();

            if (response.ok) {
                localStorage.setItem('user_id', result.user_id);
                localStorage.setItem('role', result.role || 'Ребёнок');
                
                if (result.invite_code) {
                    localStorage.setItem('invite_code', result.invite_code);
                    window.location.href = 'main.html'; // На главную доску задач
                } else {
                    window.location.href = 'create.html'; // На создание семьи, если её нет
                }
            } else {
                alert('Ошибка: ' + (result.message || 'Сервер отклонил вход'));
            }

        } catch (error) {
            console.error('Ошибка VK Bridge:', error);
            alert('Вход через ВК был отменен или произошел сбой.');
        }
    });
}
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
            const passRes = await fetch('https://todo-stasnau.amvera.io/check-password', {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "ngrok-skip-browser-warning": "true"  // ВОТ ЭТО ДОБАВЬ
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

            // Читаем статус
            const status = getField(data, 'status')?.trim();
            
            if (status === 'already_exist' || status === 'user_created') {
                // Читаем данные
                const userId = getField(data, 'id');
                const userVk = getField(data, 'vk_id');
                const userName = getField(data, 'name');

                // Сохраняем в LocalStorage
                localStorage.setItem('user_id', userId);
                localStorage.setItem('vk_id', userVk);
                localStorage.setItem('user_name', userName);
                
                // 🔹 НОВОЕ: Проверяем, есть ли уже семья
                try {
                    const famRes = await fetch(`${API_URL}/user/load_user_family?vk_id=${userVk}`);
                    const famData = await famRes.json();
                    const famStatus = getField(famData, 'status')?.trim();

                    if (famStatus === 'family_found') {
                        //  Уже в семье -> сохраняем family_id и идём сразу в задачи
                        const familyId = getField(famData, 'family_id');
                        localStorage.setItem('family_id', familyId);
                        window.location.href = 'tasks.html';
                    } else {
                        // Семьи нет -> идём на choose.html (как было)
                        window.location.href = 'choose.html';
                    }
                } catch (famErr) {
                    // Если проверка семьи упала — всё равно идём на choose.html
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
