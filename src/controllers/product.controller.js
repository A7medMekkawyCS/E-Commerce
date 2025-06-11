const Product = require('../models/product.model');
const Category = require('../models/category.model');
const { validationResult } = require('express-validator');
const cloudinary = require('../config/cloudinary');

// Create new product
exports.createProduct = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            name,
            description,
            price,
            category,
            brand,
            stock,
            attributes,
            variants
        } = req.body;

        // Check if category exists
        const categoryExists = await Category.findById(category);
        if (!categoryExists) {
            return res.status(400).json({
                success: false,
                message: 'Category not found'
            });
        }

        // Create slug from name
        const slug = name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-');

        // Handle image uploads
        let images = [];
        if (req.files && req.files.length > 0) {
            const uploadPromises = req.files.map(file => 
                cloudinary.uploader.upload(file.path, {
                    folder: 'products',
                    resource_type: 'auto'
                })
            );
            const uploadResults = await Promise.all(uploadPromises);
            images = uploadResults.map(result => ({
                url: result.secure_url,
                alt: name
            }));
        }

        const product = new Product({
            name,
            slug,
            description,
            price,
            category,
            brand,
            stock,
            attributes,
            variants,
            images
        });

        await product.save();

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            product
        });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating product',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get all products with filtering and pagination
exports.getProducts = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            sort = '-createdAt',
            category,
            brand,
            minPrice,
            maxPrice,
            search,
            inStock
        } = req.query;

        const query = {};

        // Apply filters
        if (category) query.category = category;
        if (brand) query.brand = brand;
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }
        if (inStock === 'true') query.stock = { $gt: 0 };
        if (search) {
            query.$text = { $search: search };
        }

        const products = await Product.find(query)
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('category', 'name slug')
            .lean();

        const count = await Product.countDocuments(query);

        res.json({
            success: true,
            products,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            totalProducts: count
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching products',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get single product
exports.getProduct = async (req, res) => {
    try {
        const product = await Product.findOne({ slug: req.params.slug })
            .populate('category', 'name slug')
            .populate('reviews.user', 'firstName lastName avatar');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.json({
            success: true,
            product
        });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching product',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Update product
exports.updateProduct = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const {
            name,
            description,
            price,
            category,
            brand,
            stock,
            attributes,
            variants
        } = req.body;

        // Handle image uploads
        if (req.files && req.files.length > 0) {
            const uploadPromises = req.files.map(file => 
                cloudinary.uploader.upload(file.path, {
                    folder: 'products',
                    resource_type: 'auto'
                })
            );
            const uploadResults = await Promise.all(uploadPromises);
            const newImages = uploadResults.map(result => ({
                url: result.secure_url,
                alt: name || product.name
            }));
            product.images = [...product.images, ...newImages];
        }

        // Update fields
        if (name) {
            product.name = name;
            product.slug = name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-');
        }
        if (description) product.description = description;
        if (price) product.price = price;
        if (category) product.category = category;
        if (brand) product.brand = brand;
        if (stock !== undefined) product.stock = stock;
        if (attributes) product.attributes = attributes;
        if (variants) product.variants = variants;

        await product.save();

        res.json({
            success: true,
            message: 'Product updated successfully',
            product
        });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating product',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Delete product
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Delete images from cloudinary
        if (product.images.length > 0) {
            const deletePromises = product.images.map(image => 
                cloudinary.uploader.destroy(image.url.split('/').pop().split('.')[0])
            );
            await Promise.all(deletePromises);
        }

        await product.remove();

        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting product',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Add product review
exports.addReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Check if user already reviewed
        const alreadyReviewed = product.reviews.find(
            review => review.user.toString() === req.user.userId
        );

        if (alreadyReviewed) {
            return res.status(400).json({
                success: false,
                message: 'Product already reviewed'
            });
        }

        const review = {
            user: req.user.userId,
            rating: Number(rating),
            comment
        };

        product.reviews.push(review);
        await product.updateAverageRating();
        await product.save();

        res.status(201).json({
            success: true,
            message: 'Review added successfully'
        });
    } catch (error) {
        console.error('Add review error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding review',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get product reviews
exports.getReviews = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('reviews.user', 'firstName lastName avatar');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.json({
            success: true,
            reviews: product.reviews
        });
    } catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching reviews',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}; 