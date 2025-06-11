const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');

// Placeholder routes - will be implemented later
router.get('/', protect, (req, res) => {
    res.json({ message: 'Orders route' });
});

router.post('/', protect, (req, res) => {
    res.json({ message: 'Create order route' });
});

router.get('/:id', protect, (req, res) => {
    res.json({ message: 'Get order by ID route' });
});

module.exports = router; 