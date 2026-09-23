// Run with: npm run create-admin
// Prompts for a username and password, hashes it properly with
// bcrypt, and inserts (or updates) the admin user in the database.

require('dotenv').config();
const readline = require('readline');
const bcrypt = require('bcrypt');
const pool = require('../config/db');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

(async () => {
  console.log('=== Create Admin Account ===');
  const username = (await ask('Username [admin]: ')) || 'admin';
  const password = await ask('Password: ');
  const fullName = (await ask('Full name [Site Administrator]: ')) || 'Site Administrator';

  if (!password || password.length < 6) {
    console.error('Password must be at least 6 characters.');
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 10);

  try {
    await pool.query(
      `INSERT INTO users (username, password_hash, role, full_name)
       VALUES (?, ?, 'admin', ?)
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), full_name = VALUES(full_name)`,
      [username, hash, fullName]
    );
    console.log(`Admin account "${username}" created/updated successfully.`);
  } catch (err) {
    console.error('Failed to create admin:', err.message);
  } finally {
    rl.close();
    process.exit(0);
  }
})();
