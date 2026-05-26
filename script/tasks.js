const API_URL = 'https://todo-stasnau.amvera.io';
let allTasks = [];
let currentUserId = null;
let currentTab = 'my';

// Инициализация
document.addEventListener('DOMContentLoaded', async () => {
    console.log("Инициализация задач в tasks.js...");
    const storedId = localStorage.getItem('user_id');
    const storedVk = localStorage.getItem('vk_id');
    
    if (!storedId) {
        console.warn('user_id не найден, перенаправление на index.html');
        window.location.href = 'index.html';
        return;
    }
    
    currentUserId = parseInt(storedId);
    
    // Запускаем загрузку задач
    await loadTasks();
});

// Загрузка задач
async function loadTasks() {
    const container = document.getElementById('tasks-container');
    if (!container) {
        console.error("Элемент tasks-container не найден на странице!");
        return;
    }
    
    container.innerHTML = '<div style="color:white; text-align:center; padding:20px;">Загрузка задач...</div>';

    try {
        const res = await fetch(`${API_URL}/task/get_family_tasks?user_id=${currentUserId}`);
        if (!res.ok) throw new Error(`Ошибка сети: ${res.status}`);
        
        const data = await res.json();
        console.log("Данные задач от сервера:", data);

        if (data && data.status?.startsWith('ERR')) {
            container.innerHTML = `<div style="color:#ff6b6b; text-align:center; padding:20px;">❌ ${data.status}</div>`;
            return;
        }

        allTasks = data.tasks || [];
        renderTasks();
    } catch (e) {
        console.error("Ошибка при получении задач:", e);
        container.innerHTML = '<div style="color:#ff6b6b; text-align:center; padding:20px;">Задач пока нет или сервер недоступен</div>';
    }
}

// Переключение табов (Вынесли в window, чтобы html-атрибут onclick её точно видел)
window.switchTab = function(tab) {
    currentTab = tab;
    const tabMy = document.getElementById('tab-my');
    const tabAll = document.getElementById('tab-all');
    
    if (tabMy) tabMy.className = tab === 'my' ? 'tab-btn active' : 'tab-btn';
    if (tabAll) tabAll.className = tab === 'all' ? 'tab-btn active' : 'tab-btn';
    
    renderTasks();
}

// Отрисовка карточек
function renderTasks() {
    const container = document.getElementById('tasks-container');
    if (!container) return;
    
    container.innerHTML = '';

    // Фильтрация по табу
    const filtered = currentTab === 'my' 
        ? allTasks.filter(t => t.assigned_to_id === currentUserId)
        : allTasks;

    if (filtered.length === 0) {
        container.innerHTML = '<div style="color:white; text-align:center; padding:20px;">Задач пока нет</div>';
        return;
    }

    filtered.forEach(task => {
        const isDone = task.status === 'done';
        const html = `
            <div class="task-item ${isDone ? 'completed' : ''}">
                <input type="checkbox" class="task-checkbox" ${isDone ? 'checked' : ''} 
                       onchange="handleDelete(event, ${task.task_id})">
                <div class="task-content">
                    <div class="task-title">${escapeHtml(task.title)}</div>
                    <div class="task-assignee">
                        Кому: ${escapeHtml(task.assignee_name || 'Не назначен')} | От: ${escapeHtml(task.creator_name || 'Система')}
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += html;
    });
}

// Удаление задачи по чекбоксу
window.handleDelete = function(event, taskId) {
    event.stopPropagation();
    if (!confirm('Удалить эту задачу?')) {
        event.target.checked = !event.target.checked;
        return;
    }

    fetch(`${API_URL}/task/delete_task?task_id=${taskId}`, { method: 'POST' })
        .then(() => {
            allTasks = allTasks.filter(t => t.task_id !== taskId);
            renderTasks();
        })
        .catch(() => alert('Ошибка при удалении'));
}

// Защита от XSS при выводе текста
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
