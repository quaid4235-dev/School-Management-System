const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Public: latest notices for the homepage news list
router.get('/', async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 10;
  try {
    const [rows] = await pool.query(
      'SELECT id, title, body, published_at FROM notices ORDER BY published_at DESC LIMIT ?',
      [limit]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch notices.' });
  }
});

router.post('/', requireAuth, requireRole('admin'), async (req, res) => {
  const { title, body, publishedAt } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required.' });
  try {
    const [result] = await pool.query(
      'INSERT INTO notices (title, body, published_at, created_by) VALUES (?,?,?,?)',
      [title, body || null, publishedAt || new Date().toISOString().slice(0, 10), req.user.id]
    );
    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create notice.' });
  }
});

router.put('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const { title, body, publishedAt } = req.body;
  try {
    await pool.query('UPDATE notices SET title=?, body=?, published_at=? WHERE id=?', [title, body, publishedAt, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update notice.' });
  }
});

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM notices WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete notice.' });
  }
});

module.exports = router;
