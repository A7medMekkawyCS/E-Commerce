const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        variant: {
            name: String,
            option: String
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        price: {
            type: Number,
            required: true
        }
    }],
    total: {
        type: Number,
        required: true,
        default: 0
    },
    discount: {
        code: String,
        amount: {
            type: Number,
            default: 0
        }
    },
    shipping: {
        method: String,
        cost: {
            type: Number,
            default: 0
        }
    },
    tax: {
        type: Number,
        default: 0
    },
    grandTotal: {
        type: Number,
        required: true,
        default: 0
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Method to calculate totals
cartSchema.methods.calculateTotals = function() {
    this.total = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    this.grandTotal = this.total + this.shipping.cost + this.tax - (this.discount.amount || 0);
    this.lastUpdated = new Date();
    return this.save();
};

// Method to add item to cart
cartSchema.methods.addItem = async function(productId, quantity, variant = null) {
    const product = await mongoose.model('Product').findById(productId);
    if (!product) {
        throw new Error('Product not found');
    }

    // Check stock
    if (product.stock < quantity) {
        throw new Error('Insufficient stock');
    }

    const existingItem = this.items.find(item => 
        item.product.toString() === productId && 
        (!variant || (item.variant && item.variant.name === variant.name && item.variant.option === variant.option))
    );

    if (existingItem) {
        existingItem.quantity += quantity;
        existingItem.price = product.price;
    } else {
        this.items.push({
            product: productId,
            variant,
            quantity,
            price: product.price
        });
    }

    return this.calculateTotals();
};

// Method to remove item from cart
cartSchema.methods.removeItem = function(itemId) {
    this.items = this.items.filter(item => item._id.toString() !== itemId);
    return this.calculateTotals();
};

// Method to update item quantity
cartSchema.methods.updateQuantity = async function(itemId, quantity) {
    const item = this.items.find(item => item._id.toString() === itemId);
    if (!item) {
        throw new Error('Item not found in cart');
    }

    const product = await mongoose.model('Product').findById(item.product);
    if (!product) {
        throw new Error('Product not found');
    }

    if (product.stock < quantity) {
        throw new Error('Insufficient stock');
    }

    item.quantity = quantity;
    return this.calculateTotals();
};

// Method to clear cart
cartSchema.methods.clearCart = function() {
    this.items = [];
    this.total = 0;
    this.discount = { code: null, amount: 0 };
    this.shipping = { method: null, cost: 0 };
    this.tax = 0;
    this.grandTotal = 0;
    this.lastUpdated = new Date();
    return this.save();
};

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart; 