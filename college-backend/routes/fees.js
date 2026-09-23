const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { initiatePayment, verifyPaymentWebhookSignature } = require('../services/payment');

const router = express.Router();

// Admin creates a fee voucher for a student
router.post('/', requireAuth, requireRole('admin'), async (req, res) => {
  const { studentId, term, amount, dueDate } = req.body;
  if (!studentId || !term || !amount) {
    return res.status(400).json({ error: 'Student, term, and amount are required.' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO fee_vouchers (student_id, term, amount, due_date) VALUES (?,?,?,?)',
      [studentId, term, amount, dueDate || null]
    );
    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create fee voucher.' });
  }
});

// List vouchers — for one student or everyone (admin overview)
router.get('/', requireAuth, requireRole('admin', 'frontdesk'), async (req, res) => {
  const { studentId, status } = req.query;
  let sql = `SELECT fv.*, s.full_name, s.roll_number, s.class FROM fee_vouchers fv
             JOIN students s ON s.id = fv.student_id WHERE 1=1`;
  const params = [];
  if (studentId) { sql += ' AND fv.student_id = ?'; params.push(studentId); }
  if (status && status !== 'all') { sql += ' AND fv.status = ?'; params.push(status); }
  sql += ' ORDER BY fv.due_date DESC';

  try {
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch fee vouchers.' });
  }
});

// Manually mark a voucher paid (e.g. cash/bank transfer confirmed by front desk)
router.patch('/:id/mark-paid', requireAuth, requireRole('admin', 'frontdesk'), async (req, res) => {
  const { paymentReference } = req.body;
  try {
    await pool.query(
      'UPDATE fee_vouchers SET status = "paid", paid_at = NOW(), payment_reference = ? WHERE id = ?',
      [paymentReference || 'manual', req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update voucher.' });
  }
});

// ---------------------------------------------
// Online payment (JazzCash/EasyPaisa/etc.) — parent-facing
// ---------------------------------------------

// Step 1: parent requests to pay a voucher online — returns a redirect URL/session
// from the payment gateway (see services/payment.js — needs your merchant keys).
router.post('/:id/pay', async (req, res) => {
  try {
    const [[voucher]] = await pool.query('SELECT * FROM fee_vouchers WHERE id = ?', [req.params.id]);
    if (!voucher) return res.status(404).json({ error: 'Voucher not found.' });
    if (voucher.status === 'paid') return res.status(400).json({ error: 'This voucher is already paid.' });

    const session = await initiatePayment({ voucherId: voucher.id, amount: voucher.amount });
    res.json(session); // { redirectUrl } or { error } if gateway keys aren't configured yet
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not start payment.' });
  }
});

// Step 2: gateway calls this webhook when payment completes.
// IMPORTANT: verifyPaymentWebhookSignature must be implemented for your
// chosen gateway before this can be trusted in production.
router.post('/webhook', async (req, res) => {
  const valid = verifyPaymentWebhookSignature(req);
  if (!valid) return res.status(401).json({ error: 'Invalid webhook signature.' });

  const { voucherId, transactionId, status } = req.body;
  try {
    if (status === 'success') {
      await pool.query(
        'UPDATE fee_vouchers SET status = "paid", paid_at = NOW(), payment_reference = ? WHERE id = ?',
        [transactionId, voucherId]
      );
    }
    res.json({ received: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Webhook processing failed.' });
  }
});

module.exports = router;
