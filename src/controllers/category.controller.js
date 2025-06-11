const Category = require('../models/category.model');
const { validationResult } = require('express-validator');
const cloudinary = require('../config/cloudinary');

// Create new category
exports.createCategory = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, description, parent, attributes } = req.body;

        // Create slug from name
        const slug = name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-');

        // Handle image upload
        let image = null;
        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'categories',
                resource_type: 'auto'
            });
            image = {
                url: result.secure_url,
                alt: name
            };
        }

        const category = new Category({
            name,
            slug,
            description,
            parent,
            image,
            attributes
        });

        await category.save();

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            category
        });
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating category',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get all categories
exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.find()
            .populate('parent', 'name slug')
            .sort('order name');

        // Organize categories into a tree structure
        const categoryTree = categories.reduce((tree, category) => {
            if (!category.parent) {
                tree.push({
                    ...category.toObject(),
                    subcategories: []
                });
            }
            return tree;
        }, []);

        // Add subcategories to their parents
        categories.forEach(category => {
            if (category.parent) {
                const parent = categoryTree.find(cat => 
                    cat._id.toString() === category.parent._id.toString()
                );
                if (parent) {
                    parent.subcategories.push(category);
                }
            }
        });

        res.json({
            success: true,
            categories: categoryTree
        });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching categories',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get single category
exports.getCategory = async (req, res) => {
    try {
        const category = await Category.findOne({ slug: req.params.slug })
            .populate('parent', 'name slug')
            .populate('subcategories', 'name slug');

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.json({
            success: true,
            category
        });
    } catch (error) {
        console.error('Get category error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching category',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Update category
exports.updateCategory = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        const { name, description, parent, attributes } = req.body;

        // Handle image upload
        if (req.file) {
            // Delete old image if exists
            if (category.image && category.image.url) {
                await cloudinary.uploader.destroy(
                    category.image.url.split('/').pop().split('.')[0]
                );
            }

            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'categories',
                resource_type: 'auto'
            });
            category.image = {
                url: result.secure_url,
                alt: name || category.name
            };
        }

        // Update fields
        if (name) {
            category.name = name;
            category.slug = name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-');
        }
        if (description) category.description = description;
        if (parent) category.parent = parent;
        if (attributes) category.attributes = attributes;

        await category.save();

        res.json({
            success: true,
            message: 'Category updated successfully',
            category
        });
    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating category',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Delete category
exports.deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        // Check if category has subcategories
        const hasSubcategories = await Category.exists({ parent: category._id });
        if (hasSubcategories) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete category with subcategories'
            });
        }

        // Delete image if exists
        if (category.image && category.image.url) {
            await cloudinary.uploader.destroy(
                category.image.url.split('/').pop().split('.')[0]
            );
        }

        await category.remove();

        res.json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting category',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Reorder categories
exports.reorderCategories = async (req, res) => {
    try {
        const { categories } = req.body;

        if (!Array.isArray(categories)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid categories data'
            });
        }

        const updatePromises = categories.map(({ id, order }) =>
            Category.findByIdAndUpdate(id, { order })
        );

        await Promise.all(updatePromises);

        res.json({
            success: true,
            message: 'Categories reordered successfully'
        });
    } catch (error) {
        console.error('Reorder categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Error reordering categories',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}; 