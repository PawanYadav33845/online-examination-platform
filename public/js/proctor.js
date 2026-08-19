/**
 * Anti-Cheating Proctoring Engine
 * Monitors browser tab switching, window defocus, fullscreen exit, right-click, and copy-paste shortcuts.
 * Includes permission grace period, event debouncing, and standalone GitHub Pages fallback logging.
 */

window.ProctorEngine = {
  examId: null,
  maxViolations: 3,
  currentViolations: 0,
  enableProctoring: true,
  enableFullscreen: true,
  isExamActive: false,
  isRequestingPermission: false,
  lastViolationTime: 0,
  gracePeriodEndTime: 0,
  stream: null,

  init(config) {
    this.examId = config.examId;
    this.maxViolations = config.maxViolations || 3;
    this.currentViolations = config.initialViolations || 0;
    this.enableProctoring = config.enableProctoring !== undefined ? config.enableProctoring : true;
    this.enableFullscreen = config.enableFullscreen !== undefined ? config.enableFullscreen : true;
    this.isExamActive = false; // Stay inactive during setup/permissions

    if (!this.enableProctoring) return;

    this.attachEventListeners();
    this.updateViolationBadge();
  },

  startExamSession() {
    this.isExamActive = true;
    // Set 5-second initial grace period after clicking Start
    this.gracePeriodEndTime = Date.now() + 5000;

    if (this.enableFullscreen) {
      this.requestFullscreen();
    }
  },

  attachEventListeners() {
    const self = this;

    // 1. Tab switching detection (Visibility API)
    document.addEventListener('visibilitychange', function () {
      if (self.isExamActive && !self.isRequestingPermission && document.hidden) {
        self.triggerViolation('TAB_SWITCH', 'Switched browser tab or minimized window.');
      }
    });

    // 2. Window Defocus / Alt+Tab / Screen Splitting
    window.addEventListener('blur', function () {
      if (self.isExamActive && !self.isRequestingPermission) {
        self.triggerViolation('WINDOW_DEFOCUS', 'Lost window focus (clicked outside or switched application).');
      }
    });

    // 3. Fullscreen Exit Detection
    document.addEventListener('fullscreenchange', function () {
      if (self.isExamActive && !self.isRequestingPermission && self.enableFullscreen && !document.fullscreenElement) {
        self.triggerViolation('FULLSCREEN_EXIT', 'Exited fullscreen examination mode.');
      }
    });

    // 4. Disable Right-Click Context Menu
    document.addEventListener('contextmenu', function (e) {
      if (self.isExamActive) {
        e.preventDefault();
        self.showWarningToast('Right-click is disabled during the exam.');
      }
    });

    // 5. Disable Copy / Cut / Paste & DevTools Shortcuts
    document.addEventListener('keydown', function (e) {
      if (!self.isExamActive) return;

      // F12, Ctrl+Shift+I/J/C, Ctrl+C/V/X/U/P
      if (
        e.keyCode === 123 ||
        (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) ||
        (e.ctrlKey && (e.keyCode === 67 || e.keyCode === 86 || e.keyCode === 88 || e.keyCode === 85 || e.keyCode === 80))
      ) {
        e.preventDefault();
        self.triggerViolation('FORBIDDEN_SHORTCUT', `Attempted keyboard shortcut (Key code: ${e.keyCode}).`);
      }
    });

    // 6. Disable Text Selection
    document.addEventListener('selectstart', function (e) {
      if (self.isExamActive) {
        e.preventDefault();
      }
    });
  },

  async triggerViolation(type, details) {
    const now = Date.now();

    if (!this.isExamActive || this.isRequestingPermission || now < this.gracePeriodEndTime) {
      return;
    }

    if (now - this.lastViolationTime < 2500) {
      return; // Debounce rapid multi-events
    }

    this.lastViolationTime = now;
    this.currentViolations++;
    this.playWarningBeep();
    this.updateViolationBadge();

    // Log violation to backend or localStorage
    if (window.App && window.App.isMockMode) {
      const logs = JSON.parse(localStorage.getItem('mock_logs') || '[]');
      const user = window.App.currentUser || { name: 'Demo Student', email: 'student@exam.com' };
      logs.unshift({
        id: Date.now(),
        user_name: user.name,
        user_email: user.email,
        exam_title: (window.App.activeExam ? window.App.activeExam.title : 'Active Exam'),
        violation_type: type,
        details: details,
        logged_at: new Date().toISOString()
      });
      localStorage.setItem('mock_logs', JSON.stringify(logs));
    } else {
      try {
        await fetch('api/proctor/violation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exam_id: this.examId,
            violation_type: type,
            details: details
          })
        });
      } catch (err) {}
    }

    if (this.currentViolations >= this.maxViolations) {
      this.isExamActive = false;
      this.showAutoSubmitModal(details);
    } else {
      this.showWarningModal(type, details);
    }
  },

  updateViolationBadge() {
    const badge = document.getElementById('proctor-violation-badge');
    if (badge) {
      badge.innerText = `Warnings: ${this.currentViolations} / ${this.maxViolations}`;
      if (this.currentViolations > 0) {
        badge.className = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-600 text-white animate-pulse';
      }
    }
  },

  playWarningBeep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {}
  },

  requestFullscreen() {
    const docEl = document.documentElement;
    if (docEl.requestFullscreen) {
      docEl.requestFullscreen().catch(() => {});
    } else if (docEl.mozRequestFullScreen) {
      docEl.mozRequestFullScreen().catch(() => {});
    } else if (docEl.webkitRequestFullscreen) {
      docEl.webkitRequestFullscreen().catch(() => {});
    }
  },

  async startCameraPreview(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return false;

    this.isRequestingPermission = true;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      this.isRequestingPermission = false;

      const video = document.createElement('video');
      video.srcObject = this.stream;
      video.autoplay = true;
      video.muted = true;
      video.className = 'w-full h-36 object-cover rounded-xl border-2 border-indigo-500 shadow-md';
      container.innerHTML = '';
      container.appendChild(video);
      return true;
    } catch (err) {
      this.isRequestingPermission = false;
      container.innerHTML = `
        <div class="bg-amber-100 border border-amber-400 text-amber-900 text-xs p-3 rounded-xl text-center">
          <i class="fas fa-video-slash text-base mb-1 block text-amber-600"></i>
          <span class="font-bold">Camera Access Optional/Unavailable</span>
          <p class="text-[11px] mt-1 text-amber-700">You can still proceed with the examination.</p>
        </div>
      `;
      return false;
    }
  },

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
  },

  showWarningModal(type, details) {
    const modalHtml = `
      <div id="proctor-warning-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-red-500 transform transition-all scale-100">
          <div class="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl animate-bounce">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <h3 class="text-xl font-extrabold text-center text-slate-900 dark:text-white mb-2">Proctoring Warning Alert</h3>
          <p class="text-slate-600 dark:text-slate-300 text-sm text-center mb-4">
            ${details}
          </p>
          <div class="bg-red-50 dark:bg-red-950/40 p-3 rounded-xl border border-red-200 dark:border-red-800 text-center mb-5">
            <span class="text-xs text-red-700 dark:text-red-300 font-medium">Violation Warning:</span>
            <span class="text-lg font-black text-red-600 dark:text-red-400 ml-2">${this.currentViolations} / ${this.maxViolations}</span>
            <p class="text-xs text-red-500 mt-1">Reaching maximum limit will auto-terminate the exam.</p>
          </div>
          <button id="proctor-warning-ack" class="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg transition">
            I Understand & Resume Exam
          </button>
        </div>
      </div>
    `;

    const oldModal = document.getElementById('proctor-warning-modal');
    if (oldModal) oldModal.remove();

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    document.getElementById('proctor-warning-ack').addEventListener('click', () => {
      document.getElementById('proctor-warning-modal').remove();
      this.gracePeriodEndTime = Date.now() + 3000;
      if (this.enableFullscreen) this.requestFullscreen();
    });
  },

  showAutoSubmitModal(reason) {
    const modalHtml = `
      <div id="proctor-autosubmit-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 backdrop-blur-md">
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl border-2 border-red-600 text-center">
          <div class="w-20 h-20 bg-red-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-lg">
            <i class="fas fa-lock"></i>
          </div>
          <h2 class="text-2xl font-black text-slate-900 dark:text-white mb-2">Test Terminated</h2>
          <p class="text-red-600 dark:text-red-400 font-semibold mb-4">Academic Integrity Threshold Exceeded</p>
          <p class="text-slate-600 dark:text-slate-300 text-sm mb-6">
            ${reason} Maximum violation limit (${this.maxViolations}) reached. Your exam is being automatically submitted now.
          </p>
          <button id="proctor-autosubmit-btn" class="w-full py-3 bg-slate-900 text-white font-bold rounded-xl shadow-md">
            Submitting Answers...
          </button>
        </div>
      </div>
    `;

    const old = document.getElementById('proctor-autosubmit-modal');
    if (old) old.remove();

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    if (window.App && window.App.submitExamFinal) {
      window.App.submitExamFinal(true, reason);
    }
  },

  showWarningToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-3 text-sm border border-slate-700 animate-bounce';
    toast.innerHTML = `<i class="fas fa-shield-alt text-amber-400"></i><span>${msg}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }
};
