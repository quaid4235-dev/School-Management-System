const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

const DEFAULTS = {
  heroEyebrow: 'Est. 20XX',
  heroTitle: 'Building character, discipline, and academic excellence',
  heroLede: 'Your College Name prepares students through rigorous academics, structured discipline, and a faculty committed to developing capable, principled graduates.',
  missionText: 'Since 2004, Your College Name has combined rigorous academics with structured discipline to prepare students for university, the professions, and civic life.',
  statStudents: '1,340',
  statFaculty: '68',
  statDepartments: '9',
  statLibrary: '12,400+'
};

// Public: homepage reads this
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT content_key, content_value FROM site_content');
    const content = { ...DEFAULTS };
    rows.forEach(r => { content[r.content_key] = r.content_value; });
    res.json(content);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch site content.' });
  }
});

// Admin: save any number of key/value pairs at once, e.g. { heroTitle: "...", statStudents: "1400" }
router.put('/', requireAuth, requireRole('admin'), async (req, res) => {
  const entries = Object.entries(req.body || {});
  if (!entries.length) return res.status(400).json({ error: 'No content provided.' });

  try {
    for (const [key, value] of entries) {
      await pool.query(
        `INSERT INTO site_content (content_key, content_value) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE content_value = VALUES(content_value)`,
        [key, String(value)]
      );
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not save content.' });
  }
});

module.exports = router;
