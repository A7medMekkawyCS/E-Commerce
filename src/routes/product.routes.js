const express = require('express');
const { body } = require('express-validator');
const productController = require('../controllers/product.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

const router = express.Router();

// Validation middleware
const productValidation = [
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('description').trim().notEmpty().withMessage('Product description is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('category').isMongoId().withMessage('Invalid category ID'),
    body('stock').isInt({ min: 0 }).withMessage('Stock must be a positive number'),
    body('brand').optional().trim(),
    body('attributes').optional().isArray(),
    body('variants').optional().isArray()
];

const reviewValidation = [
    body('rating')
        .isInt({ min: 1, max: 5 })
        .withMessage('Rating must be between 1 and 5'),
    body('comment').optional().trim()
];

// Public routes
router.get('/', productController.getProducts);
router.get('/:slug', productController.getProduct);
router.get('/:id/reviews', productController.getReviews);

// Protected routes
router.post('/:id/reviews', protect, reviewValidation, productController.addReview);

// Admin routes
router.post(
    '/',
    protect,
    authorize('admin'),
    upload.array('images', 5),
    productValidation,
    productController.createProduct
);

router.put(
    '/:id',
    protect,
    authorize('admin'),
    upload.array('images', 5),
    productValidation,
    productController.updateProduct
);

router.delete(
    '/:id',
    protect,
    authorize('admin'),
    productController.deleteProduct
);

module.exports = router; 