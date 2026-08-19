const bcrypt = require('bcryptjs');
const { initDatabase, run, get } = require('./database');

async function seed() {
  console.log('Starting Database Seeding...');
  await initDatabase();

  // 1. Seed Users
  const adminPass = await bcrypt.hash('admin123', 10);
  const studentPass = await bcrypt.hash('student123', 10);
  const pawanPass = await bcrypt.hash('pawan123', 10);

  await run(
    `INSERT OR IGNORE INTO users (email, password, name, gender, address, mobile, role)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['admin@exam.com', adminPass, 'Master Administrator', 'Male', 'Headquarters', '9999999999', 'admin']
  );

  await run(
    `INSERT OR IGNORE INTO users (email, password, name, gender, address, mobile, role)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['student@exam.com', studentPass, 'Demo Student', 'Female', 'Academic Block A', '9876543210', 'student']
  );

  await run(
    `INSERT OR IGNORE INTO users (email, password, name, gender, address, mobile, role)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['pawan@exam.com', pawanPass, 'Pawan Yadav', 'Male', 'Modern Valley', '08840069545', 'student']
  );

  console.log('Seeded admin (admin@exam.com / admin123) and students.');

  // 2. Seed Demo Exams
  const exam1 = await run(
    `INSERT OR IGNORE INTO exams (title, description, code, start_datetime, duration_minutes, total_questions, marks_per_right, marks_per_wrong, enable_proctoring, max_violations, enable_fullscreen, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'Full-Stack Web Development & JS Certification',
      'Assessment testing JavaScript ES6+, Web APIs, Async I/O, and DOM event handling under anti-cheating proctoring.',
      'WEB-101',
      new Date().toISOString(),
      15,
      10,
      2.0,
      0.5,
      1,
      3,
      1,
      'Started'
    ]
  );

  const exam1Id = (await get('SELECT id FROM exams WHERE code = ?', ['WEB-101'])).id;

  const exam2 = await run(
    `INSERT OR IGNORE INTO exams (title, description, code, start_datetime, duration_minutes, total_questions, marks_per_right, marks_per_wrong, enable_proctoring, max_violations, enable_fullscreen, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'Cybersecurity & Anti-Cheating Fundamentals',
      'Test your knowledge on web security vulnerabilities (SQLi, XSS, CSRF, IDOR) and defensive coding.',
      'SEC-202',
      new Date().toISOString(),
      10,
      5,
      2.0,
      0.0,
      1,
      2,
      1,
      'Started'
    ]
  );

  const exam2Id = (await get('SELECT id FROM exams WHERE code = ?', ['SEC-202'])).id;

  // 3. Seed Questions & Options for Exam 1 (WEB-101)
  const q1Data = [
    {
      title: 'Which HTML5 JavaScript event API is used to detect when a user switches tabs or minimizes the browser window?',
      options: ['window.onblur', 'document.visibilitychange', 'document.onpagehide', 'window.ontabswitch'],
      correct: 2
    },
    {
      title: 'How do you prevent SQL Injection vulnerabilities in modern database applications?',
      options: ['Use htmlspecialchars() on raw SQL', 'Use PDO Prepared Statements with parameter binding', 'Use base64 encoding on query strings', 'Disable database error logging'],
      correct: 2
    },
    {
      title: 'What does the `window.onblur` event detect during an online proctored examination?',
      options: ['When the webcam loses light', 'When the browser window loses focus or user clicks outside', 'When the internet disconnects', 'When the timer expires'],
      correct: 2
    },
    {
      title: 'Which HTTP header prevents session hijacking by forbidding client-side JavaScript access to auth cookies?',
      options: ['SameSite=Strict', 'HttpOnly', 'Content-Security-Policy', 'X-Frame-Options'],
      correct: 2
    },
    {
      title: 'In JavaScript, which keyword declares a block-scoped variable that cannot be re-declared?',
      options: ['var', 'let', 'global', 'define'],
      correct: 2
    },
    {
      title: 'What is the purpose of CORS (Cross-Origin Resource Sharing)?',
      options: ['Encrypt database connections', 'Allow or restrict requested resources on a web page from another domain', 'Automate background jobs', 'Compress image assets'],
      correct: 2
    },
    {
      title: 'What is the default execution behavior of Node.js event loop?',
      options: ['Multi-threaded synchronous blocking', 'Single-threaded non-blocking asynchronous event loop', 'Parallel processes for each HTTP request', 'Sequential database polling'],
      correct: 2
    },
    {
      title: 'Which method requests element entry into Fullscreen mode in modern HTML5 browsers?',
      options: ['document.maximize()', 'element.requestFullscreen()', 'window.setFullScreen(true)', 'screen.lock()'],
      correct: 2
    },
    {
      title: 'What vulnerability occurs when an attacker tricking a logged-in user into executing unwanted actions on a web application?',
      options: ['Cross-Site Scripting (XSS)', 'Cross-Site Request Forgery (CSRF)', 'SQL Injection (SQLi)', 'Buffer Overflow'],
      correct: 2
    },
    {
      title: 'In SQLite / PDO SQL queries, what is the role of placeholders like `?` or `:param`?',
      options: ['To speed up string parsing', 'To separate data from executable SQL commands safely', 'To encrypt database files on disk', 'To automatically count total rows'],
      correct: 2
    }
  ];

  for (const q of q1Data) {
    const qRes = await run(
      'INSERT INTO questions (exam_id, question_title, question_type) VALUES (?, ?, ?)',
      [exam1Id, q.title, 'mcq']
    );
    for (let i = 0; i < q.options.length; i++) {
      await run(
        'INSERT INTO options (question_id, option_number, option_title, is_correct) VALUES (?, ?, ?, ?)',
        [qRes.lastID, i + 1, q.options[i], (i + 1) === q.correct ? 1 : 0]
      );
    }
  }

  // 4. Seed Questions for Exam 2 (SEC-202)
  const q2Data = [
    {
      title: 'Which password hashing algorithm is recommended for securely storing user credentials?',
      options: ['MD5', 'SHA-1', 'Bcrypt / Argon2', 'Base64'],
      correct: 3
    },
    {
      title: 'What is IDOR (Insecure Direct Object Reference)?',
      options: ['Database syntax error', 'Vulnerability where an app exposes direct access to objects based on user-supplied input without authorization check', 'Hardware memory leak', 'CSS rendering bug'],
      correct: 2
    },
    {
      title: 'What feature automatically submits an online exam when anti-cheating tab-switching limits are breached?',
      options: ['Proctor Auto-Termination Engine', 'Garbage Collector', 'Session Timeout', 'CORS Guard'],
      correct: 1
    },
    {
      title: 'Why should user-uploaded profile photos undergo strict extension and MIME-type validation?',
      options: ['To preserve server storage', 'To prevent Remote Code Execution (RCE) via malicious script uploads', 'To force dark mode rendering', 'To speed up network requests'],
      correct: 2
    },
    {
      title: 'Which feature prevents text copying and right-click context menus during proctored tests?',
      options: ['e.preventDefault() on `contextmenu`, `copy`, and `selectstart`', 'CSS font-weight bold', 'Meta charset UTF-8', 'Database triggers'],
      correct: 1
    }
  ];

  for (const q of q2Data) {
    const qRes = await run(
      'INSERT INTO questions (exam_id, question_title, question_type) VALUES (?, ?, ?)',
      [exam2Id, q.title, 'mcq']
    );
    for (let i = 0; i < q.options.length; i++) {
      await run(
        'INSERT INTO options (question_id, option_number, option_title, is_correct) VALUES (?, ?, ?, ?)',
        [qRes.lastID, i + 1, q.options[i], (i + 1) === q.correct ? 1 : 0]
      );
    }
  }

  console.log('Seeded demo exams, questions, and options successfully!');
}

seed().catch(console.error);
