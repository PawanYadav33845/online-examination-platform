const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const { run, get } = require('../database');
const { verifyToken, JWT_SECRET } = require('../middleware/auth');

// Multer storage configuration for user avatars
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/uploads/'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: function (req, file, cb) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid image file type. Only JPEG, PNG, WEBP allowed.'));
    }
  }
});

// POST /api/auth/register
router.post('/register', upload.single('user_image'), async (req, res) => {
  try {
    const { email, password, name, gender, address, mobile, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ success: false, error: 'Email, password, and name are required.' });
    }

    const existingUser = await get('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email address is already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const avatar = req.file ? req.file.filename : 'default.jpg';
    const userRole = role === 'admin' ? 'admin' : 'student';

    const result = await run(
      `INSERT INTO users (email, password, name, gender, address, mobile, image, role) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [email, hashedPassword, name, gender || 'Male', address || '', mobile || '', avatar, userRole]
    );

    res.json({ success: true, message: 'Registration successful! Please login.' });
  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const user = await get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid email address or password.' });
    }

    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) {
      return res.status(400).json({ success: false, error: 'Invalid email address or password.' });
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '12h' });

    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 12 * 60 * 60 * 1000, // 12 hours
      sameSite: 'strict'
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        gender: user.gender,
        address: user.address,
        mobile: user.mobile,
        image: user.image,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await get('SELECT id, email, name, gender, address, mobile, image, role, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/update-profile
router.post('/update-profile', verifyToken, upload.single('user_image'), async (req, res) => {
  try {
    const { name, gender, address, mobile } = req.body;
    let imageFilename = undefined;

    if (req.file) {
      imageFilename = req.file.filename;
    }

    if (imageFilename) {
      await run(
        `UPDATE users SET name = ?, gender = ?, address = ?, mobile = ?, image = ? WHERE id = ?`,
        [name, gender, address, mobile, imageFilename, req.user.id]
      );
    } else {
      await run(
        `UPDATE users SET name = ?, gender = ?, address = ?, mobile = ? WHERE id = ?`,
        [name, gender, address, mobile, req.user.id]
      );
    }

    const updatedUser = await get('SELECT id, email, name, gender, address, mobile, image, role FROM users WHERE id = ?', [req.user.id]);
    res.json({ success: true, message: 'Profile updated successfully!', user: updatedUser });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully.' });
});

module.exports = router;
