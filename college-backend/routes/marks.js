const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Teacher enters/updates a mark for a student
router.post('/', requireAuth, requireRole('teacher', 'admin'), async (req, res) => {
  const { studentId, subject, term, marksObtained, totalMarks } = req.body;
  if (!studentId || !subject || !term || marksObtained === undefined) {
    return res.status(400).json({ error: 'Student, subject, term, and marks are required.' });
  }
  try {
    // One mark per student/subject/term — update if it already exists, else insert
    const [existing] = await pool.query(
      'SELECT id FROM marks WHERE student_id = ? AND subject = ? AND term = ?',
      [studentId, subject, term]
    );
    if (existing.length) {
      await pool.query(
        'UPDATE marks SET marks_obtained = ?, total_marks = ?, entered_by = ? WHERE id = ?',
        [marksObtained, totalMarks || 100, req.user.id, existing[0].id]
      );
      return res.json({ success: true, updated: true });
    }
    const [result] = await pool.query(
      `INSERT INTO marks (student_id, subject, term, marks_obtained, total_marks, entered_by)
       VALUES (?,?,?,?,?,?)`,
      [studentId, subject, term, marksObtained, totalMarks || 100, req.user.id]
    );
    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not save marks.' });
  }
});

// Marks for one student (used by admin dashboard / report card view)
router.get('/student/:studentId', requireAuth, requireRole('admin', 'frontdesk', 'teacher'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM marks WHERE student_id = ? ORDER BY term, subject',
      [req.params.studentId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch marks.' });
  }
});

// Whole class + subject, for a teacher's grading view
router.get('/class/:className', requireAuth, requireRole('admin', 'teacher'), async (req, res) => {
  const { term, subject } = req.query;
  try {
    const [students] = await pool.query('SELECT id, roll_number, full_name FROM students WHERE class = ? ORDER BY full_name', [req.params.className]);
    const [marks] = await pool.query(
      `SELECT * FROM marks WHERE student_id IN (SELECT id FROM students WHERE class = ?) AND term = ? AND subject = ?`,
      [req.params.className, term, subject]
    );
    const marksByStudent = Object.fromEntries(marks.map(m => [m.student_id, m]));
    res.json(students.map(s => ({ ...s, mark: marksByStudent[s.id] || null })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch class marks.' });
  }
});

router.delete('/:id', requireAuth, requireRole('admin', 'teacher'), async (req, res) => {
  try {
    await pool.query('DELETE FROM marks WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete mark.' });
  }
});

module.exports = router;
