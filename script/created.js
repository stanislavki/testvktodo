document.addEventListener('DOMContentLoaded', () => {
    // 1. Достаем сохраненный инвайт-код из памяти браузера
    const inviteCode = localStorage.getItem('invite_code');
    
    // 2. Находим элемент на странице по его ID
    const codeBox = document.getElementById('invite-code');
    
    if (codeBox) {
        if (inviteCode) {
            // Если код нашли, вставляем его вместо "Загрузка..."
            codeBox.textContent = inviteCode;
        } else {
            // Если кода вдруг нет в памяти (для подстраховки)
            codeBox.textContent = 'Код не найден';
            codeBox.style.color = '#ff6b6b'; 
        }
    } else {
        console.error('Элемент #invite-code не найден на странице!');
    }
});
