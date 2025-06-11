const express = require('express');
const { body } = require('express-validator');
const categoryController = require('../controllers/category.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

const router = express.Router();

// Validation middleware
const categoryValidation = [
    body('name').trim().notEmpty().withMessage('Category name is required'),
    body('description').optional().trim(),
    body('parent').optional().isMongoId().withMessage('Invalid parent category ID'),
    body('attributes').optional().isArray()
];

// Public routes
router.get('/', categoryController.getCategories);
router.get('/:slug', categoryController.getCategory);

// Admin routes
router.post(
    '/',
    protect,
    authorize('admin'),
    upload.single('image'),
    categoryValidation,
    categoryController.createCategory
);

router.put(
    '/:id',
    protect,
    authorize('admin'),
    upload.single('image'),
    categoryValidation,
    categoryController.updateCategory
);

router.delete(
    '/:id',
    protect,
    authorize('admin'),
    categoryController.deleteCategory
);

router.post(
    '/reorder',
    protect,
    authorize('admin'),
    [
        body('categories').isArray().withMessage('Categories must be an array'),
        body('categories.*.id').isMongoId().withMessage('Invalid category ID'),
        body('categories.*.order').isInt({ min: 0 }).withMessage('Order must be a positive number')
    ],
    categoryController.reorderCategories
);

module.exports = router; 