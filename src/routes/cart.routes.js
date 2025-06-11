const express = require('express');
const { body } = require('express-validator');
const cartController = require('../controllers/cart.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes are protected
router.use(protect);

// Validation middleware
const addToCartValidation = [
    body('productId').isMongoId().withMessage('Invalid product ID'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('variant').optional().isObject()
];

const updateQuantityValidation = [
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
];

const shippingValidation = [
    body('method').notEmpty().withMessage('Shipping method is required'),
    body('cost').isFloat({ min: 0 }).withMessage('Shipping cost must be a positive number')
];

// Routes
router.get('/', cartController.getCart);
router.post('/add', addToCartValidation, cartController.addToCart);
router.put('/item/:itemId', updateQuantityValidation, cartController.updateQuantity);
router.delete('/item/:itemId', cartController.removeFromCart);
router.delete('/clear', cartController.clearCart);
router.post('/discount', cartController.applyDiscount);
router.put('/shipping', shippingValidation, cartController.updateShipping);

module.exports = router; 