// --- Данные в localStorage ---
  // Храним пользователей, структура: { ник: { password, friends, friendRequests, playlist, messages } }
  // messages: { друг: [ { from, text, read } ] }

  function loadUsers() {
    return JSON.parse(localStorage.getItem('users') || '{}');
  }
  function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
  }

  // Текущий пользователь (никнейм)
  let currentUser = null;
  // Текущие пользователи
  let users = loadUsers();

  // --- Регистрация ---
  function register() {
    const nick = document.getElementById('regNickname').value.trim();
    const pass = document.getElementById('regPassword').value;

    if (!nick || !pass) {
      showAuthMessage('Введите ник и пароль');
      return;
    }
    if (users[nick]) {
      showAuthMessage('Такой никнейм уже занят');
      return;
    }

    users[nick] = {
      password: pass,
      friends: [],
      friendRequests: [],
      playlist: [],
      messages: {}
    };
    saveUsers(users);
    showAuthMessage('Регистрация успешна. Войдите.', 'green');
    clearRegInputs();
  }

  function clearRegInputs() {
    document.getElementById('regNickname').value = '';
    document.getElementById('regPassword').value = '';
  }

  // --- Вход ---
  function login() {
    const nick = document.getElementById('loginNickname').value.trim();
    const pass = document.getElementById('loginPassword').value;

    if (!nick || !pass) {
      showAuthMessage('Введите ник и пароль');
      return;
    }
    if (!users[nick] || users[nick].password !== pass) {
      showAuthMessage('Неверный никнейм или пароль');
      return;
    }

    currentUser = nick;
    document.getElementById('userInfo').textContent = 'Привет, ' + currentUser;
    document.getElementById('authSection').classList.add('hidden');
    document.getElementById('appSection').classList.remove('hidden');

    initApp();
  }

  function showAuthMessage(msg, color = 'red') {
    const el = document.getElementById('authMessage');
    el.style.color = color;
    el.textContent = msg;
  }

  // --- Выход ---
  function logout() {
    currentUser = null;
    document.getElementById('userInfo').textContent = 'Не вошёл';
    document.getElementById('authSection').classList.remove('hidden');
    document.getElementById('appSection').classList.add('hidden');
    clearLoginInputs();
    resetTabs();
  }

  function clearLoginInputs() {
    document.getElementById('loginNickname').value = '';
    document.getElementById('loginPassword').value = '';
    showAuthMessage('');
  }

  // --- Табы ---
  function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tabName);
    });
    document.querySelectorAll('.content').forEach(c => {
      c.classList.toggle('hidden', c.id !== tabName + 'Tab');
    });
    if (tabName === 'chat') {
      // Убираем уведомления
      clearChatNotification();
    }
    if (tabName === 'friends') {
      renderFriendRequests();
      renderFriendList();
      document.getElementById('friendMessage').textContent = '';
    }
  }

  function resetTabs() {
    switchTab('browser');
    clearChatNotification();
  }

  // --- Браузер ---
  function navigate() {
    const urlInput = document.getElementById('urlInput');
    let url = urlInput.value.trim();
    if (!url) return;

    // Добавим http если не указан
    if (!/^https?:\/\//.test(url)) {
      url = 'https://' + url;
    }
    document.getElementById('browserFrame').src = url;
  }

  // --- Плеер и плейлист ---
  function initPlayer() {
    if (!currentUser) return;
    const playlistEl = document.getElementById('playlist');
    playlistEl.innerHTML = '';
    users = loadUsers();

    users[currentUser].playlist.forEach((item, idx) => {
      const li = document.createElement('li');
      li.textContent = item;
      li.style.cursor = 'pointer';
      li.onclick = () => playMusic(item);
      playlistEl.appendChild(li);
    });
  }

  function addVideo() {
    const url = document.getElementById('videoUrl').value.trim();
    if (!url) return alert('Введите ссылку на музыку');
    if (!currentUser) return;

    users = loadUsers();
    if (!users[currentUser].playlist.includes(url)) {
      users[currentUser].playlist.push(url);
      saveUsers(users);
      initPlayer();
      document.getElementById('videoUrl').value = '';
    }
  }

  function playMusic(url) {
    const player = document.getElementById('player');
    player.src = url;
    player.play();
  }

  // --- Друзья ---
  function renderFriendList() {
    if (!currentUser) return;
    users = loadUsers();
    const friendListEl = document.getElementById('friendList');
    friendListEl.innerHTML = '';
    users[currentUser].friends.forEach(friend => {
      const li = document.createElement('li');
      li.textContent = friend;
      friendListEl.appendChild(li);
    });
  }

  function renderFriendRequests() {
    if (!currentUser) return;
    users = loadUsers();
    const friendReqEl = document.getElementById('friendRequests');
    friendReqEl.innerHTML = '';
    users[currentUser].friendRequests.forEach(req => {
      const li = document.createElement('li');
      li.textContent = req + ' ';
      const acceptBtn = document.createElement('button');
      acceptBtn.textContent = 'Принять';
      acceptBtn.onclick = () => acceptFriend(req);
      const rejectBtn = document.createElement('button');
      rejectBtn.textContent = 'Отклонить';
      rejectBtn.onclick = () => rejectFriend(req);
      li.appendChild(acceptBtn);
      li.appendChild(rejectBtn);
      friendReqEl.appendChild(li);
    });
  }

  function sendFriendRequest() {
    const nick = document.getElementById('addFriendInput').value.trim();
    const msgEl = document.getElementById('friendMessage');
    msgEl.textContent = '';
    if (!nick) return;
    if (nick === currentUser) {
      msgEl.textContent = 'Нельзя добавить себя';
      return;
    }
    if (!users[nick]) {
      msgEl.textContent = 'Пользователь не найден';
      return;
    }
    users = loadUsers();

    if (users[currentUser].friends.includes(nick)) {
      msgEl.textContent = 'Этот пользователь уже у вас в друзьях';
      return;
    }
    if (users[nick].friendRequests.includes(currentUser)) {
      msgEl.textContent = 'Вы уже отправили запрос этому пользователю';
      return;
    }
    users[nick].friendRequests.push(currentUser);
    saveUsers(users);
    msgEl.style.color = 'green';
    msgEl.textContent = 'Запрос отправлен';
    document.getElementById('addFriendInput').value = '';
  }

  function acceptFriend(nick) {
    users = loadUsers();
    const index = users[currentUser].friendRequests.indexOf(nick);
    if (index !== -1) {
      users[currentUser].friendRequests.splice(index, 1);
      if (!users[currentUser].friends.includes(nick)) {
        users[currentUser].friends.push(nick);
      }
      if (!users[nick].friends.includes(currentUser)) {
        users[nick].friends.push(currentUser);
      }
      saveUsers(users);
      renderFriendRequests();
      renderFriendList();
      renderChatFriends();
    }
  }

  function rejectFriend(nick) {
    users = loadUsers();
    const index = users[currentUser].friendRequests.indexOf(nick);
    if (index !== -1) {
      users[currentUser].friendRequests.splice(index, 1);
      saveUsers(users);
      renderFriendRequests();
    }
  }

  // --- Чат ---
  function renderChatFriends() {
    if (!currentUser) return;
    users = loadUsers();
    const select = document.getElementById('chatFriendSelect');
    select.innerHTML = '';
    users[currentUser].friends.forEach(friend => {
      const option = document.createElement('option');
      option.value = friend;
      option.textContent = friend;
      select.appendChild(option);
    });
    if (select.options.length > 0) {
      select.selectedIndex = 0;
      loadChat(select.value);
    } else {
      document.getElementById('chatMessages').textContent = 'Нет друзей для чата';
    }
  }

  document.getElementById('chatFriendSelect').addEventListener('change', (e) => {
    loadChat(e.target.value);
  });

  document.getElementById('chatSend').addEventListener('click', sendMessage);

  function loadChat(friend) {
    users = loadUsers();
    const messages = (users[currentUser].messages && users[currentUser].messages[friend]) || [];
    // Отметить все сообщения от друга как прочитанные
    messages.forEach(m => {
      if (m.from === friend) m.read = true;
    });
    saveUsers(users);
    renderMessages(messages);
    clearChatNotification();
  }

  function renderMessages(messages) {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = '';
    messages.forEach(m => {
      const div = document.createElement('div');
      div.textContent = (m.from === currentUser ? 'Ты: ' : m.from + ': ') + m.text;
      div.style.textAlign = (m.from === currentUser) ? 'right' : 'left';
      chatMessages.appendChild(div);
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function sendMessage() {
    const friend = document.getElementById('chatFriendSelect').value;
    const text = document.getElementById('chatInput').value.trim();
    if (!friend || !text) return;
    users = loadUsers();

    // Добавить сообщение у себя
    if (!users[currentUser].messages[friend]) users[currentUser].messages[friend] = [];
    users[currentUser].messages[friend].push({from: currentUser, text, read: true});

    // Добавить сообщение у друга
    if (!users[friend].messages[currentUser]) users[friend].messages[currentUser] = [];
    users[friend].messages[currentUser].push({from: currentUser, text, read: false});

    saveUsers(users);
    document.getElementById('chatInput').value = '';
    loadChat(friend);

    // Уведомления у друга (если сейчас не открыт чат с тобой)
    if (friend !== currentUser) {
      // При следующем входе уведомления появятся, но для упрощения в текущем коде они не видны сразу
    }
  }

  // Проверка уведомлений чата (новых сообщений)
  function checkChatNotifications() {
    if (!currentUser) return;
    users = loadUsers();
    const tab = document.querySelector('.tab[data-tab="chat"]');
    let hasNew = false;

    users[currentUser].friends.forEach(friend => {
      const msgs = users[currentUser].messages[friend];
      if (!msgs) return;
      if (msgs.some(m => m.from === friend && !m.read)) {
        hasNew = true;
      }
    });

    if (hasNew) {
      tab.classList.add('notify');
    } else {
      tab.classList.remove('notify');
    }
  }

  function clearChatNotification() {
    const tab = document.querySelector('.tab[data-tab="chat"]');
    tab.classList.remove('notify');
    // Пометить все сообщения в текущем чате как прочитанные
    if (!currentUser) return;
    const friend = document.getElementById('chatFriendSelect').value;
    if (!friend) return;

    users = loadUsers();
    const msgs = users[currentUser].messages[friend];
    if (msgs) {
      msgs.forEach(m => {
        if (m.from === friend) m.read = true;
      });
      saveUsers(users);
    }
  }

  // --- Инициализация после входа ---
  function initApp() {
    initPlayer();
    renderFriendList();
    renderFriendRequests();
    renderChatFriends();
    switchTab('browser');
    checkChatNotifications();
  }

  // Проверяем уведомления каждые 3 секунды
  setInterval(() => {
    if (currentUser) {
      checkChatNotifications();
    }
  }, 3000);