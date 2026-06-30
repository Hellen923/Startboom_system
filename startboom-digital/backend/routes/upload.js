import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { fileURLToPath } from 'url';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { tenantAuth } from '../middleware/tenantAuth.js';

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeExt = ext && ext.length <= 10 ? ext : '';
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `upload-${unique}${safeExt}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (!file?.mimetype?.startsWith('image/')) {
    return cb(new Error('Only image uploads are allowed'));
  }
  return cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.get('/', (req, res) => {
  res.json({ status: 'ok', route: 'upload' });
});

// Error handling middleware for multer errors
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size exceeds 5MB limit' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ message: 'Unexpected file field' });
    }
    return res.status(400).json({ message: 'File upload error', error: err.message });
  }
  if (err) {
    // Handle fileFilter errors
    if (err.message === 'Only image uploads are allowed') {
      return res.status(400).json({ message: err.message });
    }
    return res.status(400).json({ message: 'Upload error', error: err.message });
  }
  next();
};

router.post('/', tenantAuth, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return handleMulterError(err, req, res, next);
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const publicPath = `/uploads/${req.file.filename}`;
    const proto = (req.headers['x-forwarded-proto'] || req.protocol || 'https').toString();
    const host = req.get('host');
    const baseUrl = host ? `${proto}://${host}` : '';

    return res.status(201).json({
      filename: req.file.filename,
      path: publicPath,
      url: baseUrl ? `${baseUrl}${publicPath}` : publicPath
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ message: 'Upload failed', error: error.message });
  }
});

export { router as uploadRoutes };
