/**
 * Online Examination Platform Client App Router & UI Controller
 * Features full API integration + GitHub Pages Static Standalone Fallback Engine
 */

window.App = {
  currentUser: null,
  activeExam: null,
  activeQuestions: [],
  currentQuestionIndex: 0,
  timerInterval: null,
  remainingSeconds: 0,
  isMockMode: false,

  async init() {
    this.setupTheme();
    this.initMockDB();
    await this.checkAuthStatus();
  },

  setupTheme() {
    const isDark = localStorage.getItem('theme') === 'dark' || 
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },

  toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  },

  // Client-Side Storage Engine for GitHub Pages Static Deployment
  initMockDB() {
    if (!localStorage.getItem('mock_exams')) {
      const demoExams = [
        {
          id: 1,
          title: 'Full-Stack Web Development & JS Certification',
          description: 'Assessment testing JavaScript ES6+, Web APIs, Async I/O, and DOM event handling under anti-cheating proctoring.',
          code: 'WEB-101',
          duration_minutes: 15,
          total_question: 10,
          marks_per_right: 2.0,
          marks_per_wrong: 0.5,
          enable_proctoring: 1,
          max_violations: 3,
          enable_fullscreen: 1,
          status: 'Started'
        },
        {
          id: 2,
          title: 'Cybersecurity & Anti-Cheating Fundamentals',
          description: 'Test your knowledge on web security vulnerabilities (SQLi, XSS, CSRF, IDOR) and defensive coding.',
          code: 'SEC-202',
          duration_minutes: 10,
          total_question: 5,
          marks_per_right: 2.0,
          marks_per_wrong: 0.0,
          enable_proctoring: 1,
          max_violations: 2,
          enable_fullscreen: 1,
          status: 'Started'
        }
      ];
      localStorage.setItem('mock_exams', JSON.stringify(demoExams));
    }

    if (!localStorage.getItem('mock_questions')) {
      const demoQuestions = [
        {
          id: 101, exam_id: 1, question_title: 'Which HTML5 JavaScript event API is used to detect when a user switches tabs or minimizes the browser window?',
          options: [{ id: 1, option_number: 1, option_title: 'window.onblur', is_correct: 0 }, { id: 2, option_number: 2, option_title: 'document.visibilitychange', is_correct: 1 }, { id: 3, option_number: 3, option_title: 'document.onpagehide', is_correct: 0 }, { id: 4, option_number: 4, option_title: 'window.ontabswitch', is_correct: 0 }]
        },
        {
          id: 102, exam_id: 1, question_title: 'How do you prevent SQL Injection vulnerabilities in modern database applications?',
          options: [{ id: 5, option_number: 1, option_title: 'Use htmlspecialchars() on raw SQL', is_correct: 0 }, { id: 6, option_number: 2, option_title: 'Use PDO Prepared Statements with parameter binding', is_correct: 1 }, { id: 7, option_number: 3, option_title: 'Use base64 encoding on query strings', is_correct: 0 }, { id: 8, option_number: 4, option_title: 'Disable database error logging', is_correct: 0 }]
        },
        {
          id: 103, exam_id: 1, question_title: 'What does the `window.onblur` event detect during an online proctored examination?',
          options: [{ id: 9, option_number: 1, option_title: 'When the webcam loses light', is_correct: 0 }, { id: 10, option_number: 2, option_title: 'When the browser window loses focus or user clicks outside', is_correct: 1 }, { id: 11, option_number: 3, option_title: 'When the internet disconnects', is_correct: 0 }, { id: 12, option_number: 4, option_title: 'When the timer expires', is_correct: 0 }]
        },
        {
          id: 201, exam_id: 2, question_title: 'Which password hashing algorithm is recommended for securely storing user credentials?',
          options: [{ id: 13, option_number: 1, option_title: 'MD5', is_correct: 0 }, { id: 14, option_number: 2, option_title: 'SHA-1', is_correct: 0 }, { id: 15, option_number: 3, option_title: 'Bcrypt / Argon2', is_correct: 1 }, { id: 16, option_number: 4, option_title: 'Base64', is_correct: 0 }]
        },
        {
          id: 202, exam_id: 2, question_title: 'What feature automatically submits an online exam when anti-cheating tab-switching limits are breached?',
          options: [{ id: 17, option_number: 1, option_title: 'Proctor Auto-Termination Engine', is_correct: 1 }, { id: 18, option_number: 2, option_title: 'Garbage Collector', is_correct: 0 }, { id: 19, option_number: 3, option_title: 'Session Timeout', is_correct: 0 }, { id: 20, option_number: 4, option_title: 'CORS Guard', is_correct: 0 }]
        }
      ];
      localStorage.setItem('mock_questions', JSON.stringify(demoQuestions));
    }

    if (!localStorage.getItem('mock_enrollments')) {
      localStorage.setItem('mock_enrollments', JSON.stringify([]));
    }

    if (!localStorage.getItem('mock_answers')) {
      localStorage.setItem('mock_answers', JSON.stringify([]));
    }

    if (!localStorage.getItem('mock_logs')) {
      localStorage.setItem('mock_logs', JSON.stringify([]));
    }
  },

  async checkAuthStatus() {
    try {
      const res = await fetch('api/auth/me');
      if (!res.ok) throw new Error('API unavailable');
      const data = await res.json();
      if (data.success && data.user) {
        this.currentUser = data.user;
        this.renderMainLayout();
        return;
      }
    } catch (err) {
      // API unavailable -> Switch to Standalone Client Mock Mode for GitHub Pages
      this.isMockMode = true;
      const session = localStorage.getItem('mock_session');
      if (session) {
        this.currentUser = JSON.parse(session);
        this.renderMainLayout();
        return;
      }
    }
    this.renderAuthScreen();
  },

  renderAuthScreen() {
    document.getElementById('app-root').innerHTML = `
      <div class="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div class="max-w-md w-full bg-slate-800 rounded-3xl p-8 border border-slate-700 shadow-2xl">
          <div class="text-center mb-8">
            <div class="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white text-3xl shadow-lg shadow-indigo-500/30">
              <i class="fas fa-graduation-cap"></i>
            </div>
            <h1 class="text-2xl font-black text-white">Online Exam Portal</h1>
            <p class="text-slate-400 text-sm mt-1">Tab-Switch Proctoring & Assessment System</p>
            ${this.isMockMode ? `<span class="inline-block mt-2 text-[10px] uppercase tracking-widest font-black px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">GitHub Pages Standalone Mode</span>` : ''}
          </div>

          <!-- Tabs -->
          <div class="flex bg-slate-900 p-1 rounded-xl mb-6">
            <button id="tab-login" onclick="App.showAuthTab('login')" class="flex-1 py-2 text-sm font-bold rounded-lg text-white bg-indigo-600 transition">Login</button>
            <button id="tab-register" onclick="App.showAuthTab('register')" class="flex-1 py-2 text-sm font-bold rounded-lg text-slate-400 hover:text-white transition">Register</button>
          </div>

          <!-- Alert -->
          <div id="auth-alert" class="hidden mb-4 p-3 rounded-xl text-sm font-medium"></div>

          <!-- Login Form -->
          <form id="form-login" onsubmit="App.handleLogin(event)">
            <div class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Email Address</label>
                <input type="email" id="login-email" required class="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition" value="student@exam.com">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Password</label>
                <input type="password" id="login-password" required class="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition" value="student123">
              </div>
              <button type="submit" class="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition">
                Sign In
              </button>
            </div>

            <div class="mt-6 p-4 bg-slate-900/60 rounded-2xl border border-slate-700/60 text-xs text-slate-400">
              <p class="font-bold text-slate-200 mb-1">🔑 Demo Accounts:</p>
              <p>• Admin: <span class="text-indigo-400">admin@exam.com</span> / <span class="text-indigo-400">admin123</span></p>
              <p>• Student: <span class="text-indigo-400">student@exam.com</span> / <span class="text-indigo-400">student123</span></p>
            </div>
          </form>

          <!-- Register Form -->
          <form id="form-register" onsubmit="App.handleRegister(event)" class="hidden">
            <div class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Full Name</label>
                <input type="text" id="reg-name" required class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500" placeholder="Pawan Yadav">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Email Address</label>
                <input type="email" id="reg-email" required class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500" placeholder="user@example.com">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Password</label>
                <input type="password" id="reg-password" required class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500" placeholder="••••••••">
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Gender</label>
                  <select id="reg-gender" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Role</label>
                  <select id="reg-role" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500">
                    <option value="student">Student</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>
              <button type="submit" class="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition">
                Create Account
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  showAuthTab(tab) {
    if (tab === 'login') {
      document.getElementById('form-login').classList.remove('hidden');
      document.getElementById('form-register').classList.add('hidden');
      document.getElementById('tab-login').className = 'flex-1 py-2 text-sm font-bold rounded-lg text-white bg-indigo-600 transition';
      document.getElementById('tab-register').className = 'flex-1 py-2 text-sm font-bold rounded-lg text-slate-400 hover:text-white transition';
    } else {
      document.getElementById('form-login').classList.add('hidden');
      document.getElementById('form-register').classList.remove('hidden');
      document.getElementById('tab-register').className = 'flex-1 py-2 text-sm font-bold rounded-lg text-white bg-indigo-600 transition';
      document.getElementById('tab-login').className = 'flex-1 py-2 text-sm font-bold rounded-lg text-slate-400 hover:text-white transition';
    }
  },

  async handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    if (this.isMockMode) {
      const userRole = email.includes('admin') ? 'admin' : 'student';
      const mockUser = {
        id: email === 'admin@exam.com' ? 1 : 2,
        name: email === 'admin@exam.com' ? 'Master Administrator' : 'Demo Student',
        email: email,
        role: userRole
      };
      localStorage.setItem('mock_session', JSON.stringify(mockUser));
      this.currentUser = mockUser;
      this.renderMainLayout();
      return;
    }

    try {
      const res = await fetch('api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success) {
        this.currentUser = data.user;
        this.renderMainLayout();
      } else {
        this.showAuthError(data.error);
      }
    } catch (err) {
      this.showAuthError(err.message);
    }
  },

  async handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const gender = document.getElementById('reg-gender').value;
    const role = document.getElementById('reg-role').value;

    if (this.isMockMode) {
      this.showAuthSuccess('Account created! Please login now.');
      this.showAuthTab('login');
      return;
    }

    try {
      const res = await fetch('api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, gender, role })
      });
      const data = await res.json();
      if (data.success) {
        this.showAuthSuccess('Account created! Please login now.');
        this.showAuthTab('login');
      } else {
        this.showAuthError(data.error);
      }
    } catch (err) {
      this.showAuthError(err.message);
    }
  },

  showAuthError(msg) {
    const alertBox = document.getElementById('auth-alert');
    alertBox.className = 'mb-4 p-3 rounded-xl text-sm font-medium bg-red-900/50 border border-red-700 text-red-200';
    alertBox.innerText = msg;
    alertBox.classList.remove('hidden');
  },

  showAuthSuccess(msg) {
    const alertBox = document.getElementById('auth-alert');
    alertBox.className = 'mb-4 p-3 rounded-xl text-sm font-medium bg-emerald-900/50 border border-emerald-700 text-emerald-200';
    alertBox.innerText = msg;
    alertBox.classList.remove('hidden');
  },

  renderMainLayout() {
    const isAdmin = this.currentUser.role === 'admin';
    document.getElementById('app-root').innerHTML = `
      <div class="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300">
        <!-- Navigation Header -->
        <header class="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30 shadow-sm">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div class="flex items-center space-x-3 cursor-pointer" onclick="App.loadStudentDashboard()">
              <div class="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xl shadow-md">
                <i class="fas fa-shield-halved"></i>
              </div>
              <div>
                <span class="text-lg font-black tracking-tight text-slate-900 dark:text-white">ExamShield</span>
                <span class="hidden sm:inline-block ml-2 text-xs px-2 py-0.5 rounded-full font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">v2.0</span>
              </div>
            </div>

            <!-- Header Actions -->
            <div class="flex items-center space-x-4">
              <!-- Dark Mode Toggle -->
              <button onclick="App.toggleTheme()" class="p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition">
                <i class="fas fa-moon dark:hidden text-lg"></i>
                <i class="fas fa-sun hidden dark:inline text-lg text-amber-400"></i>
              </button>

              <!-- Role Switcher Navigation -->
              ${isAdmin ? `
                <button onclick="App.loadAdminDashboard()" class="px-3.5 py-2 text-xs font-extrabold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 rounded-xl border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition">
                  <i class="fas fa-user-shield mr-1.5"></i> Admin Console
                </button>
              ` : ''}

              <!-- User Profile Dropdown / Logout -->
              <div class="flex items-center space-x-3 pl-2 border-l border-slate-200 dark:border-slate-700">
                <div class="text-right hidden sm:block">
                  <div class="text-xs font-bold text-slate-900 dark:text-white">${this.currentUser.name}</div>
                  <div class="text-[10px] uppercase font-bold text-slate-400">${this.currentUser.role}</div>
                </div>
                <button onclick="App.logout()" class="px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition">
                  <i class="fas fa-sign-out-alt mr-1"></i> Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        <!-- Dynamic Content Body -->
        <main id="main-content" class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          <!-- Content loaded via router -->
        </main>
      </div>
    `;

    if (isAdmin) {
      this.loadAdminDashboard();
    } else {
      this.loadStudentDashboard();
    }
  },

  async loadStudentDashboard() {
    const main = document.getElementById('main-content');
    main.innerHTML = `<div class="text-center py-12"><i class="fas fa-spinner fa-spin text-3xl text-indigo-600"></i></div>`;

    let exams = [];
    if (this.isMockMode) {
      const mockExams = JSON.parse(localStorage.getItem('mock_exams') || '[]');
      const enrollments = JSON.parse(localStorage.getItem('mock_enrollments') || '[]');
      const answers = JSON.parse(localStorage.getItem('mock_answers') || '[]');

      exams = mockExams.map(e => {
        const en = enrollments.find(x => x.user_id === this.currentUser.id && x.exam_id === e.id);
        const ansScore = answers.filter(a => a.user_id === this.currentUser.id && a.exam_id === e.id).reduce((sum, a) => sum + (a.marks || 0), 0);
        return {
          ...e,
          question_count: e.total_question || 5,
          enrollment_id: en ? en.id : null,
          attendance_status: en ? en.attendance_status : null,
          total_score: en ? (en.total_score || ansScore) : 0
        };
      });
    } else {
      try {
        const res = await fetch('api/exams');
        const data = await res.json();
        exams = data.exams || [];
      } catch (e) {}
    }

    const enrolled = exams.filter(e => e.enrollment_id);
    const available = exams.filter(e => !e.enrollment_id);

    main.innerHTML = `
      <div class="space-y-8">
        <!-- Banner -->
        <div class="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between">
          <div>
            <h2 class="text-2xl sm:text-3xl font-black mb-2">Welcome back, ${this.currentUser.name}!</h2>
            <p class="text-indigo-100 text-sm max-w-lg">
              Anti-cheating tab-switching detection active. Maintain browser focus during active examinations.
            </p>
          </div>
          <div class="mt-4 sm:mt-0 flex space-x-3">
            <div class="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl text-center">
              <span class="block text-2xl font-black">${enrolled.length}</span>
              <span class="text-[10px] uppercase font-bold tracking-wider text-indigo-200">Enrolled</span>
            </div>
            <div class="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl text-center">
              <span class="block text-2xl font-black">${available.length}</span>
              <span class="text-[10px] uppercase font-bold tracking-wider text-indigo-200">Available</span>
            </div>
          </div>
        </div>

        <!-- Section: Available Exams -->
        <div>
          <h3 class="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center">
            <i class="fas fa-list-check text-indigo-600 mr-2"></i> Available Examinations
          </h3>
          ${available.length === 0 ? `
            <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 text-center text-slate-500 text-sm">
              No new exams available for enrollment right now.
            </div>
          ` : `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              ${available.map(e => `
                <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                  <div>
                    <div class="flex items-center justify-between mb-3">
                      <span class="px-2.5 py-1 text-[10px] font-black uppercase rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                        Code: ${e.code}
                      </span>
                      <span class="text-xs font-bold text-slate-500">
                        <i class="fas fa-clock mr-1"></i>${e.duration_minutes} Mins
                      </span>
                    </div>
                    <h4 class="font-bold text-slate-900 dark:text-white text-base mb-2">${e.title}</h4>
                    <p class="text-slate-500 dark:text-slate-400 text-xs mb-4 line-clamp-2">${e.description || 'Proctored online examination.'}</p>
                  </div>

                  <div class="pt-4 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
                    <div class="text-xs text-slate-500">
                      <i class="fas fa-question-circle text-indigo-500 mr-1"></i> ${e.question_count} Questions
                    </div>
                    <button onclick="App.enrollExam(${e.id})" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-sm transition">
                      Enroll Now
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <!-- Section: My Enrolled Exams -->
        <div>
          <h3 class="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center">
            <i class="fas fa-folder-open text-purple-600 mr-2"></i> My Enrolled Examinations
          </h3>
          ${enrolled.length === 0 ? `
            <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 text-center text-slate-500 text-sm">
              You have not enrolled in any examinations yet.
            </div>
          ` : `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              ${enrolled.map(e => `
                <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                  <div>
                    <div class="flex items-center justify-between mb-3">
                      <span class="px-2.5 py-1 text-[10px] font-black uppercase rounded-lg ${e.attendance_status === 'Present' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'}">
                        Status: ${e.attendance_status === 'Present' ? 'Completed' : 'Enrolled'}
                      </span>
                      <span class="text-xs font-bold text-slate-500"><i class="fas fa-clock mr-1"></i>${e.duration_minutes} Mins</span>
                    </div>
                    <h4 class="font-bold text-slate-900 dark:text-white text-base mb-2">${e.title}</h4>
                    <p class="text-slate-500 dark:text-slate-400 text-xs mb-4">${e.description || 'Online test.'}</p>
                  </div>

                  <div class="pt-4 border-t border-slate-100 dark:border-slate-700/50">
                    ${e.attendance_status === 'Present' ? `
                      <button onclick="App.viewResult(${e.id})" class="w-full py-2.5 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition">
                        <i class="fas fa-chart-pie mr-1.5"></i> View Scorecard & Certificate
                      </button>
                    ` : `
                      <button onclick="App.openExamOnboarding('${e.code}')" class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center justify-center">
                        <i class="fas fa-play mr-2 text-xs"></i> Take Exam Now
                      </button>
                    `}
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>
    `;
  },

  async enrollExam(examId) {
    if (this.isMockMode) {
      const enrollments = JSON.parse(localStorage.getItem('mock_enrollments') || '[]');
      enrollments.push({
        id: Date.now(),
        user_id: this.currentUser.id,
        exam_id: examId,
        attendance_status: 'Absent',
        total_score: 0
      });
      localStorage.setItem('mock_enrollments', JSON.stringify(enrollments));
      this.loadStudentDashboard();
      return;
    }

    try {
      const res = await fetch(`api/exams/enroll/${examId}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        this.loadStudentDashboard();
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert(err.message);
    }
  },

  async openExamOnboarding(code) {
    if (this.isMockMode) {
      const mockExams = JSON.parse(localStorage.getItem('mock_exams') || '[]');
      const mockQuestions = JSON.parse(localStorage.getItem('mock_questions') || '[]');
      const enrollments = JSON.parse(localStorage.getItem('mock_enrollments') || '[]');

      const exam = mockExams.find(e => e.code === code);
      if (!exam) return;

      const questions = mockQuestions.filter(q => q.exam_id === exam.id);
      this.activeExam = exam;
      this.activeQuestions = questions;
      this.currentQuestionIndex = 0;
      this.remainingSeconds = exam.duration_minutes * 60;

      window.ProctorEngine.init({
        examId: this.activeExam.id,
        maxViolations: this.activeExam.max_violations || 3,
        initialViolations: 0,
        enableProctoring: !!this.activeExam.enable_proctoring,
        enableFullscreen: !!this.activeExam.enable_fullscreen
      });

      this.renderOnboardingModal();
      return;
    }

    try {
      const res = await fetch(`api/exams/start/${code}`);
      const data = await res.json();

      if (!data.success) {
        alert(data.error);
        this.loadStudentDashboard();
        return;
      }

      if (data.already_submitted) {
        this.viewResult(data.exam.id);
        return;
      }

      this.activeExam = data.exam;
      this.activeQuestions = data.questions || [];
      this.currentQuestionIndex = 0;
      this.remainingSeconds = data.exam.duration_minutes * 60;

      window.ProctorEngine.init({
        examId: this.activeExam.id,
        maxViolations: this.activeExam.max_violations || 3,
        initialViolations: 0,
        enableProctoring: !!this.activeExam.enable_proctoring,
        enableFullscreen: !!this.activeExam.enable_fullscreen
      });

      this.renderOnboardingModal();
    } catch (err) {
      alert(err.message);
      this.loadStudentDashboard();
    }
  },

  renderOnboardingModal() {
    const modalHtml = `
      <div id="modal-exam-onboarding" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-md p-4">
        <div class="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl space-y-6">
          <div class="text-center">
            <div class="w-16 h-16 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl">
              <i class="fas fa-user-shield"></i>
            </div>
            <h3 class="text-2xl font-black text-slate-900 dark:text-white">${this.activeExam.title}</h3>
            <p class="text-xs text-slate-500 mt-1">Pre-Exam System Check & Anti-Cheating Guidelines</p>
          </div>

          <!-- Rules Summary -->
          <div class="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 text-xs space-y-3">
            <div class="font-bold text-slate-900 dark:text-white flex items-center">
              <i class="fas fa-shield-cat text-indigo-500 mr-2 text-sm"></i> Examination Rules & Proctoring Policies:
            </div>
            <ul class="space-y-2 text-slate-600 dark:text-slate-300 pl-6 list-disc">
              <li><strong>Tab Switching Monitored:</strong> Leaving or minimizing the browser tab is strictly logged.</li>
              <li><strong>Window Focus Required:</strong> Clicking outside or using Alt+Tab will issue a warning.</li>
              <li><strong>Violation Limit:</strong> Test auto-submits after <strong>${this.activeExam.max_violations} warnings</strong>.</li>
              <li><strong>Fullscreen Mode:</strong> The test will launch in full screen.</li>
            </ul>
          </div>

          <!-- Live Camera Test Widget -->
          <div>
            <div class="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
              <span>Webcam Check:</span>
              <button onclick="App.checkCameraPermission()" class="text-indigo-600 hover:underline font-bold">
                <i class="fas fa-camera mr-1"></i> Grant & Preview Camera
              </button>
            </div>
            <div id="onboarding-camera-box" class="bg-slate-100 dark:bg-slate-900 rounded-xl p-4 text-center text-xs text-slate-500 border border-dashed border-slate-300 dark:border-slate-700">
              Click "Grant & Preview Camera" above to test your video feed (Optional).
            </div>
          </div>

          <!-- Confirmation Button -->
          <button onclick="App.startProctoredSession()" class="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm rounded-xl shadow-xl shadow-emerald-600/30 transition flex items-center justify-center space-x-2">
            <i class="fas fa-lock"></i>
            <span>I Agree & Begin Examination</span>
          </button>
        </div>
      </div>
    `;

    const old = document.getElementById('modal-exam-onboarding');
    if (old) old.remove();

    document.body.insertAdjacentHTML('beforeend', modalHtml);
  },

  async checkCameraPermission() {
    await window.ProctorEngine.startCameraPreview('onboarding-camera-box');
  },

  startProctoredSession() {
    document.getElementById('modal-exam-onboarding').remove();
    this.renderExamInterface(0);

    window.ProctorEngine.startExamSession();

    if (this.activeExam.enable_proctoring) {
      window.ProctorEngine.startCameraPreview('camera-feed-box');
    }

    this.startTimer();
  },

  renderExamInterface(initialViolations) {
    const exam = this.activeExam;
    const main = document.getElementById('main-content');

    main.innerHTML = `
      <div class="space-y-6">
        <!-- Top Bar: Exam Title, Timer, Proctor Badge -->
        <div class="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div class="flex items-center space-x-2">
              <h2 class="text-xl font-black text-slate-900 dark:text-white">${exam.title}</h2>
              <span id="proctor-violation-badge" class="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                Warnings: ${initialViolations} / ${exam.max_violations}
              </span>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Code: ${exam.code} | Marks: +${exam.marks_per_right} / -${exam.marks_per_wrong}</p>
          </div>

          <!-- Timer & Submit Button -->
          <div class="flex items-center space-x-4">
            <div class="bg-slate-900 dark:bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-700 flex items-center space-x-3 text-white">
              <i class="fas fa-hourglass-half text-amber-400 text-lg animate-pulse"></i>
              <div>
                <div class="text-[10px] uppercase font-bold text-slate-400">Time Left</div>
                <div id="exam-timer-display" class="font-mono text-lg font-black text-amber-400">00:00</div>
              </div>
            </div>
            <button onclick="App.confirmSubmitExam()" class="px-5 py-3 bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold rounded-xl shadow-lg transition">
              <i class="fas fa-check-circle mr-1.5"></i> Finish Exam
            </button>
          </div>
        </div>

        <!-- Main Body: Question Box & Navigation Sidebar -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Question Box (Col 2) -->
          <div class="lg:col-span-2 space-y-6">
            <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm" id="single-question-container">
              <!-- Rendered dynamically -->
            </div>

            <!-- Controls: Prev, Next, Mark -->
            <div class="flex items-center justify-between">
              <button id="btn-prev-q" onclick="App.navQuestion(-1)" class="px-5 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-white text-xs font-bold rounded-xl transition">
                <i class="fas fa-chevron-left mr-1"></i> Previous
              </button>
              <button id="btn-mark-q" onclick="App.toggleMarkReview()" class="px-4 py-2.5 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-xs font-bold rounded-xl transition">
                <i class="fas fa-bookmark mr-1"></i> Toggle Mark for Review
              </button>
              <button id="btn-next-q" onclick="App.navQuestion(1)" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition">
                Next <i class="fas fa-chevron-right ml-1"></i>
              </button>
            </div>
          </div>

          <!-- Question Grid Palette & Live Camera Feed (Col 1) -->
          <div class="space-y-6">
            <!-- Live Camera Proctor Feed -->
            ${exam.enable_proctoring ? `
              <div class="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center">
                  <i class="fas fa-video text-emerald-500 mr-1.5"></i> Live Camera Monitor
                </h4>
                <div id="camera-feed-box"></div>
              </div>
            ` : ''}

            <!-- Palette Grid -->
            <div class="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Question Navigator</h4>
              <div id="question-palette-grid" class="grid grid-cols-5 gap-2.5">
                <!-- Rendered dynamically -->
              </div>

              <!-- Legend -->
              <div class="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 text-xs space-y-2">
                <div class="flex items-center"><span class="w-3 h-3 bg-indigo-600 rounded-md mr-2"></span> Current</div>
                <div class="flex items-center"><span class="w-3 h-3 bg-emerald-500 rounded-md mr-2"></span> Answered</div>
                <div class="flex items-center"><span class="w-3 h-3 bg-amber-400 rounded-md mr-2"></span> Marked for Review</div>
                <div class="flex items-center"><span class="w-3 h-3 bg-slate-200 dark:bg-slate-700 rounded-md mr-2"></span> Unanswered</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.renderCurrentQuestion();
    this.renderQuestionPalette();
  },

  renderCurrentQuestion() {
    const q = this.activeQuestions[this.currentQuestionIndex];
    if (!q) return;

    const container = document.getElementById('single-question-container');
    container.innerHTML = `
      <div class="flex items-center justify-between mb-4">
        <span class="text-xs font-extrabold text-indigo-600 uppercase tracking-widest">Question ${this.currentQuestionIndex + 1} of ${this.activeQuestions.length}</span>
        ${q.is_marked_for_review ? `<span class="px-2.5 py-1 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-bold rounded-lg"><i class="fas fa-bookmark mr-1"></i>Marked for Review</span>` : ''}
      </div>
      <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-6 leading-relaxed">${q.question_title}</h3>

      <!-- Options -->
      <div class="space-y-3">
        ${q.options.map(opt => `
          <label class="flex items-center p-4 rounded-xl border cursor-pointer transition ${q.user_answer_option === opt.option_number ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 text-indigo-950 dark:text-indigo-100 font-semibold' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300'}">
            <input type="radio" name="opt-${q.id}" value="${opt.option_number}" ${q.user_answer_option === opt.option_number ? 'checked' : ''} onchange="App.selectOption(${q.id}, ${opt.option_number})" class="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300">
            <span class="ml-3 text-sm text-slate-800 dark:text-slate-200">${opt.option_title}</span>
          </label>
        `).join('')}
      </div>
    `;

    document.getElementById('btn-prev-q').disabled = this.currentQuestionIndex === 0;
    document.getElementById('btn-next-q').disabled = this.currentQuestionIndex === this.activeQuestions.length - 1;
  },

  renderQuestionPalette() {
    const grid = document.getElementById('question-palette-grid');
    if (!grid) return;

    grid.innerHTML = this.activeQuestions.map((q, idx) => {
      let bg = 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300';
      if (idx === this.currentQuestionIndex) {
        bg = 'bg-indigo-600 text-white font-black ring-2 ring-indigo-400';
      } else if (q.is_marked_for_review) {
        bg = 'bg-amber-400 text-slate-900 font-bold';
      } else if (q.user_answer_option > 0) {
        bg = 'bg-emerald-500 text-white font-bold';
      }

      return `
        <button onclick="App.jumpToQuestion(${idx})" class="w-10 h-10 rounded-xl flex items-center justify-center text-xs transition ${bg}">
          ${idx + 1}
        </button>
      `;
    }).join('');
  },

  async selectOption(questionId, optionNumber) {
    const q = this.activeQuestions[this.currentQuestionIndex];
    q.user_answer_option = optionNumber;

    this.renderQuestionPalette();

    if (this.isMockMode) {
      const answers = JSON.parse(localStorage.getItem('mock_answers') || '[]');
      const correctOpt = q.options.find(o => o.is_correct === 1);
      const marks = (correctOpt && correctOpt.option_number === optionNumber) ? (this.activeExam.marks_per_right || 2.0) : -(this.activeExam.marks_per_wrong || 0);

      const existingIdx = answers.findIndex(a => a.user_id === this.currentUser.id && a.exam_id === this.activeExam.id && a.question_id === questionId);
      if (existingIdx >= 0) {
        answers[existingIdx].option_number = optionNumber;
        answers[existingIdx].marks = marks;
      } else {
        answers.push({ user_id: this.currentUser.id, exam_id: this.activeExam.id, question_id: questionId, option_number: optionNumber, marks });
      }
      localStorage.setItem('mock_answers', JSON.stringify(answers));
      return;
    }

    try {
      await fetch('api/exams/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exam_id: this.activeExam.id,
          question_id: questionId,
          option_number: optionNumber
        })
      });
    } catch (e) {}
  },

  async toggleMarkReview() {
    const q = this.activeQuestions[this.currentQuestionIndex];
    q.is_marked_for_review = q.is_marked_for_review ? 0 : 1;

    this.renderCurrentQuestion();
    this.renderQuestionPalette();

    if (this.isMockMode) return;

    try {
      await fetch('api/exams/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exam_id: this.activeExam.id,
          question_id: q.id,
          is_marked_for_review: q.is_marked_for_review
        })
      });
    } catch (e) {}
  },

  jumpToQuestion(idx) {
    this.currentQuestionIndex = idx;
    this.renderCurrentQuestion();
    this.renderQuestionPalette();
  },

  navQuestion(dir) {
    const newIdx = this.currentQuestionIndex + dir;
    if (newIdx >= 0 && newIdx < this.activeQuestions.length) {
      this.currentQuestionIndex = newIdx;
      this.renderCurrentQuestion();
      this.renderQuestionPalette();
    }
  },

  startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);

    const updateTimer = () => {
      if (this.remainingSeconds <= 0) {
        clearInterval(this.timerInterval);
        window.ProctorEngine.showAutoSubmitModal('Examination time expired.');
        return;
      }

      this.remainingSeconds--;
      const m = Math.floor(this.remainingSeconds / 60);
      const s = this.remainingSeconds % 60;
      const display = document.getElementById('exam-timer-display');
      if (display) {
        display.innerText = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      }
    };

    updateTimer();
    this.timerInterval = setInterval(updateTimer, 1000);
  },

  confirmSubmitExam() {
    const answeredCount = this.activeQuestions.filter(q => q.user_answer_option > 0).length;
    const totalCount = this.activeQuestions.length;

    if (confirm(`Are you sure you want to submit your exam?\n\nAnswered: ${answeredCount} / ${totalCount} questions.`)) {
      this.submitExamFinal(false);
    }
  },

  async submitExamFinal(autoSubmitted = false, reason = '') {
    if (this.timerInterval) clearInterval(this.timerInterval);
    window.ProctorEngine.stopCamera();
    window.ProctorEngine.isExamActive = false;

    if (this.isMockMode) {
      const enrollments = JSON.parse(localStorage.getItem('mock_enrollments') || '[]');
      const answers = JSON.parse(localStorage.getItem('mock_answers') || '[]');
      const totalScore = answers.filter(a => a.user_id === this.currentUser.id && a.exam_id === this.activeExam.id).reduce((sum, a) => sum + (a.marks || 0), 0);

      const existingIdx = enrollments.findIndex(e => e.user_id === this.currentUser.id && e.exam_id === this.activeExam.id);
      const record = {
        id: Date.now(),
        user_id: this.currentUser.id,
        exam_id: this.activeExam.id,
        attendance_status: 'Present',
        total_score: totalScore,
        auto_submitted: autoSubmitted ? 1 : 0,
        submitted_at: new Date().toISOString()
      };

      if (existingIdx >= 0) enrollments[existingIdx] = record;
      else enrollments.push(record);

      localStorage.setItem('mock_enrollments', JSON.stringify(enrollments));

      if (autoSubmitted) {
        const logs = JSON.parse(localStorage.getItem('mock_logs') || '[]');
        logs.push({
          id: Date.now(),
          user_id: this.currentUser.id,
          user_name: this.currentUser.name,
          user_email: this.currentUser.email,
          exam_id: this.activeExam.id,
          exam_title: this.activeExam.title,
          violation_type: 'AUTO_SUBMIT_TERMINATION',
          details: reason,
          logged_at: new Date().toISOString()
        });
        localStorage.setItem('mock_logs', JSON.stringify(logs));
      }

      this.viewResult(this.activeExam.id);
      return;
    }

    try {
      const res = await fetch('api/exams/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exam_id: this.activeExam.id,
          auto_submitted: autoSubmitted,
          reason: reason
        })
      });

      const data = await res.json();
      if (data.success) {
        this.viewResult(this.activeExam.id);
      } else {
        alert(data.error);
        this.loadStudentDashboard();
      }
    } catch (err) {
      alert(err.message);
      this.loadStudentDashboard();
    }
  },

  async viewResult(examId) {
    const main = document.getElementById('main-content');
    main.innerHTML = `<div class="text-center py-12"><i class="fas fa-spinner fa-spin text-3xl text-indigo-600"></i></div>`;

    let exam = this.activeExam;
    let enrollment = null;
    let questions = [];
    let totalPossible = 10;

    if (this.isMockMode) {
      const mockExams = JSON.parse(localStorage.getItem('mock_exams') || '[]');
      const mockQuestions = JSON.parse(localStorage.getItem('mock_questions') || '[]');
      const enrollments = JSON.parse(localStorage.getItem('mock_enrollments') || '[]');
      const answers = JSON.parse(localStorage.getItem('mock_answers') || '[]');

      exam = mockExams.find(e => e.id === examId) || this.activeExam;
      enrollment = enrollments.find(e => e.user_id === this.currentUser.id && e.exam_id === examId) || {
        total_score: 0, auto_submitted: 0, submitted_at: new Date().toISOString()
      };
      questions = mockQuestions.filter(q => q.exam_id === examId).map(q => {
        const ans = answers.find(a => a.user_id === this.currentUser.id && a.exam_id === examId && a.question_id === q.id);
        return {
          ...q,
          user_answer_option: ans ? ans.option_number : 0,
          marks_obtained: ans ? ans.marks : 0
        };
      });
      totalPossible = questions.length * (exam.marks_per_right || 2);
    } else {
      try {
        const res = await fetch(`api/exams/result/${examId}`);
        const data = await res.json();
        if (data.success) {
          exam = data.exam;
          enrollment = data.enrollment;
          questions = data.questions;
          totalPossible = data.totalPossible;
        }
      } catch (err) {
        alert(err.message);
        this.loadStudentDashboard();
        return;
      }
    }

    const percentage = Math.max(0, Math.round((enrollment.total_score / (totalPossible || 1)) * 100));
    const passed = percentage >= 50;

    main.innerHTML = `
      <div class="max-w-4xl mx-auto space-y-8 print:p-0">
        <!-- Scorecard Card -->
        <div class="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-xl text-center relative overflow-hidden">
          <div class="absolute top-0 left-0 w-full h-3 ${passed ? 'bg-emerald-500' : 'bg-red-500'}"></div>
          
          <span class="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-4 ${passed ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'}">
            ${passed ? 'Passed Certificate' : 'Needs Improvement'}
          </span>

          <h2 class="text-3xl font-black text-slate-900 dark:text-white mb-2">${exam.title}</h2>
          <p class="text-slate-500 dark:text-slate-400 text-sm mb-6">Exam Result Scorecard & Breakdown</p>

          <div class="flex flex-col sm:flex-row items-center justify-center gap-6 my-6">
            <div class="w-32 h-32 rounded-full border-8 ${passed ? 'border-emerald-500 text-emerald-600' : 'border-red-500 text-red-600'} flex flex-col items-center justify-center">
              <span class="text-3xl font-black">${percentage}%</span>
              <span class="text-[10px] uppercase font-bold text-slate-400">Score</span>
            </div>
            <div class="text-left space-y-2">
              <div class="text-sm"><span class="font-bold text-slate-700 dark:text-slate-300">Marks Secured:</span> ${enrollment.total_score} / ${totalPossible}</div>
              <div class="text-sm"><span class="font-bold text-slate-700 dark:text-slate-300">Submission Mode:</span> ${enrollment.auto_submitted ? '<span class="text-red-500 font-bold">Auto-Submitted (Proctor Limit)</span>' : 'Regular Submission'}</div>
              <div class="text-sm"><span class="font-bold text-slate-700 dark:text-slate-300">Submitted At:</span> ${new Date(enrollment.submitted_at).toLocaleString()}</div>
            </div>
          </div>

          <div class="flex justify-center space-x-4 print:hidden">
            <button onclick="window.print()" class="px-5 py-2.5 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md transition">
              <i class="fas fa-print mr-1.5"></i> Print Certificate
            </button>
            <button onclick="App.loadStudentDashboard()" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition">
              Back to Dashboard
            </button>
          </div>
        </div>

        <!-- Question Review Breakdown -->
        <div class="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <h3 class="text-lg font-black text-slate-900 dark:text-white mb-4">Detailed Question Breakdown</h3>

          ${questions.map((q, idx) => {
            const correctOpt = q.options.find(o => o.is_correct === 1);
            const userOpt = q.options.find(o => o.option_number === q.user_answer_option);
            const isRight = q.marks_obtained > 0;

            return `
              <div class="p-5 rounded-2xl border ${isRight ? 'border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-800' : 'border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-800'}">
                <div class="flex items-center justify-between mb-3">
                  <span class="text-xs font-bold text-slate-500">Question ${idx + 1}</span>
                  <span class="px-2.5 py-1 text-[10px] font-black uppercase rounded-lg ${isRight ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}">
                    ${isRight ? `+${q.marks_obtained} Marks` : `${q.marks_obtained} Marks`}
                  </span>
                </div>
                <h4 class="font-bold text-slate-900 dark:text-white text-base mb-3">${q.question_title}</h4>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div class="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span class="block text-slate-400 font-bold mb-1">Your Answer:</span>
                    <span class="${isRight ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}">${userOpt ? userOpt.option_title : 'Not Answered'}</span>
                  </div>
                  <div class="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span class="block text-slate-400 font-bold mb-1">Correct Answer:</span>
                    <span class="text-emerald-600 font-bold">${correctOpt ? correctOpt.option_title : 'N/A'}</span>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  // ================= ADMIN CONSOLE =================
  async loadAdminDashboard() {
    const main = document.getElementById('main-content');
    main.innerHTML = `<div class="text-center py-12"><i class="fas fa-spinner fa-spin text-3xl text-indigo-600"></i></div>`;

    let stats = { total_exams: 2, total_students: 5, total_violations: 0, auto_submissions: 0 };
    let exams = [];
    let logs = [];

    if (this.isMockMode) {
      exams = JSON.parse(localStorage.getItem('mock_exams') || '[]');
      logs = JSON.parse(localStorage.getItem('mock_logs') || '[]');
      stats.total_exams = exams.length;
      stats.total_violations = logs.length;
      stats.auto_submissions = logs.filter(l => l.violation_type === 'AUTO_SUBMIT_TERMINATION').length;
    } else {
      try {
        const [statsRes, examsRes, logsRes] = await Promise.all([
          fetch('api/proctor/admin/stats'),
          fetch('api/exams/admin/list'),
          fetch('api/proctor/admin/logs')
        ]);
        stats = (await statsRes.json()).stats || {};
        exams = (await examsRes.json()).exams || [];
        logs = (await logsRes.json()).logs || [];
      } catch (err) {}
    }

    main.innerHTML = `
      <div class="space-y-8">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-black text-slate-900 dark:text-white">Admin Audit & Examination Control</h2>
            <p class="text-slate-500 text-xs">Manage proctored tests, question sets, and real-time tab switching violation logs.</p>
          </div>
          <button onclick="App.showCreateExamModal()" class="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition">
            <i class="fas fa-plus mr-1.5"></i> Create New Exam
          </button>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div class="text-xs font-bold uppercase text-slate-400 mb-1">Total Exams</div>
            <div class="text-2xl font-black text-slate-900 dark:text-white">${stats.total_exams}</div>
          </div>
          <div class="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div class="text-xs font-bold uppercase text-slate-400 mb-1">Registered Students</div>
            <div class="text-2xl font-black text-indigo-600 dark:text-indigo-400">${stats.total_students}</div>
          </div>
          <div class="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div class="text-xs font-bold uppercase text-slate-400 mb-1">Tab Violations Logged</div>
            <div class="text-2xl font-black text-amber-500">${stats.total_violations}</div>
          </div>
          <div class="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div class="text-xs font-bold uppercase text-slate-400 mb-1">Auto Terminations</div>
            <div class="text-2xl font-black text-red-600">${stats.auto_submissions}</div>
          </div>
        </div>

        <!-- Exam Management List -->
        <div class="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 class="text-base font-black text-slate-900 dark:text-white mb-4">Exam Registry</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead>
                <tr class="border-b border-slate-200 dark:border-slate-700 text-slate-400 uppercase">
                  <th class="py-3 px-2">Title</th>
                  <th class="py-3 px-2">Code</th>
                  <th class="py-3 px-2">Questions</th>
                  <th class="py-3 px-2">Duration</th>
                  <th class="py-3 px-2">Proctoring</th>
                  <th class="py-3 px-2">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-700/50">
                ${exams.map(e => `
                  <tr>
                    <td class="py-3 px-2 font-bold text-slate-900 dark:text-white">${e.title}</td>
                    <td class="py-3 px-2 font-mono text-indigo-600">${e.code}</td>
                    <td class="py-3 px-2">${e.total_question || 5} Qs</td>
                    <td class="py-3 px-2">${e.duration_minutes} Mins</td>
                    <td class="py-3 px-2">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold ${e.enable_proctoring ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-600'}">
                        ${e.enable_proctoring ? `Active (Max ${e.max_violations} V)` : 'Disabled'}
                      </span>
                    </td>
                    <td class="py-3 px-2 space-x-2">
                      <button onclick="App.showQuestionManager(${e.id}, '${e.title}')" class="px-3 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 rounded-lg font-bold">
                        Manage Qs
                      </button>
                      <button onclick="App.deleteExam(${e.id})" class="px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg font-bold">
                        Delete
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Proctoring Audit Logs Table -->
        <div class="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 class="text-base font-black text-slate-900 dark:text-white mb-4 flex items-center text-red-600">
            <i class="fas fa-user-ninja mr-2"></i> Live Tab-Switching & Defocus Violation Audit Logs
          </h3>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead>
                <tr class="border-b border-slate-200 dark:border-slate-700 text-slate-400 uppercase">
                  <th class="py-3 px-2">Timestamp</th>
                  <th class="py-3 px-2">Student</th>
                  <th class="py-3 px-2">Exam</th>
                  <th class="py-3 px-2">Violation Event</th>
                  <th class="py-3 px-2">Details</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-700/50">
                ${logs.length === 0 ? `
                  <tr><td colspan="5" class="py-4 text-center text-slate-500">No anti-cheating violations recorded yet.</td></tr>
                ` : logs.map(l => `
                  <tr>
                    <td class="py-3 px-2 text-slate-400">${new Date(l.logged_at).toLocaleString()}</td>
                    <td class="py-3 px-2 font-bold text-slate-900 dark:text-white">${l.user_name} <br/><span class="text-[10px] text-slate-400 font-normal">${l.user_email}</span></td>
                    <td class="py-3 px-2 font-bold text-indigo-600">${l.exam_title}</td>
                    <td class="py-3 px-2">
                      <span class="px-2 py-1 rounded text-[10px] font-black uppercase ${l.violation_type === 'TAB_SWITCH' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'}">
                        ${l.violation_type}
                      </span>
                    </td>
                    <td class="py-3 px-2 text-slate-500 max-w-xs truncate">${l.details}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  showCreateExamModal() {
    const modalHtml = `
      <div id="modal-create-exam" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">
        <div class="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-lg w-full mx-4 shadow-2xl border border-slate-200 dark:border-slate-700">
          <h3 class="text-xl font-black text-slate-900 dark:text-white mb-4">Create New Examination</h3>
          
          <form onsubmit="App.handleCreateExam(event)" class="space-y-4 text-xs">
            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Exam Title</label>
              <input type="text" id="new-exam-title" required class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl" placeholder="JavaScript Advanced Certification">
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Unique Code</label>
                <input type="text" id="new-exam-code" required class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl" placeholder="JS-2026">
              </div>
              <div>
                <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Duration (Mins)</label>
                <input type="number" id="new-exam-duration" required value="15" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl">
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Right Mark (+)</label>
                <input type="number" step="0.5" id="new-exam-right" value="1.0" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl">
              </div>
              <div>
                <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Wrong Mark (-)</label>
                <input type="number" step="0.25" id="new-exam-wrong" value="0.25" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl">
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Max Tab Violations</label>
                <input type="number" id="new-exam-maxv" value="3" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl">
              </div>
              <div>
                <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tab Proctoring</label>
                <select id="new-exam-proctor" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl">
                  <option value="1">Enabled (Strict)</option>
                  <option value="0">Disabled</option>
                </select>
              </div>
            </div>

            <div class="flex justify-end space-x-3 pt-4 border-t">
              <button type="button" onclick="document.getElementById('modal-create-exam').remove()" class="px-4 py-2 text-slate-500 font-bold">Cancel</button>
              <button type="submit" class="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl">Save Exam</button>
            </div>
          </form>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  },

  async handleCreateExam(e) {
    e.preventDefault();
    const title = document.getElementById('new-exam-title').value;
    const code = document.getElementById('new-exam-code').value;
    const duration_minutes = parseInt(document.getElementById('new-exam-duration').value);
    const marks_per_right = parseFloat(document.getElementById('new-exam-right').value);
    const marks_per_wrong = parseFloat(document.getElementById('new-exam-wrong').value);
    const max_violations = parseInt(document.getElementById('new-exam-maxv').value);
    const enable_proctoring = parseInt(document.getElementById('new-exam-proctor').value);

    if (this.isMockMode) {
      const exams = JSON.parse(localStorage.getItem('mock_exams') || '[]');
      exams.unshift({
        id: Date.now(), title, code, duration_minutes, marks_per_right, marks_per_wrong, max_violations, enable_proctoring, total_question: 0
      });
      localStorage.setItem('mock_exams', JSON.stringify(exams));
      document.getElementById('modal-create-exam').remove();
      this.loadAdminDashboard();
      return;
    }

    try {
      const res = await fetch('api/exams/admin/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, code, duration_minutes, marks_per_right, marks_per_wrong, max_violations, enable_proctoring })
      });
      const data = await res.json();
      if (data.success) {
        document.getElementById('modal-create-exam').remove();
        this.loadAdminDashboard();
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert(err.message);
    }
  },

  async showQuestionManager(examId, examTitle) {
    let questions = [];
    if (this.isMockMode) {
      const mockQuestions = JSON.parse(localStorage.getItem('mock_questions') || '[]');
      questions = mockQuestions.filter(q => q.exam_id === examId);
    } else {
      try {
        const res = await fetch(`api/exams/admin/questions/${examId}`);
        const data = await res.json();
        questions = data.questions || [];
      } catch (e) {}
    }

    const modalHtml = `
      <div id="modal-manage-qs" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm p-4">
        <div class="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700 space-y-6">
          <div class="flex items-center justify-between border-b pb-4">
            <h3 class="text-xl font-black text-slate-900 dark:text-white">Manage Questions: ${examTitle}</h3>
            <button onclick="document.getElementById('modal-manage-qs').remove()" class="text-slate-400 text-xl font-bold">&times;</button>
          </div>

          <!-- Existing Questions -->
          <div class="space-y-4">
            ${questions.map((q, idx) => `
              <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs">
                <div class="flex justify-between font-bold text-slate-900 dark:text-white mb-2">
                  <span>Q${idx + 1}: ${q.question_title}</span>
                  <button onclick="App.deleteQuestion(${q.id}, ${examId}, '${examTitle}')" class="text-red-500">Delete</button>
                </div>
                <div class="grid grid-cols-2 gap-2 text-slate-500">
                  ${q.options.map(o => `
                    <div class="${o.is_correct ? 'font-bold text-emerald-600' : ''}">${o.option_number}. ${o.option_title} ${o.is_correct ? '✓' : ''}</div>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Add Question Form -->
          <form onsubmit="App.handleAddQuestion(event, ${examId}, '${examTitle}')" class="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-800 text-xs space-y-3">
            <h4 class="font-black text-indigo-900 dark:text-indigo-200 text-sm">Add Question</h4>
            <input type="text" id="add-q-title" required class="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl" placeholder="Question prompt...">
            
            <div class="grid grid-cols-2 gap-2">
              <input type="text" id="add-q-opt1" required class="px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl" placeholder="Option 1">
              <input type="text" id="add-q-opt2" required class="px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl" placeholder="Option 2">
              <input type="text" id="add-q-opt3" required class="px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl" placeholder="Option 3">
              <input type="text" id="add-q-opt4" required class="px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl" placeholder="Option 4">
            </div>

            <div>
              <label class="block font-bold mb-1">Correct Option Number (1-4)</label>
              <select id="add-q-correct" class="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl">
                <option value="1">Option 1</option>
                <option value="2">Option 2</option>
                <option value="3">Option 3</option>
                <option value="4">Option 4</option>
              </select>
            </div>

            <button type="submit" class="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl">Add Question to Exam</button>
          </form>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  },

  async handleAddQuestion(e, examId, examTitle) {
    e.preventDefault();
    const title = document.getElementById('add-q-title').value;
    const opt1 = document.getElementById('add-q-opt1').value;
    const opt2 = document.getElementById('add-q-opt2').value;
    const opt3 = document.getElementById('add-q-opt3').value;
    const opt4 = document.getElementById('add-q-opt4').value;
    const correct = parseInt(document.getElementById('add-q-correct').value);

    if (this.isMockMode) {
      const mockQuestions = JSON.parse(localStorage.getItem('mock_questions') || '[]');
      mockQuestions.push({
        id: Date.now(),
        exam_id: examId,
        question_title: title,
        options: [
          { id: Date.now() + 1, option_number: 1, option_title: opt1, is_correct: correct === 1 ? 1 : 0 },
          { id: Date.now() + 2, option_number: 2, option_title: opt2, is_correct: correct === 2 ? 1 : 0 },
          { id: Date.now() + 3, option_number: 3, option_title: opt3, is_correct: correct === 3 ? 1 : 0 },
          { id: Date.now() + 4, option_number: 4, option_title: opt4, is_correct: correct === 4 ? 1 : 0 }
        ]
      });
      localStorage.setItem('mock_questions', JSON.stringify(mockQuestions));
      document.getElementById('modal-manage-qs').remove();
      this.showQuestionManager(examId, examTitle);
      return;
    }

    try {
      const res = await fetch('api/exams/admin/add-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exam_id: examId,
          question_title: title,
          options: [opt1, opt2, opt3, opt4],
          correct_option: correct
        })
      });
      const data = await res.json();
      if (data.success) {
        document.getElementById('modal-manage-qs').remove();
        this.showQuestionManager(examId, examTitle);
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert(err.message);
    }
  },

  async deleteQuestion(id, examId, examTitle) {
    if (confirm('Delete this question?')) {
      if (this.isMockMode) {
        let mockQuestions = JSON.parse(localStorage.getItem('mock_questions') || '[]');
        mockQuestions = mockQuestions.filter(q => q.id !== id);
        localStorage.setItem('mock_questions', JSON.stringify(mockQuestions));
        document.getElementById('modal-manage-qs').remove();
        this.showQuestionManager(examId, examTitle);
        return;
      }
      await fetch(`api/exams/admin/question/${id}`, { method: 'DELETE' });
      document.getElementById('modal-manage-qs').remove();
      this.showQuestionManager(examId, examTitle);
    }
  },

  async deleteExam(id) {
    if (confirm('Delete this exam completely?')) {
      if (this.isMockMode) {
        let mockExams = JSON.parse(localStorage.getItem('mock_exams') || '[]');
        mockExams = mockExams.filter(e => e.id !== id);
        localStorage.setItem('mock_exams', JSON.stringify(mockExams));
        this.loadAdminDashboard();
        return;
      }
      await fetch(`api/exams/admin/exam/${id}`, { method: 'DELETE' });
      this.loadAdminDashboard();
    }
  },

  async logout() {
    if (this.isMockMode) {
      localStorage.removeItem('mock_session');
    } else {
      await fetch('api/auth/logout', { method: 'POST' });
    }
    this.currentUser = null;
    this.renderAuthScreen();
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
