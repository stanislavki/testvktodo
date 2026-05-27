const API_URL = 'https://todo-stasnau.amvera.io';
const statusMsg = document.getElementById('status-msg');
const btnCreate = document.getElementById('btn-create');
const btnJoin = document.getElementById('btn-join');

// Регистрация / получение ID пользователя
async function ensureUserRegistered(vk_id, name) {
    try {
        const res = await fetch(`${API_URL}/user/register?vk_id=${vk_id}&name=${encodeURIComponent(name)}`, { 
            method: 'POST' 
        });
        const data = await res.json();
        
        if (data.status === 'already_exist' || data.status === 'user_created') {
            // Пытаемся сохранить в localStorage (если браузер разрешит)
            try {
                localStorage.setItem('user_id', data.id);
                localStorage.setItem('vk_id', data.vk_id);
                localStorage.setItem('user_name', data.name);
            } catch (e) { console.warn("localStorage заблокирован, работаем через URL"); }
            return data.id;
        } else {
            throw new Error(data.status || 'Ошибка регистрации');
        }
    } catch (e) {
        console.error(e);
        statusMsg.textContent = '❌ Нет связи с сервером';
        return null;
    }
}

// Проверка: состоит ли пользователь уже в семье
async function checkFamilyStatus(vk_id) {
    try {
        const res = await fetch(`${API_URL}/user/load_user_family?vk_id=${vk_id}`);
        const data = await res.json();
        
        if (data.status === 'family_found') {
            try { localStorage.setItem('family_id', data.family_id); } catch(e){}
            statusMsg.textContent = '✅ Семья найдена, переходим...';
            // ВАЖНО: Пробрасываем URL-параметры дальше!
            setTimeout(() => window.location.href = 'tasks.html' + window.location.search, 500);
            return true;
        }
        return false;
    } catch (e) {
        console.error(e);
        return false;
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    // 1. ДОСТАЕМ ID ИЗ ССЫЛКИ ВК (самый надежный способ в iframe)
    const urlParams = new URLSearchParams(window.location.search);
    let vk_id = urlParams.get('vk_user_id') || localStorage.getItem('vk_id');
    
    // Имя ВК в ссылку не кладет, поэтому берем из памяти или ставим заглушку
    let name = localStorage.getItem('user_name') || `Пользователь ${vk_id}`;

    if (!vk_id) {
        statusMsg.textContent = '⚠️ Данные потеряны. Возвращаем на главную...';
        setTimeout(() => window.location.href = 'index.html', 2000);
        return;
    }

    statusMsg.textContent = '⏳ Загрузка...';

    // Гарантируем, что пользователь есть в БД
    const user_id = await ensureUserRegistered(vk_id, name);
    if (!user_id) return;

    // Проверяем, есть ли уже семья
    const hasFamily = await checkFamilyStatus(vk_id);
    if (hasFamily) return;

    // Если семьи нет, разблокируем кнопки выбора
    statusMsg.textContent = '';
    btnCreate.disabled = false;
    btnJoin.disabled = false;

    // 2. ВАЖНО: При клике тащим параметры VK в адресной строке на следующие страницы!
    btnCreate.addEventListener('click', () => {
        window.location.href = 'create.html' + window.location.search;
    });

    btnJoin.addEventListener('click', () => {
        window.location.href = 'join.html' + window.location.search;
    });
});
