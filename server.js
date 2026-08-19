const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { initDatabase } = require('./database');

const authRoutes = require('./routes/authRoutes');
const examRoutes = require('./routes/examRoutes');
const proctorRoutes = require('./routes/proctorRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure public/uploads directory exists
const uploadsDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Security Middleware (Configured to allow CDN scripts/styles for Tailwind/FontAwesome)
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve Static Frontend Assets
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/proctor', proctorRoutes);

// Fallback to Single-Page Application index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err);
  res.status(500).json({ success: false, error: 'Internal Server Error' });
});

// Start Server & Initialize Database
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 Online Examination & Proctoring Platform Server`);
    console.log(`🌐 Server running at: http://localhost:${PORT}`);
    console.log(`🛡️ Anti-Cheating & Tab-Switching Proctoring Active`);
    console.log(`====================================================`);
  });
}).catch(err => {
  console.error('Failed to start server:', err);
});
