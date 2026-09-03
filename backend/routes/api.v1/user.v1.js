const express = require('express');
const router = express.Router();
const userController = require('../../controllers/user.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

// User routes - users can only access their own account
router.get('/me', authenticate, userController.getMe);
router.patch('/me', authenticate, userController.updateMe);
router.delete('/me', authenticate, userController.deleteMe);

module.exports = router;