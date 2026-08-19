# 🛡️ Online Examination & Anti-Cheating Proctoring Platform

A modern, high-performance, and secure **Online Examination Platform** built with **Node.js, Express, SQLite, and Tailwind CSS**. Features an anti-cheating proctoring engine with browser tab and window switching detection, fullscreen locking, input restriction guards, real-time warning counters, and auto-submission on violation limits.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-v22%2B-green.svg)
![Database](https://img.shields.io/badge/Database-SQLite3-blue.svg)
![GitHub Actions](https://img.shields.io/badge/CI%2FCD-GitHub%20Pages-orange.svg)

---

## ✨ Features & Highlights

### 🛡️ Anti-Cheating & Proctoring Engine
- **Tab Switching Detection**: Uses HTML5 `visibilitychange` API to log when a student leaves or minimizes the browser tab.
- **Window Defocus Tracking**: Uses `window.onblur` to track Alt+Tab, splitting screens, or clicking on external software.
- **Permission-Prompt Protection & Grace Period**: Ignores focus loss during browser permission dialogs (e.g. camera prompts) and grants a 5-second grace period upon starting the exam.
- **Shortcut & Input Guard**: Blocks right-click context menu, text selection, and shortcuts (`Ctrl+C`, `Ctrl+V`, `Ctrl+X`, `F12`).
- **Auto-Submission**: Automatically terminates and submits the test if the student breaches the maximum violation limit (e.g. 3 warnings).
- **Live Camera Feed**: Optional video preview (`getUserMedia`) displayed on the exam container.

### 🎨 Modern Responsive GUI & Experience
- **Tailwind CSS + FontAwesome 6**: Modern glassmorphism UI with dark/light mode toggle.
- **Interactive Question Palette**: Color-coded question grid (Answered [Green], Marked for Review [Yellow], Current [Blue], Unanswered [Gray]).
- **Scorecard & Certificates**: Printable exam performance certificate with detailed question-by-question review.

### ⚙️ Admin Management Console
- **Dashboard Analytics**: Overview of total exams, registered students, tab-switching violations, and auto-terminations.
- **Exam & Question Builder**: Create proctored tests, customize violation limits, negative marking, and question options.
- **Real-Time Proctoring Audit Logs**: Audit table detailing student name, violation event, timestamp, and IP address.

---

## 🔑 Pre-Configured Demo Credentials

Run `npm run seed` to automatically seed demo data:

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@exam.com` | `admin123` | Full access to Exam Builder, Question Editor & Live Violation Audit Console |
| **Student 1** | `student@exam.com` | `student123` | Enrolled in demo exams with full student capabilities |
| **Student 2** | `pawan@exam.com` | `pawan123` | Student access for testing |

---

## 🚀 Quickstart (Local Development)

No XAMPP or external database required! The project uses an embedded SQLite database.

```bash
# 1. Install dependencies
npm install

# 2. Seed database with demo data & exams
npm run seed

# 3. Start local server
npm start

# Access application at: http://localhost:3000
```

---

## 🌐 Deploying to GitHub Pages

This repository includes a pre-configured **GitHub Actions Workflow** ([`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml)) for automated deployment of the static frontend interface to GitHub Pages.

### Step-by-Step GitHub Pages Setup:

1. **Push Code to GitHub**:
   Push this repository to your GitHub account on the `main` or `master` branch.
   ```bash
   git add .
   git commit -m "Add modern online exam platform & GitHub Pages workflow"
   git push origin main
   ```

2. **Enable GitHub Pages in Repository Settings**:
   - Go to your repository on GitHub.
   - Click on **Settings** -> **Pages** (under Code and automation).
   - Under **Build and deployment** -> **Source**, select **GitHub Actions**.

3. **Automated CI/CD Deployment**:
   - The GitHub Action will automatically trigger on push to `main` / `master`.
   - Once completed, your web interface will be live at:
     `https://<your-username>.github.io/<repository-name>/`

---

## 📂 Project Structure

```
├── .github/
│   └── workflows/
│       └── deploy-pages.yml    # GitHub Actions workflow for GitHub Pages
├── database.js                 # SQLite connection & 100% prepared SQL statements
├── middleware/
│   └── auth.js                 # JWT & Admin authorization middleware
├── public/
│   ├── index.html              # Main single-page application template
│   └── js/
│       ├── app.js              # Client UI router & interactive component script
│       └── proctor.js          # Anti-cheating proctoring engine
├── routes/
│   ├── authRoutes.js           # Login, register, profile routes
│   ├── examRoutes.js           # Exam CRUD, testing, grading routes
│   └── proctorRoutes.js        # Violation logging & admin audit routes
├── package.json                # Dependencies & npm scripts
├── seed.js                     # Pre-populates demo exams & users
└── server.js                   # Express server entry point
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
