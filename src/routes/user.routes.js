const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');

// Placeholder routes - will be implemented later
router.get('/profile', protect, (req, res) => {
    res.json({ message: 'User profile route' });
});

router.put('/profile', protect, (req, res) => {
    res.json({ message: 'Update profile route' });
});

router.get('/', protect, authorize('admin'), (req, res) => {
    res.json({ message: 'Get all users route' });
});

module.exports = router; 