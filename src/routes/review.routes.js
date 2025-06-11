const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');

// Placeholder routes - will be implemented later
router.get('/', (req, res) => {
    res.json({ message: 'Reviews route' });
});

router.post('/', protect, (req, res) => {
    res.json({ message: 'Create review route' });
});

router.get('/:id', (req, res) => {
    res.json({ message: 'Get review by ID route' });
});

module.exports = router; 