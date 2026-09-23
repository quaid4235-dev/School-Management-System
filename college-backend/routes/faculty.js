const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { handleUpload } = require('../middleware/upload');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM faculty ORDER BY display_order, full_name');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch faculty.' });
  }
});

router.post('/', requireAuth, requireRole('admin'), handleUpload([{ name: 'photo', maxCount: 1 }]), async (req, res) => {
  const { fullName, department, qualification, displayOrder } = req.body;
  if (!fullName || !department) return res.status(400).json({ error: 'Name and department are required.' });
  const photoPath = req.files?.photo?.[0]?.filename || null;
  try {
    const [result] = await pool.query(
      'INSERT INTO faculty (full_name, department, qualification, photo_path, display_order) VALUES (?,?,?,?,?)',
      [fullName, department, qualification || null, photoPath, displayOrder || 0]
    );
    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not add faculty member.' });
  }
});

router.put('/:id', requireAuth, requireRole('admin'), handleUpload([{ name: 'photo', maxCount: 1 }]), async (req, res) => {
  const { fullName, department, qualification, displayOrder } = req.body;
  const photoPath = req.files?.photo?.[0]?.filename;
  try {
    if (photoPath) {
      await pool.query(
        'UPDATE faculty SET full_name=?, department=?, qualification=?, display_order=?, photo_path=? WHERE id=?',
        [fullName, department, qualification, displayOrder || 0, photoPath, req.params.id]
      );
    } else {
      await pool.query(
        'UPDATE faculty SET full_name=?, department=?, qualification=?, display_order=? WHERE id=?',
        [fullName, department, qualification, displayOrder || 0, req.params.id]
      );
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update faculty member.' });
  }
});

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM faculty WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete faculty member.' });
  }
});

module.exports = router;
