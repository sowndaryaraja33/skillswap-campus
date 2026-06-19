/**
 * SkillSwap Campus — Admin Panel Logic
 * Merges the requested in-memory mock backend logic with our app's storage where possible,
 * or keeps it strictly in memory as requested if it's meant to be a pure server simulation.
 */

const AdminApp = (() => {
  // In-memory simulated DB
  const database = {
    users: [],
    skills: [],
    sessions: [],
    points: [],
    messages: [],
    achievements: []
  };

  let currentUser = null;
  let requestCount = 0;
  let startTime = Date.now();

  // Utilities
  const generateId = () => Math.random().toString(36).substr(2, 9);
  const hashPassword = (pwd) => btoa(pwd);

  const showMessage = (type, text) => {
    const box = document.getElementById('authMessage');
    if (!box) return;
    box.textContent = text;
    box.className = `alert-box ${type}`;
    box.classList.remove('hidden');
    setTimeout(() => { box.classList.add('hidden'); }, 5000);
    
    // Also use our global Toast if available
    if (window.Toast) {
      Toast.show(text, type);
    }
  };

  const updateStats = () => {
    // Top summary
    const uptimeSecs = Math.floor((Date.now() - startTime) / 1000);
    const hrs = Math.floor(uptimeSecs / 3600);
    const mins = Math.floor((uptimeSecs % 3600) / 60);
    const secs = uptimeSecs % 60;
    
    document.getElementById('uptime').textContent = `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    document.getElementById('activeUsers').textContent = Math.ceil(database.users.length / 2);
    document.getElementById('totalRequests').textContent = requestCount;

    // Mini stats left panel
    document.getElementById('totalUsersCount').textContent = database.users.length;
    document.getElementById('totalSkillsCount').textContent = database.skills.length;
    document.getElementById('totalSessionsCount').textContent = database.sessions.length;

    // Users tab
    document.getElementById('usersStatTotal').textContent = database.users.length;
    const verifiedUsers = database.users.filter(u => u.verified).length;
    document.getElementById('usersStatVerified').textContent = verifiedUsers;
    if (database.users.length > 0) {
      const avg = (database.users.reduce((sum, u) => sum + (u.rating || 5), 0) / database.users.length).toFixed(1);
      document.getElementById('usersStatRating').textContent = avg;
    }

    // Points tab
    if (database.points.length > 0) {
      const total = database.points.reduce((sum, p) => sum + p.amount, 0);
      document.getElementById('totalPointsDistributed').textContent = total;
      const avgPts = Math.round(total / database.users.length) || 0;
      document.getElementById('avgPointsStat').textContent = avgPts;
    }
    
    if (database.users.length > 0) {
      const sorted = [...database.users].sort((a, b) => b.points - a.points);
      document.getElementById('topEarnerPts').textContent = sorted[0].points;
    } else {
      document.getElementById('topEarnerPts').textContent = '—';
    }
  };

  // Auth Tab
  const registerUser = () => {
    requestCount++;
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;

    if (!email || !password) return showMessage('error', 'Email and password required');
    if (database.users.find(u => u.email === email)) return showMessage('error', 'User already exists');

    const user = {
      id: generateId(),
      email,
      password: hashPassword(password),
      name: email.split('@')[0],
      college: 'University',
      department: 'Computer Science',
      year: '2nd Year',
      role: 'STUDENT',
      points: 0,
      rating: 5,
      createdAt: new Date().toISOString(),
      verified: false
    };

    database.users.push(user);
    currentUser = user;

    document.getElementById('authResponse').textContent = JSON.stringify({ success: true, user: {...user, password: '[REDACTED]'} }, null, 2);
    showMessage('success', 'User registered successfully');
    updateStats();
  };

  const loginUser = () => {
    requestCount++;
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;
    const user = database.users.find(u => u.email === email && u.password === hashPassword(password));

    if (!user) {
      showMessage('error', 'Invalid credentials');
      document.getElementById('authResponse').textContent = JSON.stringify({ error: 'Invalid credentials' }, null, 2);
      return;
    }

    currentUser = user;
    const token = btoa('mock-jwt-token-' + user.id);
    document.getElementById('authResponse').textContent = JSON.stringify({ success: true, user: {...user, password: '[REDACTED]'}, token }, null, 2);
    showMessage('success', 'Login successful');
    updateStats();
  };

  // Users Tab
  const getAllUsers = () => {
    requestCount++;
    const list = document.getElementById('usersList');
    if (database.users.length === 0) {
      list.innerHTML = '<p style="text-align: center; color: #999;">No users yet</p>';
      return;
    }
    list.innerHTML = database.users.map(u => `
      <div class="data-item">
        <div class="data-item-info">
          <div class="data-item-title">👤 ${u.name} (${u.email})</div>
          <div class="data-item-subtitle">Role: ${u.role} | Points: ${u.points} | Rating: ${u.rating}⭐</div>
        </div>
        <div>
          <button class="btn btn-danger btn-small" onclick="AdminApp.deleteUser('${u.id}')">Delete</button>
        </div>
      </div>
    `).join('');
    updateStats();
  };

  const deleteUser = (id) => {
    database.users = database.users.filter(u => u.id !== id);
    getAllUsers();
    showMessage('success', 'User deleted');
  };

  // Skills Tab
  const createSkill = () => {
    requestCount++;
    if (!currentUser) return showMessage('error', 'Please login via Auth tab first');

    const name = document.getElementById('skillName').value;
    const category = document.getElementById('skillCategory').value;
    const description = document.getElementById('skillDescription').value;

    if (!name || !category) return showMessage('error', 'Name and category required');

    database.skills.push({
      id: generateId(),
      name, category, description,
      teacherId: currentUser.id,
      teacher: currentUser.name,
      level: 'INTERMEDIATE',
      verified: false,
      rating: 4.5,
      sessions: 0,
      createdAt: new Date().toISOString()
    });

    document.getElementById('skillName').value = '';
    document.getElementById('skillDescription').value = '';
    showMessage('success', 'Skill created');
    getAllSkills();
    updateStats();
  };

  const getAllSkills = () => {
    requestCount++;
    const list = document.getElementById('skillsList');
    if (database.skills.length === 0) {
      list.innerHTML = '<p style="text-align: center; color: #999;">No skills yet</p>';
      return;
    }
    list.innerHTML = database.skills.map(s => `
      <div class="data-item">
        <div class="data-item-info">
          <div class="data-item-title">📚 ${s.name} ${s.verified ? '✅' : ''}</div>
          <div class="data-item-subtitle">Category: ${s.category} | Teacher: ${s.teacher} | Rating: ${s.rating}⭐</div>
        </div>
        <div>
          ${!s.verified ? `<button class="btn btn-success btn-small" onclick="AdminApp.verifySkill('${s.id}')">Verify</button>` : ''}
          <button class="btn btn-danger btn-small" onclick="AdminApp.deleteSkill('${s.id}')">Delete</button>
        </div>
      </div>
    `).join('');
  };

  const verifySkill = (id) => {
    const s = database.skills.find(x => x.id === id);
    if (s) { s.verified = true; showMessage('success', 'Skill verified'); getAllSkills(); updateStats(); }
  };
  const deleteSkill = (id) => {
    database.skills = database.skills.filter(x => x.id !== id);
    getAllSkills(); showMessage('success', 'Skill deleted');
  };

  // Sessions Tab
  const createSession = () => {
    requestCount++;
    if (!currentUser) return showMessage('error', 'Please login first');

    const date = document.getElementById('sessionDate').value;
    const duration = parseInt(document.getElementById('sessionDuration').value);
    if (!date || !duration) return showMessage('error', 'Date and duration required');

    database.sessions.push({
      id: generateId(),
      teacherId: currentUser.id,
      teacher: currentUser.name,
      skillId: database.skills.length ? database.skills[0].id : generateId(),
      skillName: database.skills.length ? database.skills[0].name : 'Unknown Skill',
      date, duration,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    });

    showMessage('success', 'Session created');
    getAllSessions();
    updateStats();
  };

  const getAllSessions = () => {
    requestCount++;
    const list = document.getElementById('sessionsList');
    if (database.sessions.length === 0) {
      list.innerHTML = '<p style="text-align: center; color: #999;">No sessions yet</p>';
      return;
    }
    list.innerHTML = database.sessions.map(s => `
      <div class="data-item">
        <div class="data-item-info">
          <div class="data-item-title">📅 ${s.skillName}</div>
          <div class="data-item-subtitle">Teacher: ${s.teacher} | Duration: ${s.duration}min | Status: ${s.status}</div>
        </div>
        <div>
          ${s.status === 'PENDING' ? `<button class="btn btn-success btn-small" onclick="AdminApp.approveSession('${s.id}')">Approve</button>` : ''}
          <button class="btn btn-danger btn-small" onclick="AdminApp.deleteSession('${s.id}')">Delete</button>
        </div>
      </div>
    `).join('');
  };

  const approveSession = (id) => {
    const s = database.sessions.find(x => x.id === id);
    if (s) {
      s.status = 'APPROVED';
      const teacher = database.users.find(u => u.id === s.teacherId);
      if (teacher) {
        teacher.points += 50;
        database.points.push({ userId: teacher.id, amount: 50, reason: 'SESSION_COMPLETED' });
      }
      showMessage('success', 'Session approved. Points awarded.');
      getAllSessions(); updateStats();
    }
  };
  const deleteSession = (id) => {
    database.sessions = database.sessions.filter(x => x.id !== id);
    getAllSessions(); showMessage('success', 'Session deleted');
  };

  // Points Tab
  const getLeaderboard = () => {
    requestCount++;
    const lb = [...database.users].sort((a, b) => b.points - a.points).slice(0, 10);
    const list = document.getElementById('leaderboardList');
    if (lb.length === 0) {
      list.innerHTML = '<p style="text-align: center; color: #999;">No users yet</p>';
      return;
    }
    list.innerHTML = lb.map((u, i) => `
      <div class="data-item">
        <div class="data-item-info">
          <div class="data-item-title">🏆 #${i + 1} ${u.name}</div>
          <div class="data-item-subtitle">Points: ${u.points} | Rating: ${u.rating}⭐ | ${u.email}</div>
        </div>
      </div>
    `).join('');
    updateStats();
  };

  // DB Actions
  const seedDatabase = () => {
    database.users = [
      { id: generateId(), email: 'alice@example.com', password: hashPassword('password123'), name: 'Alice Johnson', role: 'STUDENT', points: 1250, rating: 4.8, verified: true },
      { id: generateId(), email: 'bob@example.com', password: hashPassword('password123'), name: 'Bob Smith', role: 'STUDENT', points: 950, rating: 4.5, verified: true },
      { id: generateId(), email: 'carol@example.com', password: hashPassword('password123'), name: 'Carol Davis', role: 'STUDENT', points: 2100, rating: 4.9, verified: true }
    ];
    database.skills = [
      { id: generateId(), name: 'Web Development', category: 'Programming', teacherId: database.users[0].id, teacher: 'Alice Johnson', verified: true, rating: 4.8 },
      { id: generateId(), name: 'UI/UX Design', category: 'Design', teacherId: database.users[2].id, teacher: 'Carol Davis', verified: true, rating: 4.9 }
    ];
    database.users.forEach(u => database.points.push({ userId: u.id, amount: u.points, reason: 'SEED' }));
    currentUser = database.users[0];
    
    showMessage('success', 'Database seeded successfully.');
    updateStats();
    getAllUsers();
  };

  const clearDatabase = () => {
    if (confirm('Clear all data? Cannot be undone.')) {
      database.users = []; database.skills = []; database.sessions = []; database.points = [];
      currentUser = null;
      document.getElementById('usersList').innerHTML = '';
      document.getElementById('skillsList').innerHTML = '';
      document.getElementById('sessionsList').innerHTML = '';
      document.getElementById('leaderboardList').innerHTML = '';
      showMessage('success', 'Database cleared.');
      updateStats();
    }
  };

  const generateJWTDisplay = () => {
    const token = btoa(JSON.stringify({ header: 'alg:HS256' })) + '.' + btoa(JSON.stringify({ sub: generateId(), exp: Date.now() + 86400 })) + '.signature';
    const box = document.getElementById('jwtDisplay');
    box.textContent = token;
    box.classList.remove('hidden');
    showMessage('success', 'JWT Generated');
  };

  // UI Setup
  const setupTabs = () => {
    const btns = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
      });
    });
  };

  // Init
  window.addEventListener('DOMContentLoaded', () => {
    setupTabs();
    seedDatabase();
    setInterval(updateStats, 1000);
  });

  // Public API
  return {
    registerUser, loginUser,
    getAllUsers, deleteUser,
    createSkill, getAllSkills, verifySkill, deleteSkill,
    createSession, getAllSessions, approveSession, deleteSession,
    getLeaderboard,
    seedDatabase, clearDatabase, generateJWTDisplay
  };
})();
