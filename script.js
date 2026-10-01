let isRegisterMode = false;
let currentLang = 'ru';
let activeChatId = 'Администратор';
let isMuted = false;
let isCamOn = false;

// Звуки Discord CDN
const sounds = {
    join: new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'),
    message: new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3'),
    call: new Audio('https://assets.mixkit.co/active_storage/sfx/1351/1351-preview.mp3')
};

function playSound(type) {
    const soundEnabled = document.getElementById('setting-sounds')?.checked ?? true;
    if (!soundEnabled || !sounds[type]) return;
    sounds[type].currentTime = 0;
    sounds[type].play().catch(() => {});
}

const translations = {
    ru: {
        authTitle: "Gistord // Авторизация",
        authSubtitle: "Введите данные для доступа к системе",
        userPlaceholder: "Имя пользователя (Юзернейм)",
        passPlaceholder: "Пароль",
        loginBtn: "Войти",
        registerBtn: "Зарегистрироваться",
        switchToReg: "Нет аккаунта? Зарегистрироваться",
        switchToLogin: "Уже есть аккаунт? Войти",
        logout: "Выйти",
        sendBtn: "Отправить",
        msgPlaceholder: "Введите сообщение...",
        fillFields: "Пожалуйста, заполните все поля!",
        userExists: "Такой пользователь уже существует!",
        regSuccess: "Аккаунт успешно создан! Теперь войдите.",
        userNotFound: "Пользователь не найден! Сначала зарегистрируйтесь.",
        wrongPass: "Неверный пароль!",
        bannedAlert: "Ваш аккаунт заблокирован администратором!"
    },
    en: {
        authTitle: "Gistord // Authorization",
        authSubtitle: "Enter your credentials to access the system",
        userPlaceholder: "Username",
        passPlaceholder: "Password",
        loginBtn: "Login",
        registerBtn: "Register",
        switchToReg: "Don't have an account? Register",
        switchToLogin: "Already have an account? Login",
        logout: "Logout",
        sendBtn: "Send",
        msgPlaceholder: "Type a message...",
        fillFields: "Please fill in all fields!",
        userExists: "User already exists!",
        regSuccess: "Account successfully created! You can now log in.",
        userNotFound: "User not found! Please register first.",
        wrongPass: "Incorrect password!",
        bannedAlert: "Your account has been banned by an administrator!"
    },
    by: {
        authTitle: "Gistord // Аўтарызацыя",
        authSubtitle: "Увядзіце дадзеныя для доступу да сістэмы",
        userPlaceholder: "Імя карыстальніка",
        passPlaceholder: "Пароль",
        loginBtn: "Увайсці",
        registerBtn: "Зарэгістравацца",
        switchToReg: "Няма акаўнта? Зарэгістравацца",
        switchToLogin: "Ужо ёсць акаўнт? Увайсці",
        logout: "Выйсці",
        sendBtn: "Адправіць",
        msgPlaceholder: "Увядзіце паведамленне...",
        fillFields: "Калі ласка, запоўніце ўсе палі!",
        userExists: "Такі карыстальнік ужо існуе!",
        regSuccess: "Акаўнт паспяхова створаны! Цяпер увайдзіце.",
        userNotFound: "Карыстальнік не знойдзены! Спачатку зарэгіструйцеся.",
        wrongPass: "Няправільны пароль!",
        bannedAlert: "Ваш акаўнт заблакаваны адміністратарам!"
    }
};

function showToast(text) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = text;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function togglePasswordVisibility() {
    const passInput = document.getElementById('password');
    const btn = document.getElementById('toggle-pass-btn');
    if (passInput.type === 'password') {
        passInput.type = 'text';
        btn.innerText = '🙈';
    } else {
        passInput.type = 'password';
        btn.innerText = '👁';
    }
}

function setLanguage(lang, event) {
    currentLang = lang;
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    updateTexts();
}

function updateTexts() {
    const t = translations[currentLang];
    document.getElementById('auth-title').innerText = t.authTitle;
    document.getElementById('auth-subtitle').innerText = t.authSubtitle;
    document.getElementById('username').placeholder = t.userPlaceholder;
    document.getElementById('password').placeholder = t.passPlaceholder;
    document.getElementById('logout-text').innerText = t.logout;
    document.getElementById('send-btn').innerText = t.sendBtn;
    document.getElementById('msg-input').placeholder = t.msgPlaceholder;

    const mainBtn = document.getElementById('main-action-btn');
    const switchBtn = document.getElementById('switch-mode-btn');

    if (isRegisterMode) {
        mainBtn.innerText = t.registerBtn;
        switchBtn.innerText = t.switchToLogin;
    } else {
        mainBtn.innerText = t.loginBtn;
        switchBtn.innerText = t.switchToReg;
    }
}

function toggleAuthMode() {
    isRegisterMode = !isRegisterMode;
    updateTexts();
}

function handleAuth() {
    const t = translations[currentLang];
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();

    if (!user || !pass) {
        showToast(t.fillFields);
        return;
    }

    const bannedList = JSON.parse(localStorage.getItem('gistord_banned_list') || '[]');
    if (bannedList.includes(user)) {
        showToast(t.bannedAlert);
        return;
    }

    if (isRegisterMode) {
        if (localStorage.getItem('gistord_user_' + user)) {
            showToast(t.userExists);
            return;
        }
        localStorage.setItem('gistord_user_' + user, pass);
        // Создаем профиль по умолчанию для нового юзера
        localStorage.setItem('gistord_profile_' + user, JSON.stringify({
            displayName: user,
            avatarUrl: '',
            bio: 'В сети'
        }));
        showToast(t.regSuccess);
        toggleAuthMode();
    } else {
        const savedPass = localStorage.getItem('gistord_user_' + user);
        if (!savedPass) {
            showToast(t.userNotFound);
            return;
        }
        if (savedPass !== pass) {
            showToast(t.wrongPass);
            return;
        }
        enterChat(user);
    }
}

function enterChat(username) {
    playSound('join');
    document.getElementById('auth-box').style.display = 'none';
    document.getElementById('messenger-app').style.display = 'flex';
    sessionStorage.setItem('current_user', username);

    loadUserProfileUI(username);
    renderFriendsList();

    if (username === 'Mixxi') {
        document.getElementById('admin-server-icon').style.display = 'flex';
    } else {
        document.getElementById('admin-server-icon').style.display = 'none';
    }

    loadMessagesForCurrentChat();
}

function loadUserProfileUI(username) {
    let profile = JSON.parse(localStorage.getItem('gistord_profile_' + username) || null);
    if (!profile) {
        profile = { displayName: username, avatarUrl: '', bio: 'В сети' };
        localStorage.setItem('gistord_profile_' + username, JSON.stringify(profile));
    }

    document.getElementById('logged-username-disp').innerText = profile.displayName;
    document.getElementById('mini-user-bio').innerText = profile.bio;
    
    const avatarEl = document.getElementById('mini-avatar-preview');
    if (profile.avatarUrl) {
        avatarEl.style.backgroundImage = `url('${profile.avatarUrl}')`;
        avatarEl.innerText = '';
    } else {
        avatarEl.style.backgroundImage = 'none';
        avatarEl.innerText = profile.displayName.charAt(0).toUpperCase();
    }
}

function logout() {
    sessionStorage.removeItem('current_user');
    document.getElementById('messenger-app').style.display = 'none';
    document.getElementById('auth-box').style.display = 'block';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

function switchNav(type, el) {
    document.querySelectorAll('#servers-sidebar .server-icon').forEach(i => {
        if(i.id !== 'admin-server-icon') i.classList.remove('active');
    });
    if(el.id !== 'admin-server-icon') el.classList.add('active');

    const dmsList = document.getElementById('dms-list');
    const serverChannels = document.getElementById('server-channels-list');
    const sectionTitle = document.getElementById('sidebar-section-title');

    if (type === 'dms') {
        dmsList.style.display = 'flex';
        serverChannels.style.display = 'none';
        sectionTitle.innerText = "Личные сообщения";
        openChat('Администратор', 'dm');
    } else {
        dmsList.style.display = 'none';
        serverChannels.style.display = 'flex';
        sectionTitle.innerText = "Gistord Network";
        openChat('общий-чат', 'server');
    }
}

function openChat(chatName, type, el = null) {
    activeChatId = chatName;
    if (el) {
        document.querySelectorAll('.channel-item').forEach(i => i.classList.remove('active'));
        el.classList.add('active');
    }
    document.getElementById('channel-title').innerText = (type === 'dm' ? "Личный чат // " : "Канал // ") + chatName;
    loadMessagesForCurrentChat();
}

function loadMessagesForCurrentChat() {
    const view = document.getElementById('messages-view');
    view.innerHTML = '';
    const historyKey = 'gistord_chat_' + activeChatId;
    const history = JSON.parse(localStorage.getItem(historyKey) || '[]');

    if (history.length === 0) {
        view.innerHTML = `<div class="msg-item"><span class="msg-user">[Система]:</span> <span class="msg-text">Начало истории чата с ${activeChatId}</span></div>`;
    } else {
        history.forEach(m => {
            const msgDiv = document.createElement('div');
            msgDiv.className = 'msg-item';
            msgDiv.innerHTML = `<span class="msg-user">[${m.user}]:</span> <span class="msg-text">${escapeHtml(m.text)}</span>`;
            view.appendChild(msgDiv);
        });
    }
    view.scrollTop = view.scrollHeight;
}

function sendMessage() {
    const input = document.getElementById('msg-input');
    const currentUser = sessionStorage.getItem('current_user') || 'Guest';
    const text = input.value.trim();

    const mutedList = JSON.parse(localStorage.getItem('gistord_muted_list') || '[]');
    if (mutedList.includes(currentUser)) {
        showToast("Вам выдан мут! Вы не можете отправлять сообщения.");
        return;
    }

    if (text !== "") {
        playSound('message');
        const historyKey = 'gistord_chat_' + activeChatId;
        const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
        
        const newMsg = { user: currentUser, text: text };
        history.push(newMsg);
        localStorage.setItem(historyKey, JSON.stringify(history));

        const view = document.getElementById('messages-view');
        const msgDiv = document.createElement('div');
        msgDiv.className = 'msg-item';
        msgDiv.innerHTML = `<span class="msg-user">[${currentUser}]:</span> <span class="msg-text">${escapeHtml(text)}</span>`;
        view.appendChild(msgDiv);
        input.value = "";
        view.scrollTop = view.scrollHeight;
    }
}

// СИСТЕМА ДРУЗЕЙ ПО ЮЗЕРНЕЙМУ
function openAddFriendModal() {
    document.getElementById('add-friend-modal').style.display = 'flex';
}

function closeAddFriendModal() {
    document.getElementById('add-friend-modal').style.display = 'none';
    document.getElementById('friend-username-input').value = '';
}

function sendFriendRequest() {
    const friendUser = document.getElementById('friend-username-input').value.trim();
    const currentUser = sessionStorage.getItem('current_user');

    if (!friendUser) {
        showToast("Введите юзернейм друга!");
        return;
    }
    if (friendUser === currentUser) {
        showToast("Нельзя добавить самого себя!");
        return;
    }

    // Проверяем существование такого юзера в системе
    const exists = localStorage.getItem('gistord_user_' + friendUser);
    if (!exists) {
        showToast("Пользователь с таким юзернеймом не найден!");
        return;
    }

    let friendsKey = 'gistord_friends_' + currentUser;
    let friends = JSON.parse(localStorage.getItem(friendsKey) || '[]');

    if (friends.includes(friendUser)) {
        showToast("Этот пользователь уже у вас в друзьях!");
        return;
    }

    friends.push(friendUser);
    localStorage.setItem(friendsKey, JSON.stringify(friends));
    showToast(`Друг ${friendUser} успешно добавлен!`);
    closeAddFriendModal();
    renderFriendsList();
}

function renderFriendsList() {
    const currentUser = sessionStorage.getItem('current_user');
    const container = document.getElementById('dynamic-friends-container');
    if (!container) return;
    
    let friends = JSON.parse(localStorage.getItem('gistord_friends_' + currentUser) || '[]');
    container.innerHTML = '';

    friends.forEach(f => {
        const item = document.createElement('div');
        item.className = 'channel-item';
        item.onclick = function() { openChat(f, 'dm', this); };
        item.innerHTML = `<span class="status-dot-online"></span> ${f}`;
        container.appendChild(item);
    });
}

// РЕДАКТИРОВАНИЕ ПРОФИЛЯ (ЮЗЕРНЕЙМ НЕИЗМЕНЯЕМЫЙ)
function openSettings() {
    const currentUser = sessionStorage.getItem('current_user');
    const profile = JSON.parse(localStorage.getItem('gistord_profile_' + currentUser));

    document.getElementById('profile-fixed-username').value = currentUser;
    document.getElementById('profile-display-name').value = profile.displayName || currentUser;
    document.getElementById('profile-avatar-url').value = profile.avatarUrl || '';
    document.getElementById('profile-bio').value = profile.bio || '';

    document.getElementById('settings-modal').style.display = 'flex';
}

function closeSettings() {
    document.getElementById('settings-modal').style.display = 'none';
}

function saveProfileChanges() {
    const currentUser = sessionStorage.getItem('current_user');
    const newDisplayName = document.getElementById('profile-display-name').value.trim() || currentUser;
    const newAvatarUrl = document.getElementById('profile-avatar-url').value.trim();
    const newBio = document.getElementById('profile-bio').value.trim();

    const updatedProfile = {
        displayName: newDisplayName,
        avatarUrl: newAvatarUrl,
        bio: newBio
    };

    localStorage.setItem('gistord_profile_' + currentUser, JSON.stringify(updatedProfile));
    loadUserProfileUI(currentUser);
    showToast("Профиль успешно обновлен!");
    closeSettings();
}

// УПРАВЛЕНИЕ ЗВОНКАМИ (ПК И ТЕЛЕФОН)
function startAudioCall() {
    playSound('call');
    isMuted = false;
    isCamOn = false;
    updateCallControlsUI();
    document.getElementById('call-overlay').style.display = 'flex';
    document.getElementById('call-status-msg').innerText = `Голосовой вызов с ${activeChatId}...`;
}

function startVideoCall() {
    playSound('call');
    isMuted = false;
    isCamOn = true;
    updateCallControlsUI();
    document.getElementById('call-overlay').style.display = 'flex';
    document.getElementById('call-status-msg').innerText = `Видеовызов с ${activeChatId}...`;
}

function toggleMute() {
    isMuted = !isMuted;
    updateCallControlsUI();
    showToast(isMuted ? "Микрофон выключен (Мут)" : "Микрофон включен");
}

function toggleCam() {
    isCamOn = !isCamOn;
    updateCallControlsUI();
    showToast(isCamOn ? "Камера включена" : "Камера выключена");
}

function updateCallControlsUI() {
    const muteBtn = document.getElementById('mute-btn');
    const camBtn = document.getElementById('cam-btn');
    
    if (isMuted) {
        muteBtn.classList.add('muted');
        muteBtn.innerText = "🔇 Размутить";
    } else {
        muteBtn.classList.remove('muted');
        muteBtn.innerText = "🎤 Мут";
    }

    if (isCamOn) {
        camBtn.style.background = 'var(--accent-color)';
        camBtn.style.color = '#000';
        camBtn.innerText = "📷 Камера ВКЛ";
    } else {
        camBtn.style.background = '';
        camBtn.style.color = '';
        camBtn.innerText = "📷 Камера";
    }
}

function endCall() {
    document.getElementById('call-overlay').style.display = 'none';
}

function changeTheme(color) {
    document.documentElement.style.setProperty('--accent-color', color);
    document.documentElement.style.setProperty('--accent-glow', color + '66');
}

function openAdminPanel() {
    document.getElementById('admin-modal').style.display = 'flex';
    renderBannedList();
}

function closeAdminPanel() {
    document.getElementById('admin-modal').style.display = 'none';
}

function adminBanUser() {
    const target = document.getElementById('admin-target-user').value.trim();
    if (!target) return;
    const bannedList = JSON.parse(localStorage.getItem('gistord_banned_list') || '[]');
    if (!bannedList.includes(target)) {
        bannedList.push(target);
        localStorage.setItem('gistord_banned_list', JSON.stringify(bannedList));
        showToast(`Пользователь ${target} забанен!`);
        renderBannedList();
    }
}

function adminMuteUser() {
    const target = document.getElementById('admin-target-user').value.trim();
    if (!target) return;
    const mutedList = JSON.parse(localStorage.getItem('gistord_muted_list') || '[]');
    if (!mutedList.includes(target)) {
        mutedList.push(target);
        localStorage.setItem('gistord_muted_list', JSON.stringify(mutedList));
        showToast(`Пользователь ${target} замучен!`);
    }
}

function renderBannedList() {
    const container = document.getElementById('banned-users-list');
    const bannedList = JSON.parse(localStorage.getItem('gistord_banned_list') || '[]');
    if (bannedList.length === 0) {
        container.innerHTML = 'Список банов пуст.';
    } else {
        container.innerHTML = bannedList.map(u => `<div>• ${u} <span style="color:#ff3333; cursor:pointer;" onclick="unbanUser('${u}')">[Разбан]</span></div>`).join('');
    }
}

function unbanUser(username) {
    let bannedList = JSON.parse(localStorage.getItem('gistord_banned_list') || '[]');
    bannedList = bannedList.filter(u => u !== username);
    localStorage.setItem('gistord_banned_list', JSON.stringify(bannedList));
    renderBannedList();
    showToast(`Пользователь ${username} разбанен.`);
}

function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}