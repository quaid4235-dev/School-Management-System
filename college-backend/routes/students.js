const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// List students — admin/frontdesk see all, teachers filter by class via query
router.get('/', requireAuth, requireRole('admin', 'frontdesk', 'teacher'), async (req, res) => {
  const { class: className, section } = req.query;
  let sql = 'SELECT * FROM students WHERE 1=1';
  const params = [];
  if (className) { sql += ' AND class = ?'; params.push(className); }
  if (section) { sql += ' AND section = ?'; params.push(section); }
  sql += ' ORDER BY class, section, full_name';

  try {
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch students.' });
  }
});

// Single student — includes marks + fee history
router.get('/:id', requireAuth, requireRole('admin', 'frontdesk', 'teacher'), async (req, res) => {
  try {
    const [[student]] = await pool.query('SELECT * FROM students WHERE id = ?', [req.params.id]);
    if (!student) return res.status(404).json({ error: 'Student not found.' });

    const [marks] = await pool.query('SELECT * FROM marks WHERE student_id = ? ORDER BY term, subject', [req.params.id]);
    const [fees] = await pool.query('SELECT * FROM fee_vouchers WHERE student_id = ? ORDER BY due_date DESC', [req.params.id]);

    res.json({ ...student, marks, fees });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch student.' });
  }
});

// Create a student directly (not via application conversion) — e.g. transfer students
router.post('/', requireAuth, requireRole('admin'), async (req, res) => {
  const { rollNumber, fullName, dob, gender, className, section, parentName, phone, email, address } = req.body;
  if (!rollNumber || !fullName || !className) {
    return res.status(400).json({ error: 'Roll number, full name, and class are required.' });
  }
  try {
    const [result] = await pool.query(
      `INSERT INTO students (roll_number, full_name, dob, gender, class, section, parent_name, phone, email, address)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [rollNumber, fullName, dob || null, gender || null, className, section || null, parentName || null, phone || null, email || null, address || null]
    );
    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'That roll number is already in use.' });
    res.status(500).json({ error: 'Could not create student.' });
  }
});

// Update student details
router.put('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const { fullName, dob, gender, className, section, parentName, phone, email, address } = req.body;
  try {
    await pool.query(
      `UPDATE students SET full_name=?, dob=?, gender=?, class=?, section=?, parent_name=?, phone=?, email=?, address=?
       WHERE id = ?`,
      [fullName, dob || null, gender || null, className, section || null, parentName || null, phone || null, email || null, address || null, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update student.' });
  }
});

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM students WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete student.' });
  }
});

module.exports = router;
