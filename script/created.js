document.addEventListener('DOMContentLoaded', () => {
    // 1. Пробуем достать код прямо из URL-адреса страницы
    const urlParams = new URLSearchParams(window.location.search);
    let inviteCode = urlParams.get('invite_code');
    
    // 2. Если в URL кода нет, пробуем взять из localStorage (на случай обычного перехода)
    if (!inviteCode) {
        inviteCode = localStorage.getItem('invite_code');
    }
    
    // 3. Находим элемент на странице
    const codeBox = document.getElementById('invite-code');
    
    if (codeBox) {
        if (inviteCode) {
            codeBox.textContent = inviteCode;
            console.log("Код семьи успешно отображен:", inviteCode);
        } else {
            codeBox.textContent = 'Код не найден';
            codeBox.style.color = '#ff6b6b';
        }
    } else {
        console.error('Элемент #invite-code не найден на странице!');
    }
});
