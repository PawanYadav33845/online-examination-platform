const express = require('express');
const router = express.Router();
const { run, get, all } = require('../database');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// GET /api/exams - Fetch exams list for student
router.get('/', verifyToken, async (req, res) => {
  try {
    const exams = await all(`
      SELECT e.*, 
        (SELECT COUNT(*) FROM questions q WHERE q.exam_id = e.id) as question_count,
        (SELECT id FROM enrollments en WHERE en.exam_id = e.id AND en.user_id = ?) as enrollment_id,
        (SELECT attendance_status FROM enrollments en WHERE en.exam_id = e.id AND en.user_id = ?) as attendance_status,
        (SELECT total_score FROM enrollments en WHERE en.exam_id = e.id AND en.user_id = ?) as total_score
      FROM exams e
      ORDER BY e.id DESC
    `, [req.user.id, req.user.id, req.user.id]);

    res.json({ success: true, exams });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/exams/enroll/:id - Enroll student into exam
router.post('/enroll/:id', verifyToken, async (req, res) => {
  try {
    const examId = req.params.id;
    const userId = req.user.id;

    const exam = await get('SELECT * FROM exams WHERE id = ?', [examId]);
    if (!exam) {
      return res.status(404).json({ success: false, error: 'Exam not found.' });
    }

    const existing = await get('SELECT id FROM enrollments WHERE user_id = ? AND exam_id = ?', [userId, examId]);
    if (existing) {
      return res.status(400).json({ success: false, error: 'You are already enrolled in this exam.' });
    }

    await run('INSERT INTO enrollments (user_id, exam_id, attendance_status) VALUES (?, ?, ?)', [userId, examId, 'Absent']);

    // Pre-create answer slots for this student
    const questions = await all('SELECT id FROM questions WHERE exam_id = ?', [examId]);
    for (const q of questions) {
      await run(
        'INSERT OR IGNORE INTO student_answers (user_id, exam_id, question_id, user_answer_option, marks_obtained) VALUES (?, ?, ?, 0, 0)',
        [userId, examId, q.id]
      );
    }

    res.json({ success: true, message: 'Enrolled successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/exams/start/:code - Fetch active test questions & proctoring config
router.get('/start/:code', verifyToken, async (req, res) => {
  try {
    const code = req.params.code;
    const userId = req.user.id;

    const exam = await get('SELECT * FROM exams WHERE code = ?', [code]);
    if (!exam) {
      return res.status(404).json({ success: false, error: 'Exam code not found.' });
    }

    const enrollment = await get('SELECT * FROM enrollments WHERE user_id = ? AND exam_id = ?', [userId, exam.id]);
    if (!enrollment) {
      return res.status(403).json({ success: false, error: 'You are not enrolled in this exam.' });
    }

    // Check if exam is already submitted
    if (enrollment.submitted_at) {
      return res.json({
        success: true,
        already_submitted: true,
        exam,
        enrollment
      });
    }

    // Fetch questions without revealing correct answer flags
    const questions = await all('SELECT id, question_title, question_type FROM questions WHERE exam_id = ? ORDER BY id ASC', [exam.id]);
    for (const q of questions) {
      q.options = await all('SELECT id, option_number, option_title FROM options WHERE question_id = ? ORDER BY option_number ASC', [q.id]);
      
      // Get student's current saved answer
      const savedAnswer = await get('SELECT user_answer_option, is_marked_for_review FROM student_answers WHERE user_id = ? AND exam_id = ? AND question_id = ?', [userId, exam.id, q.id]);
      q.user_answer_option = savedAnswer ? savedAnswer.user_answer_option : 0;
      q.is_marked_for_review = savedAnswer ? savedAnswer.is_marked_for_review : 0;
    }

    // Get current total violations for student in this exam
    const violationCountRow = await get('SELECT COUNT(*) as count FROM violations WHERE user_id = ? AND exam_id = ?', [userId, exam.id]);
    const violationCount = violationCountRow ? violationCountRow.count : 0;

    res.json({
      success: true,
      already_submitted: false,
      exam,
      questions,
      violationCount,
      enrollment
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/exams/answer - Save answer or toggle mark for review
router.post('/answer', verifyToken, async (req, res) => {
  try {
    const { exam_id, question_id, option_number, is_marked_for_review } = req.body;
    const userId = req.user.id;

    // Verify enrollment
    const enrollment = await get('SELECT * FROM enrollments WHERE user_id = ? AND exam_id = ?', [userId, exam_id]);
    if (!enrollment || enrollment.submitted_at) {
      return res.status(400).json({ success: false, error: 'Exam is not active or already submitted.' });
    }

    await run(
      `INSERT INTO student_answers (user_id, exam_id, question_id, user_answer_option, is_marked_for_review, updated_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(user_id, exam_id, question_id) 
       DO UPDATE SET user_answer_option = COALESCE(?, user_answer_option), 
                     is_marked_for_review = COALESCE(?, is_marked_for_review),
                     updated_at = CURRENT_TIMESTAMP`,
      [userId, exam_id, question_id, option_number || 0, is_marked_for_review || 0, option_number, is_marked_for_review]
    );

    res.json({ success: true, message: 'Answer updated.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/exams/submit - Submit exam and calculate total score
router.post('/submit', verifyToken, async (req, res) => {
  try {
    const { exam_id, auto_submitted, reason } = req.body;
    const userId = req.user.id;

    const exam = await get('SELECT * FROM exams WHERE id = ?', [exam_id]);
    if (!exam) {
      return res.status(404).json({ success: false, error: 'Exam not found.' });
    }

    const enrollment = await get('SELECT * FROM enrollments WHERE user_id = ? AND exam_id = ?', [userId, exam_id]);
    if (!enrollment) {
      return res.status(400).json({ success: false, error: 'Not enrolled.' });
    }

    if (enrollment.submitted_at) {
      return res.json({ success: true, message: 'Already submitted.', total_score: enrollment.total_score });
    }

    // Evaluate answers
    const questions = await all('SELECT id FROM questions WHERE exam_id = ?', [exam_id]);
    let totalScore = 0;

    for (const q of questions) {
      const correctOption = await get('SELECT option_number FROM options WHERE question_id = ? AND is_correct = 1', [q.id]);
      const studentAns = await get('SELECT user_answer_option FROM student_answers WHERE user_id = ? AND exam_id = ? AND question_id = ?', [userId, exam_id, q.id]);

      let marksObtained = 0;
      if (studentAns && studentAns.user_answer_option > 0) {
        if (correctOption && studentAns.user_answer_option === correctOption.option_number) {
          marksObtained = exam.marks_per_right;
        } else {
          marksObtained = -Math.abs(exam.marks_per_wrong);
        }
      }

      totalScore += marksObtained;

      await run(
        'UPDATE student_answers SET marks_obtained = ? WHERE user_id = ? AND exam_id = ? AND question_id = ?',
        [marksObtained, userId, exam_id, q.id]
      );
    }

    // Update enrollment status
    await run(
      `UPDATE enrollments 
       SET attendance_status = 'Present', total_score = ?, submitted_at = CURRENT_TIMESTAMP, auto_submitted = ?
       WHERE user_id = ? AND exam_id = ?`,
      [totalScore, auto_submitted ? 1 : 0, userId, exam_id]
    );

    if (auto_submitted && reason) {
      await run(
        'INSERT INTO violations (user_id, exam_id, violation_type, details) VALUES (?, ?, ?, ?)',
        [userId, exam_id, 'AUTO_SUBMIT_TERMINATION', reason]
      );
    }

    res.json({
      success: true,
      message: auto_submitted ? `Exam auto-submitted: ${reason}` : 'Exam submitted successfully!',
      total_score: totalScore
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/exams/result/:exam_id - Get student scorecard breakdown
router.get('/result/:exam_id', verifyToken, async (req, res) => {
  try {
    const examId = req.params.exam_id;
    const userId = req.user.id;

    const exam = await get('SELECT * FROM exams WHERE id = ?', [examId]);
    const enrollment = await get('SELECT * FROM enrollments WHERE user_id = ? AND exam_id = ?', [userId, examId]);
    if (!exam || !enrollment) {
      return res.status(404).json({ success: false, error: 'Result not found.' });
    }

    const questions = await all('SELECT * FROM questions WHERE exam_id = ? ORDER BY id ASC', [examId]);
    for (const q of questions) {
      q.options = await all('SELECT * FROM options WHERE question_id = ? ORDER BY option_number ASC', [q.id]);
      const ans = await get('SELECT user_answer_option, marks_obtained FROM student_answers WHERE user_id = ? AND exam_id = ? AND question_id = ?', [userId, examId, q.id]);
      q.user_answer_option = ans ? ans.user_answer_option : 0;
      q.marks_obtained = ans ? ans.marks_obtained : 0;
    }

    const totalPossible = questions.length * exam.marks_per_right;

    res.json({
      success: true,
      exam,
      enrollment,
      questions,
      totalPossible
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================= ADMIN ROUTES =================

// GET /api/exams/admin/list - List all exams with admin summary metrics
router.get('/admin/list', verifyAdmin, async (req, res) => {
  try {
    const exams = await all(`
      SELECT e.*, 
        (SELECT COUNT(*) FROM questions q WHERE q.exam_id = e.id) as total_question,
        (SELECT COUNT(*) FROM enrollments en WHERE en.exam_id = e.id) as total_enrolled,
        (SELECT COUNT(*) FROM violations v WHERE v.exam_id = e.id) as total_violations
      FROM exams e
      ORDER BY e.id DESC
    `);
    res.json({ success: true, exams });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/exams/admin/create - Create new exam
router.post('/admin/create', verifyAdmin, async (req, res) => {
  try {
    const { title, description, code, start_datetime, duration_minutes, marks_per_right, marks_per_wrong, enable_proctoring, max_violations, enable_fullscreen } = req.body;

    if (!title || !code || !duration_minutes) {
      return res.status(400).json({ success: false, error: 'Title, exam code, and duration are required.' });
    }

    const existing = await get('SELECT id FROM exams WHERE code = ?', [code]);
    if (existing) {
      return res.status(400).json({ success: false, error: 'Exam code already exists.' });
    }

    const result = await run(
      `INSERT INTO exams 
       (title, description, code, start_datetime, duration_minutes, marks_per_right, marks_per_wrong, enable_proctoring, max_violations, enable_fullscreen, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Created')`,
      [title, description || '', code, start_datetime || new Date().toISOString(), duration_minutes, marks_per_right || 1, marks_per_wrong || 0, enable_proctoring ? 1 : 0, max_violations || 3, enable_fullscreen ? 1 : 0]
    );

    res.json({ success: true, message: 'Exam created successfully!', exam_id: result.lastID });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/exams/admin/add-question - Add question with options
router.post('/admin/add-question', verifyAdmin, async (req, res) => {
  try {
    const { exam_id, question_title, explanation, options, correct_option } = req.body;

    if (!exam_id || !question_title || !options || options.length < 2) {
      return res.status(400).json({ success: false, error: 'Question title and at least 2 options are required.' });
    }

    const qResult = await run(
      'INSERT INTO questions (exam_id, question_title, explanation) VALUES (?, ?, ?)',
      [exam_id, question_title, explanation || '']
    );
    const questionId = qResult.lastID;

    for (let i = 0; i < options.length; i++) {
      const optionNum = i + 1;
      const isCorrect = optionNum === parseInt(correct_option) ? 1 : 0;
      await run(
        'INSERT INTO options (question_id, option_number, option_title, is_correct) VALUES (?, ?, ?, ?)',
        [questionId, optionNum, options[i], isCorrect]
      );
    }

    // Update total question count in exam table
    const countRow = await get('SELECT COUNT(*) as cnt FROM questions WHERE exam_id = ?', [exam_id]);
    await run('UPDATE exams SET total_questions = ? WHERE id = ?', [countRow.cnt, exam_id]);

    res.json({ success: true, message: 'Question added successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/exams/admin/questions/:exam_id
router.get('/admin/questions/:exam_id', verifyAdmin, async (req, res) => {
  try {
    const questions = await all('SELECT * FROM questions WHERE exam_id = ? ORDER BY id ASC', [req.params.exam_id]);
    for (const q of questions) {
      q.options = await all('SELECT * FROM options WHERE question_id = ? ORDER BY option_number ASC', [q.id]);
    }
    res.json({ success: true, questions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/exams/admin/question/:id
router.delete('/admin/question/:id', verifyAdmin, async (req, res) => {
  try {
    const q = await get('SELECT exam_id FROM questions WHERE id = ?', [req.params.id]);
    if (q) {
      await run('DELETE FROM questions WHERE id = ?', [req.params.id]);
      const countRow = await get('SELECT COUNT(*) as cnt FROM questions WHERE exam_id = ?', [q.exam_id]);
      await run('UPDATE exams SET total_questions = ? WHERE id = ?', [countRow.cnt, q.exam_id]);
    }
    res.json({ success: true, message: 'Question deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/exams/admin/exam/:id
router.delete('/admin/exam/:id', verifyAdmin, async (req, res) => {
  try {
    await run('DELETE FROM exams WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Exam deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
