const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    compareAtPrice: {
        type: Number,
        min: 0
    },
    images: [{
        url: String,
        alt: String
    }],
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    subcategories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    }],
    brand: {
        type: String,
        trim: true
    },
    sku: {
        type: String,
        unique: true,
        trim: true
    },
    barcode: {
        type: String,
        trim: true
    },
    stock: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    weight: {
        value: Number,
        unit: {
            type: String,
            enum: ['kg', 'g', 'lb', 'oz'],
            default: 'kg'
        }
    },
    dimensions: {
        length: Number,
        width: Number,
        height: Number,
        unit: {
            type: String,
            enum: ['cm', 'm', 'in'],
            default: 'cm'
        }
    },
    variants: [{
        name: String,
        options: [{
            name: String,
            sku: String,
            price: Number,
            stock: Number
        }]
    }],
    attributes: [{
        name: String,
        value: String
    }],
    tags: [{
        type: String,
        trim: true
    }],
    ratings: {
        average: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        count: {
            type: Number,
            default: 0
        }
    },
    reviews: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        comment: String,
        images: [String],
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    seo: {
        title: String,
        description: String,
        keywords: [String]
    },
    shipping: {
        weight: Number,
        dimensions: {
            length: Number,
            width: Number,
            height: Number
        },
        freeShipping: {
            type: Boolean,
            default: false
        }
    }
}, {
    timestamps: true
});

// Index for search
productSchema.index({
    name: 'text',
    description: 'text',
    brand: 'text',
    tags: 'text'
});

// Method to update average rating
productSchema.methods.updateAverageRating = function() {
    if (this.reviews.length === 0) {
        this.ratings.average = 0;
        this.ratings.count = 0;
    } else {
        const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
        this.ratings.average = totalRating / this.reviews.length;
        this.ratings.count = this.reviews.length;
    }
    return this.save();
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product; 