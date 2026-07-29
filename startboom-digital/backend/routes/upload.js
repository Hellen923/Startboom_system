import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { tenantAuth } from '../middleware/tenantAuth.js';

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Use memory storage — file goes to Cloudinary, never touches disk
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (!file?.mimetype?.startsWith('image/')) {
      return cb(new Error('Only image uploads are allowed'));
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

router.get('/', (req, res) => {
  res.json({ status: 'ok', route: 'upload' });
});

router.post('/', tenantAuth, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File size exceeds 5MB limit' });
      }
      return res.status(400).json({ message: 'File upload error', error: err.message });
    }
    if (err) {
      return res.status(400).json({ message: err.message || 'Upload error' });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Upload buffer directly to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'honeypot-crm',
          resource_type: 'image',
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    return res.status(201).json({
      filename: result.public_id,
      path: result.secure_url,
      url: result.secure_url,
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return res.status(500).json({ message: 'Upload failed', error: error.message });
  }
});

export { router as uploadRoutes };
