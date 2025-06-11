const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
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
        trim: true
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    },
    image: {
        url: String,
        alt: String
    },
    isActive: {
        type: Boolean,
        default: true
    },
    order: {
        type: Number,
        default: 0
    },
    attributes: [{
        name: String,
        type: {
            type: String,
            enum: ['text', 'number', 'boolean', 'select', 'multiselect']
        },
        options: [String],
        required: Boolean,
        filterable: Boolean
    }],
    seo: {
        title: String,
        description: String,
        keywords: [String]
    }
}, {
    timestamps: true
});

// Index for search
categorySchema.index({
    name: 'text',
    description: 'text'
});

// Virtual for subcategories
categorySchema.virtual('subcategories', {
    ref: 'Category',
    localField: '_id',
    foreignField: 'parent'
});

// Method to get full path
categorySchema.methods.getFullPath = async function() {
    const path = [this.name];
    let current = this;
    
    while (current.parent) {
        current = await this.constructor.findById(current.parent);
        if (current) {
            path.unshift(current.name);
        } else {
            break;
        }
    }
    
    return path.join(' > ');
};

const Category = mongoose.model('Category', categorySchema);

module.exports = Category; 