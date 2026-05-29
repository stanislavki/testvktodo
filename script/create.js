const API_URL = 'https://todo-stasnau.amvera.io';

document.addEventListener('DOMContentLoaded', () => {
    // Берём ИМЕННО vk_id, как того требует бэкенд
    const vkId = localStorage.getItem('vk_id');
    
    if (!vkId) {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('create-family-btn').addEventListener('click', async () => {
        const nameInput = document.getElementById('family-name-input');
        const errorDiv = document.getElementById('create-error');
        const name = nameInput.value.trim();

        errorDiv.textContent = '';

        if (!name) {
            errorDiv.textContent = 'Введите имя семьи!';
            return;
        }

        try {
            // Отправляем vk_id под параметром user_id (как указано в твоем роутере)
            const res = await fetch(`${API_URL}/family/create?name=${encodeURIComponent(name)}&user_id=${vkId}`, {
                method: 'POST'
            });
            const data = await res.json();

            if (data.status === 'family created') {
                localStorage.setItem('family_id', data.family_id);
                localStorage.setItem('invite_code', data.invite_code);
                localStorage.setItem('family_name', data.name);
                
                window.location.href = `created.html?invite_code=${data.invite_code}`;
            } else {
                errorDiv.textContent = 'Ошибка: ' + (data.error || 'Попробуйте позже');
            }
        } catch (e) {
            errorDiv.textContent = 'Нет связи с сервером';
            console.error(e);
        }
    });
});
