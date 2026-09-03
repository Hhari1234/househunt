// Image storage driver.
//
// Local development and tests store uploads on disk (STORAGE_DRIVER=disk,
// the default) under backend/public/uploads. Production hosting platforms
// (e.g. Vercel) use an ephemeral filesystem, so property photos are stored in
// MongoDB via GridFS (STORAGE_DRIVER=gridfs) — they survive every
// restart/redeploy and need no separate object-storage account.
//
// Both drivers expose the same surface:
//   - uploadMiddleware        multer middleware (array field "images")
//   - listSavedUrls(req)      -> ["/uploads/<name-or-id>", ...]
//   - openSaved(req, key)     -> { stream, contentType, filename } | null

const path = require('path');
const fs = require('fs');
const multer = require('multer');
const mongoose = require('mongoose');

const DRIVER = process.env.STORAGE_DRIVER === 'gridfs' ? 'gridfs' : 'disk';
// Vercel Functions cap the request body at 4.5 MB; compressed listing photos
// are well under 4 MB. Disk (local dev) keeps a more generous limit.
const MAX_FILE_BYTES = DRIVER === 'gridfs' ? 4 * 1024 * 1024 : 8 * 1024 * 1024;
const UPLOAD_DIR = path.join(__dirname, '..', 'public', 'uploads');

const CONTENT_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
};

const fileFilter = (req, file, cb) => {
  if (file.mimetype && file.mimetype.startsWith('image/')) return cb(null, true);
  return cb(new Error('Only image uploads are allowed'));
};

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function makeDiskStorage() {
  ensureUploadDir();
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
  });
}

let gridfsBucket = null;
function getBucket() {
  if (!gridfsBucket) {
    gridfsBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'uploads',
    });
  }
  return gridfsBucket;
}

const isObjectId = (value) => /^[0-9a-fA-F]{24}$/.test(value);

const imageStore = {
  driver: DRIVER,

  // multer accepts up to 10 files in the "images" field
  uploadMiddleware:
    DRIVER === 'gridfs'
      ? multer({
          storage: multer.memoryStorage(),
          fileFilter,
          limits: { fileSize: MAX_FILE_BYTES },
        }).array('images', 10)
      : multer({
          storage: makeDiskStorage(),
          fileFilter,
          limits: { fileSize: MAX_FILE_BYTES },
        }).array('images', 10),

  /** Turn multer's parsed files into stored public keys (/uploads/...). */
  async listSavedUrls(req) {
    if (!req.files || req.files.length === 0) return [];
    if (DRIVER === 'gridfs') {
      const bucket = getBucket();
      const urls = [];
      for (const file of req.files) {
        const uploadStream = bucket.openUploadStream(file.originalname, {
          contentType: file.mimetype || 'application/octet-stream',
        });
        await new Promise((resolve, reject) => {
          uploadStream.once('finish', () => resolve());
          uploadStream.once('error', (err) => reject(err));
          uploadStream.end(file.buffer);
        });
        urls.push(`/uploads/${uploadStream.id.toString()}`);
      }
      return urls;
    }
    // Disk driver — multer already wrote the files
    return req.files.map((file) => `/uploads/${file.filename}`);
  },

  /**
   * Open a stored image for streaming.
   * @param {string} key  filename (disk) or GridFS object id (gridfs)
   */
  async openSaved(key) {
    if (!key) return null;
    if (DRIVER === 'gridfs') {
      if (!isObjectId(key)) return null;
      const bucket = getBucket();
      let fileDoc = null;
      try {
        fileDoc = await bucket.find({ _id: new mongoose.Types.ObjectId(key) }).next();
      } catch {
        return null;
      }
      if (!fileDoc) return null;
      return {
        stream: bucket.openDownloadStream(fileDoc._id),
        contentType: fileDoc.contentType || 'application/octet-stream',
        filename: fileDoc.filename || key,
      };
    }
    // Disk driver
    const fullPath = path.join(UPLOAD_DIR, key);
    if (!fullPath.startsWith(UPLOAD_DIR) || !fs.existsSync(fullPath)) return null;
    const ext = path.extname(key).toLowerCase();
    return {
      stream: fs.createReadStream(fullPath),
      contentType: CONTENT_TYPES[ext] || 'application/octet-stream',
      filename: key,
    };
  },
};

module.exports = imageStore;
