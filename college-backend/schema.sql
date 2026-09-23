-- ============================================================
-- School Management System — MySQL Schema
-- Run this once against a fresh database, e.g.:
--   mysql -u your_user -p your_database < schema.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'teacher', 'frontdesk') NOT NULL DEFAULT 'frontdesk',
  full_name VARCHAR(100),
  email VARCHAR(120),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_name VARCHAR(120) NOT NULL,
  dob DATE,
  gender VARCHAR(20),
  class_applying VARCHAR(40) NOT NULL,
  previous_school VARCHAR(150),
  parent_name VARCHAR(120) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  email VARCHAR(120),
  address TEXT,
  message TEXT,
  document_path VARCHAR(255),          -- uploaded document (<1MB), e.g. B-form/birth certificate
  photo_path VARCHAR(255),             -- uploaded student photo (<1MB)
  status ENUM('pending','approved','rejected','waitlisted') DEFAULT 'pending',
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  application_id INT NULL,
  roll_number VARCHAR(30) NOT NULL UNIQUE,
  full_name VARCHAR(120) NOT NULL,
  dob DATE,
  gender VARCHAR(20),
  class VARCHAR(40) NOT NULL,
  section VARCHAR(10),
  parent_name VARCHAR(120),
  phone VARCHAR(30),
  email VARCHAR(120),
  address TEXT,
  admitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS fee_vouchers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  term VARCHAR(40) NOT NULL,            -- e.g. "September 2026"
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE,
  status ENUM('unpaid','paid') DEFAULT 'unpaid',
  paid_at TIMESTAMP NULL,
  payment_reference VARCHAR(100) NULL,  -- JazzCash/EasyPaisa transaction ID
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS marks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  subject VARCHAR(60) NOT NULL,
  term VARCHAR(40) NOT NULL,
  marks_obtained DECIMAL(5,2) NOT NULL,
  total_marks DECIMAL(5,2) NOT NULL DEFAULT 100,
  entered_by INT,                        -- teacher's user id
  entered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (entered_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Shown as "News" on the public homepage
CREATE TABLE IF NOT EXISTS notices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  body TEXT,
  published_at DATE NOT NULL,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Editable homepage text (hero, mission, stats) — key/value pairs
CREATE TABLE IF NOT EXISTS site_content (
  content_key VARCHAR(60) PRIMARY KEY,
  content_value TEXT
);

CREATE TABLE IF NOT EXISTS faculty (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  department VARCHAR(80) NOT NULL,
  qualification VARCHAR(150),
  photo_path VARCHAR(255),
  display_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS admission_cycles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  class_name VARCHAR(60) NOT NULL,
  status VARCHAR(60) NOT NULL,          -- e.g. "Open", "Closed — results announced", "Waitlist open"
  closing_date DATE,
  form_link VARCHAR(255)
);

-- Blog/events section
CREATE TABLE IF NOT EXISTS posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  body TEXT,
  cover_image_path VARCHAR(255),
  published_at DATE NOT NULL,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- No default admin user is seeded here on purpose — a guessed/copied
-- password hash is a security risk. Run `npm run create-admin` after
-- setup (see scripts/create-admin.js) to create the first admin account
-- interactively with a properly bcrypt-hashed password.
