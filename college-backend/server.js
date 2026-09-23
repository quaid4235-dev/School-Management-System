require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const applicationRoutes = require('./routes/applications');
const studentRoutes = require('./routes/students');
const marksRoutes = require('./routes/marks');
const feeRoutes = require('./routes/fees');
const noticeRoutes = require('./routes/notices');
const contentRoutes = require('./routes/content');
const facultyRoutes = require('./routes/faculty');
const admissionCycleRoutes = require('./routes/admissionCycles');
const postRoutes = require('./routes/posts');

const app = express();

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.set('trust proxy', 1);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS origin is not allowed.'));
  },
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/marks', marksRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/admission-cycles', admissionCycleRoutes);
app.use('/api/posts', postRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use((err, req, res, next) => {
  if (err && err.message === 'CORS origin is not allowed.') {
    return res.status(403).json({ error: err.message });
  }
  return next(err);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
