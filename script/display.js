async function loadFamilyName() {
    const inviteCode = localStorage.getItem('invite_code');
    const familyId = localStorage.getItem('family_id');
    const familyTitleDisplay = document.getElementById('family-title');

    if (!familyTitleDisplay) return;

    if (!inviteCode && !familyId) {
        familyTitleDisplay.textContent = 'СЕМЬЯ';
        return;
    }

    try {
        let res;
        // Пробуем сначала по инвайт-коду, если нет - по id семьи
        if (inviteCode) {
            res = await fetch(`${API_URL}/family/get-by-code?invite_code=${encodeURIComponent(inviteCode)}`);
        } else {
            res = await fetch(`${API_URL}/family/get?family_id=${encodeURIComponent(familyId)}`);
        }

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        let data = await res.json();
        console.log("Данные от бэкенда Amvera:", data);

        // ПОДСТРАХОВКА 1: Если бэкенд возвращает массив объектов [ {...} ], берем первый элемент
        if (Array.isArray(data)) {
            data = data[0];
        }

        // ПОДСТРАХОВКА 2: Ищем имя во всех возможных ключах (даже с пробелами, используя getField если он есть)
        let familyName = null;
        if (data) {
            familyName = data.name || 
                         data.family_name || 
                         data.title || 
                         data.family_title ||
                         (typeof getField === 'function' ? getField(data, 'name') || getField(data, 'family_name') : null);
        }

        // Если нашли имя - выводим и кэшируем
        if (familyName) {
            const finalName = String(familyName).trim().toUpperCase();
            familyTitleDisplay.textContent = finalName;
            localStorage.setItem('family_name', finalName);
            console.log("Имя семьи успешно отрисовано:", finalName);
            return;
        }

        // ПОДСТРАХОВКА 3: Если бэкенд прислал статус "already_exist" или "family_found" и id, но без текста,
        // а в кэше пусто, временно пишем "СЕМЬЯ №" + ID, чтобы не висели точки
        if (familyId) {
            familyTitleDisplay.textContent = `СЕМЬЯ №${familyId}`;
        } else {
            familyTitleDisplay.textContent = 'СЕМЬЯ';
        }

    } catch (e) {
        console.error('Ошибка в loadFamilyName:', e);
        // При жестком падении сети берем последнее имя из кэша или пишем дефолт
        const cached = localStorage.getItem('family_name');
        familyTitleDisplay.textContent = cached ? cached.toUpperCase() : 'СЕМЬЯ';
    }
}
