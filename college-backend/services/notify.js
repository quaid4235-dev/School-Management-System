// ============================================================
// Notification service — sends email + SMS on key events.
// Uses SendGrid for email and Twilio for SMS as defaults; swap
// either out for a different provider (e.g. a local Pakistani
// SMS gateway) by editing the two send functions below.
//
// Nothing here works until you add real API keys to your .env
// file. Until then, these functions safely no-op and just log
// to the console so the rest of the app keeps working.
// ============================================================

let sgMail = null;
let twilioClient = null;

if (process.env.SENDGRID_API_KEY) {
  sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

async function sendEmail(to, subject, text) {
  if (!to) return;
  if (!sgMail) {
    console.log(`[email disabled — no SENDGRID_API_KEY] Would send to ${to}: ${subject}`);
    return;
  }
  await sgMail.send({ to, from: process.env.FROM_EMAIL, subject, text });
}

async function sendSMS(to, body) {
  if (!to) return;
  if (!twilioClient) {
    console.log(`[SMS disabled — no Twilio credentials] Would send to ${to}: ${body}`);
    return;
  }
  await twilioClient.messages.create({ to, from: process.env.TWILIO_FROM_NUMBER, body });
}

async function sendApplicationConfirmation({ email, studentName, classApplying }) {
  await sendEmail(
    email,
    'Application Received — Your College Name',
    `Dear Parent/Guardian,\n\nWe have received the application for ${studentName} (${classApplying}). Our admissions office will review it and contact you soon.\n\nThank you,\nYour College Name`
  );
}

async function notifyAdminNewApplication({ studentName, classApplying, phone }) {
  const adminEmail = process.env.FROM_EMAIL; // simplest default: notify the school's own inbox
  await sendEmail(
    adminEmail,
    'New Application Received',
    `A new application was submitted:\nStudent: ${studentName}\nClass: ${classApplying}\nContact: ${phone}\n\nReview it in the admin dashboard.`
  );
}

module.exports = { sendEmail, sendSMS, sendApplicationConfirmation, notifyAdminNewApplication };
