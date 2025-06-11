const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');

// Placeholder routes - will be implemented later
router.get('/', protect, (req, res) => {
    res.json({ message: 'Wishlist route' });
});

router.post('/:productId', protect, (req, res) => {
    res.json({ message: 'Add to wishlist route' });
});

router.delete('/:productId', protect, (req, res) => {
    res.json({ message: 'Remove from wishlist route' });
});

module.exports = router; 