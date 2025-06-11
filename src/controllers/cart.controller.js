const Cart = require('../models/cart.model');
const Product = require('../models/product.model');
const { validationResult } = require('express-validator');

// Get user's cart
exports.getCart = async (req, res) => {
    try {
        let cart = await Cart.findOne({ user: req.user.userId })
            .populate('items.product', 'name price images stock');

        if (!cart) {
            cart = await Cart.create({ user: req.user.userId });
        }

        res.json({
            success: true,
            cart
        });
    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching cart',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Add item to cart
exports.addToCart = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { productId, quantity, variant } = req.body;

        let cart = await Cart.findOne({ user: req.user.userId });
        if (!cart) {
            cart = new Cart({ user: req.user.userId });
        }

        await cart.addItem(productId, quantity, variant);

        res.json({
            success: true,
            message: 'Item added to cart',
            cart
        });
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error adding item to cart',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Update cart item quantity
exports.updateQuantity = async (req, res) => {
    try {
        const { itemId } = req.params;
        const { quantity } = req.body;

        const cart = await Cart.findOne({ user: req.user.userId });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        await cart.updateQuantity(itemId, quantity);

        res.json({
            success: true,
            message: 'Cart updated',
            cart
        });
    } catch (error) {
        console.error('Update quantity error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error updating cart',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
    try {
        const { itemId } = req.params;

        const cart = await Cart.findOne({ user: req.user.userId });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        await cart.removeItem(itemId);

        res.json({
            success: true,
            message: 'Item removed from cart',
            cart
        });
    } catch (error) {
        console.error('Remove from cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing item from cart',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Clear cart
exports.clearCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user.userId });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        await cart.clearCart();

        res.json({
            success: true,
            message: 'Cart cleared'
        });
    } catch (error) {
        console.error('Clear cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Error clearing cart',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Apply discount code
exports.applyDiscount = async (req, res) => {
    try {
        const { code } = req.body;

        const cart = await Cart.findOne({ user: req.user.userId });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        // Here you would validate the discount code
        // For now, we'll just apply a 10% discount
        const discountAmount = cart.total * 0.1;
        cart.discount = {
            code,
            amount: discountAmount
        };

        await cart.calculateTotals();

        res.json({
            success: true,
            message: 'Discount applied',
            cart
        });
    } catch (error) {
        console.error('Apply discount error:', error);
        res.status(500).json({
            success: false,
            message: 'Error applying discount',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Update shipping method
exports.updateShipping = async (req, res) => {
    try {
        const { method, cost } = req.body;

        const cart = await Cart.findOne({ user: req.user.userId });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        cart.shipping = {
            method,
            cost: Number(cost)
        };

        await cart.calculateTotals();

        res.json({
            success: true,
            message: 'Shipping method updated',
            cart
        });
    } catch (error) {
        console.error('Update shipping error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating shipping method',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}; 