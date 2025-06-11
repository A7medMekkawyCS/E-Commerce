const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const Category = require('../models/category.model');
const Product = require('../models/product.model');
require('dotenv').config();

const connectDB = require('../config/database');

// Sample data
const users = [
    {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        password: 'Admin@123',
        role: 'admin',
        isEmailVerified: true
    },
    {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'User@123',
        role: 'user',
        isEmailVerified: true
    }
];

const categories = [
    {
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic devices and accessories',
        attributes: [
            {
                name: 'Brand',
                type: 'select',
                options: ['Apple', 'Samsung', 'Sony', 'LG'],
                required: true,
                filterable: true
            },
            {
                name: 'Color',
                type: 'select',
                options: ['Black', 'White', 'Silver', 'Gold'],
                required: true,
                filterable: true
            }
        ]
    },
    {
        name: 'Clothing',
        slug: 'clothing',
        description: 'Fashion and apparel',
        attributes: [
            {
                name: 'Size',
                type: 'select',
                options: ['S', 'M', 'L', 'XL', 'XXL'],
                required: true,
                filterable: true
            },
            {
                name: 'Color',
                type: 'select',
                options: ['Red', 'Blue', 'Green', 'Black', 'White'],
                required: true,
                filterable: true
            }
        ]
    }
];

const products = [
    {
        name: 'iPhone 13 Pro',
        slug: 'iphone-13-pro',
        sku: 'IP13P-256-BLK',
        description: 'Latest iPhone with amazing camera and performance',
        price: 999.99,
        category: null, // Will be set after category creation
        brand: 'Apple',
        stock: 50,
        attributes: [
            { name: 'Storage', value: '256GB' },
            { name: 'Color', value: 'Graphite' }
        ],
        images: [
            {
                url: 'https://example.com/iphone13pro.jpg',
                alt: 'iPhone 13 Pro'
            }
        ]
    },
    {
        name: 'Samsung Galaxy S21',
        slug: 'samsung-galaxy-s21',
        sku: 'SGS21-128-GRY',
        description: 'Powerful Android smartphone with great features',
        price: 799.99,
        category: null, // Will be set after category creation
        brand: 'Samsung',
        stock: 30,
        attributes: [
            { name: 'Storage', value: '128GB' },
            { name: 'Color', value: 'Phantom Gray' }
        ],
        images: [
            {
                url: 'https://example.com/galaxys21.jpg',
                alt: 'Samsung Galaxy S21'
            }
        ]
    }
];

const seedDatabase = async () => {
    try {
        // Connect to database
        await connectDB();

        // Clear existing data
        await User.deleteMany({});
        await Category.deleteMany({});
        await Product.deleteMany({});

        // Create users
        const createdUsers = await Promise.all(
            users.map(async (user) => {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(user.password, salt);
                return User.create({
                    ...user,
                    password: hashedPassword
                });
            })
        );
        console.log('Users created');

        // Create categories
        const createdCategories = await Promise.all(
            categories.map(category => Category.create(category))
        );
        console.log('Categories created');

        // Update products with category IDs
        const electronicsCategory = createdCategories.find(cat => cat.slug === 'electronics');
        const updatedProducts = products.map(product => ({
            ...product,
            category: electronicsCategory._id
        }));

        // Create products
        await Product.create(updatedProducts);
        console.log('Products created');

        console.log('Database seeded successfully');
        process.exit();
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

// Run seeder
seedDatabase(); 