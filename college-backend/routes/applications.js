const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { handleUpload } = require('../middleware/upload');
const { sendApplicationConfirmation, notifyAdminNewApplication } = require('../services/notify');

const router = express.Router();

// ---------------------------------------------
// PUBLIC: submit an application (Play Group – Class 12)
// Accepts up to 2 files, each under 1MB: "document" and "photo"
// ---------------------------------------------
router.post(
  '/',
  handleUpload([{ name: 'document', maxCount: 1 }, { name: 'photo', maxCount: 1 }]),
  async (req, res) => {
    const {
      studentName, dob, gender, classApplying, previousSchool,
      parentName, phone, email, address, message
    } = req.body;

    if (!studentName || !classApplying || !parentName || !phone) {
      return res.status(400).json({ error: 'Please fill in all required fields.' });
    }

    const documentPath = req.files?.document?.[0]?.filename || null;
    const photoPath = req.files?.photo?.[0]?.filename || null;

    try {
      const [result] = await pool.query(
        `INSERT INTO applications
         (student_name, dob, gender, class_applying, previous_school, parent_name, phone, email, address, message, document_path, photo_path)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        [studentName, dob || null, gender || null, classApplying, previousSchool || null,
         parentName, phone, email || null, address || null, message || null, documentPath, photoPath]
      );

      // Fire-and-forget notifications — failures here should never block the applicant's response
      sendApplicationConfirmation({ email, studentName, classApplying }).catch(console.error);
      notifyAdminNewApplication({ studentName, classApplying, phone }).catch(console.error);

      res.status(201).json({ success: true, id: result.insertId });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not submit application. Please try again.' });
    }
  }
);

// ---------------------------------------------
// ADMIN / FRONTDESK: list applications (with filters)
// ---------------------------------------------
router.get('/', requireAuth, requireRole('admin', 'frontdesk'), async (req, res) => {
  const { status, classApplying } = req.query;
  let sql = 'SELECT * FROM applications WHERE 1=1';
  const params = [];

  if (status && status !== 'all') { sql += ' AND status = ?'; params.push(status); }
  if (classApplying && classApplying !== 'all') { sql += ' AND class_applying = ?'; params.push(classApplying); }
  sql += ' ORDER BY submitted_at DESC';

  try {
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch applications.' });
  }
});

// ---------------------------------------------
// ADMIN / FRONTDESK: export applications as CSV
// ---------------------------------------------
router.get('/export.csv', requireAuth, requireRole('admin', 'frontdesk'), async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM applications ORDER BY submitted_at DESC');
    const headers = ['id','student_name','dob','gender','class_applying','parent_name','phone','email','status','submitted_at'];
    const csvRows = [headers.join(',')];
    rows.forEach(r => {
      csvRows.push(headers.map(h => `"${(r[h] ?? '').toString().replace(/"/g, '""')}"`).join(','));
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="applications.csv"');
    res.send(csvRows.join('\n'));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not export applications.' });
  }
});

// ---------------------------------------------
// ADMIN: update single application status
// ---------------------------------------------
router.patch('/:id/status', requireAuth, requireRole('admin', 'frontdesk'), async (req, res) => {
  const { status } = req.body;
  if (!['pending', 'approved', 'rejected', 'waitlisted'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }
  try {
    await pool.query('UPDATE applications SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update status.' });
  }
});

// ---------------------------------------------
// ADMIN: bulk status update — { ids: [1,2,3], status: 'approved' }
// ---------------------------------------------
router.patch('/bulk-status', requireAuth, requireRole('admin', 'frontdesk'), async (req, res) => {
  const { ids, status } = req.body;
  if (!Array.isArray(ids) || !ids.length || !['pending','approved','rejected','waitlisted'].includes(status)) {
    return res.status(400).json({ error: 'Invalid request.' });
  }
  try {
    await pool.query(
      `UPDATE applications SET status = ? WHERE id IN (${ids.map(() => '?').join(',')})`,
      [status, ...ids]
    );
    res.json({ success: true, updated: ids.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Bulk update failed.' });
  }
});

// ---------------------------------------------
// ADMIN: convert an approved application into a student record
// ---------------------------------------------
router.post('/:id/convert-to-student', requireAuth, requireRole('admin'), async (req, res) => {
  const { rollNumber, section } = req.body;
  if (!rollNumber) return res.status(400).json({ error: 'Roll number is required.' });

  try {
    const [rows] = await pool.query('SELECT * FROM applications WHERE id = ?', [req.params.id]);
    const app = rows[0];
    if (!app) return res.status(404).json({ error: 'Application not found.' });

    const [result] = await pool.query(
      `INSERT INTO students
       (application_id, roll_number, full_name, dob, gender, class, section, parent_name, phone, email, address)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [app.id, rollNumber, app.student_name, app.dob, app.gender, app.class_applying, section || null,
       app.parent_name, app.phone, app.email, app.address]
    );

    await pool.query('UPDATE applications SET status = "approved" WHERE id = ?', [app.id]);
    res.status(201).json({ success: true, studentId: result.insertId });
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'That roll number is already in use.' });
    res.status(500).json({ error: 'Could not convert application to student record.' });
  }
});

// ---------------------------------------------
// ADMIN: delete an application
// ---------------------------------------------
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM applications WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete application.' });
  }
});

module.exports = router;
