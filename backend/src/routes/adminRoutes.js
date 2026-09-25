const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');

// All admin routes require authentication and ADMIN role
router.use(authenticate, requireAdmin);

router.get('/users', adminController.getUsers);
router.get('/stats', adminController.getStats);
router.patch('/users/:id/status', adminController.updateUserStatus);
router.delete('/users/:id', adminController.deleteUser);

module.exports = router;
