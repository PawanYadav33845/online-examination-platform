const express = require('express');
const router = express.Router();
const { run, all } = require('../database');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// POST /api/proctor/violation - Record anti-cheating violation during exam
router.post('/violation', verifyToken, async (req, res) => {
  try {
    const { exam_id, violation_type, details } = req.body;
    const userId = req.user.id;
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || '';

    if (!exam_id || !violation_type) {
      return res.status(400).json({ success: false, error: 'Exam ID and violation type are required.' });
    }

    const result = await run(
      `INSERT INTO violations (user_id, exam_id, violation_type, details, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, exam_id, violation_type, details || '', ip, userAgent]
    );

    // Get current total violation count for this user & exam
    const countRows = await all('SELECT COUNT(*) as count FROM violations WHERE user_id = ? AND exam_id = ?', [userId, exam_id]);
    const currentCount = countRows[0] ? countRows[0].count : 1;

    res.json({
      success: true,
      message: 'Violation recorded.',
      current_count: currentCount,
      violation_id: result.lastID
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/proctor/admin/logs - Fetch all proctoring violation logs for admin dashboard
router.get('/admin/logs', verifyAdmin, async (req, res) => {
  try {
    const logs = await all(`
      SELECT v.*, u.name as user_name, u.email as user_email, u.image as user_image, e.title as exam_title, e.code as exam_code, e.max_violations
      FROM violations v
      JOIN users u ON v.user_id = u.id
      JOIN exams e ON v.exam_id = e.id
      ORDER BY v.id DESC
      LIMIT 200
    `);

    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/proctor/admin/stats - Audit statistics summary
router.get('/admin/stats', verifyAdmin, async (req, res) => {
  try {
    const totalUsers = await all("SELECT COUNT(*) as cnt FROM users WHERE role = 'student'");
    const totalExams = await all('SELECT COUNT(*) as cnt FROM exams');
    const totalViolations = await all('SELECT COUNT(*) as cnt FROM violations');
    const autoSubmissions = await all('SELECT COUNT(*) as cnt FROM enrollments WHERE auto_submitted = 1');

    res.json({
      success: true,
      stats: {
        total_students: totalUsers[0] ? totalUsers[0].cnt : 0,
        total_exams: totalExams[0] ? totalExams[0].cnt : 0,
        total_violations: totalViolations[0] ? totalViolations[0].cnt : 0,
        auto_submissions: autoSubmissions[0] ? autoSubmissions[0].cnt : 0
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
