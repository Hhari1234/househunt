const express = require('express');
const { authenticate } = require('../../middleware/auth.middleware');
const imageStore = require('../../services/image.store');

const router = express.Router();

// POST /api/v1/upload  (field name: images, up to 10 files)
router.post('/', authenticate, (req, res) => {
  imageStore.uploadMiddleware(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, error: 'Image is too large (max 4 MB per photo)' });
      }
      return res.status(400).json({ success: false, error: err.message || 'Upload failed' });
    }
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, error: 'No image files uploaded' });
      }
      const urls = await imageStore.listSavedUrls(req);
      res.status(201).json({ success: true, data: { urls } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message || 'Failed to store uploads' });
    }
  });
});

module.exports = router;
