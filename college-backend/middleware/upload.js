const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const MAX_FILE_SIZE = 1 * 1024 * 1024 - 1; // strictly under 1MB, per requirement

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const allowedTypes = ['.jpg', '.jpeg', '.png', '.pdf', '.webp'];

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedTypes.includes(ext)) {
    return cb(new Error('Only JPG, PNG, WEBP, or PDF files are allowed.'));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE }
});

// Wrap multer so oversized/invalid files return a clean JSON error
// instead of crashing the request.
function handleUpload(fieldConfigs) {
  const mw = upload.fields(fieldConfigs); // e.g. [{ name: 'document', maxCount: 1 }, { name: 'photo', maxCount: 1 }]
  return (req, res, next) => {
    mw(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File too large — each file must be under 1MB.' });
        }
        return res.status(400).json({ error: err.message });
      } else if (err) {
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  };
}

module.exports = { handleUpload, uploadDir, MAX_FILE_SIZE };
