const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { handleUpload } = require('../middleware/upload');

const router = express.Router();

router.get('/', async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 20;
  try {
    const [rows] = await pool.query('SELECT * FROM posts ORDER BY published_at DESC LIMIT ?', [limit]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch posts.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [[post]] = await pool.query('SELECT * FROM posts WHERE id = ?', [req.params.id]);
    if (!post) return res.status(404).json({ error: 'Post not found.' });
    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch post.' });
  }
});

router.post('/', requireAuth, requireRole('admin'), handleUpload([{ name: 'coverImage', maxCount: 1 }]), async (req, res) => {
  const { title, body, publishedAt } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required.' });
  const coverImagePath = req.files?.coverImage?.[0]?.filename || null;
  try {
    const [result] = await pool.query(
      'INSERT INTO posts (title, body, cover_image_path, published_at, created_by) VALUES (?,?,?,?,?)',
      [title, body || null, coverImagePath, publishedAt || new Date().toISOString().slice(0, 10), req.user.id]
    );
    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create post.' });
  }
});

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM posts WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete post.' });
  }
});

module.exports = router;
