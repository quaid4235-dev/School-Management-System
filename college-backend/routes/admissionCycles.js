const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM admission_cycles ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch admission cycles.' });
  }
});

router.post('/', requireAuth, requireRole('admin'), async (req, res) => {
  const { className, status, closingDate, formLink } = req.body;
  if (!className || !status) return res.status(400).json({ error: 'Class name and status are required.' });
  try {
    const [result] = await pool.query(
      'INSERT INTO admission_cycles (class_name, status, closing_date, form_link) VALUES (?,?,?,?)',
      [className, status, closingDate || null, formLink || null]
    );
    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create admission cycle entry.' });
  }
});

router.put('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const { className, status, closingDate, formLink } = req.body;
  try {
    await pool.query(
      'UPDATE admission_cycles SET class_name=?, status=?, closing_date=?, form_link=? WHERE id=?',
      [className, status, closingDate || null, formLink || null, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update admission cycle entry.' });
  }
});

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM admission_cycles WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete admission cycle entry.' });
  }
});

module.exports = router;
