const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderNumber: {
        type: String,
        required: true,
        unique: true
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
        },
        total: {
            type: Number,
            required: true
        }
    }],
    subtotal: {
        type: Number,
        required: true
    },
    tax: {
        type: Number,
        required: true,
        default: 0
    },
    shipping: {
        method: {
            type: String,
            required: true
        },
        cost: {
            type: Number,
            required: true
        },
        address: {
            street: String,
            city: String,
            state: String,
            country: String,
            zipCode: String
        },
        tracking: {
            number: String,
            carrier: String,
            status: String
        }
    },
    discount: {
        code: String,
        amount: {
            type: Number,
            default: 0
        }
    },
    total: {
        type: Number,
        required: true
    },
    payment: {
        method: {
            type: String,
            required: true,
            enum: ['credit_card', 'paypal', 'stripe', 'bank_transfer']
        },
        status: {
            type: String,
            required: true,
            enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
            default: 'pending'
        },
        transactionId: String,
        paymentDetails: {
            type: Object
        }
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
        default: 'pending'
    },
    statusHistory: [{
        status: {
            type: String,
            required: true
        },
        date: {
            type: Date,
            default: Date.now
        },
        note: String
    }],
    notes: [{
        content: String,
        date: {
            type: Date,
            default: Date.now
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    estimatedDelivery: Date,
    actualDelivery: Date,
    isGift: {
        type: Boolean,
        default: false
    },
    giftMessage: String,
    cancellationReason: String,
    refundDetails: {
        amount: Number,
        reason: String,
        date: Date
    }
}, {
    timestamps: true
});

// Method to calculate totals
orderSchema.methods.calculateTotals = function() {
    this.subtotal = this.items.reduce((sum, item) => sum + item.total, 0);
    this.total = this.subtotal + this.tax + this.shipping.cost - (this.discount.amount || 0);
    return this.save();
};

// Method to update order status
orderSchema.methods.updateStatus = function(newStatus, note) {
    this.status = newStatus;
    this.statusHistory.push({
        status: newStatus,
        note: note
    });
    return this.save();
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order; 