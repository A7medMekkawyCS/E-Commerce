const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

exports.protect = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route'
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            next();
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route'
            });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Error in authentication',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.authorize = (...roles) => {
    return async (req, res, next) => {
        try {
            const user = await User.findById(req.user.userId);
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            if (!roles.includes(user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to access this route'
                });
            }

            next();
        } catch (error) {
            console.error('Authorization middleware error:', error);
            res.status(500).json({
                success: false,
                message: 'Error in authorization',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    };
}; 