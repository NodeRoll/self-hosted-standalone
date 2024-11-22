const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { User } = require('../models/user');
const logger = require('../utils/logger');

class AuthService {
    constructor() {
        this.JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
        this.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
    }

    async register(email, password, name) {
        try {
            // Check if user exists
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                throw new Error('User already exists');
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Create user
            const user = await User.create({
                email,
                password: hashedPassword,
                name,
                apiTokens: []
            });

            // Generate initial API token
            const apiToken = await this.generateApiToken(user._id, 'Default Token');

            return {
                user: this._sanitizeUser(user),
                token: apiToken
            };
        } catch (error) {
            logger.error('Error in register:', error);
            throw error;
        }
    }

    async login(email, password) {
        try {
            // Find user
            const user = await User.findOne({ email }).select('+password');
            if (!user) {
                throw new Error('Invalid credentials');
            }

            // Check password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                throw new Error('Invalid credentials');
            }

            // Generate token
            const token = this.generateJWT(user);

            return {
                user: this._sanitizeUser(user),
                token
            };
        } catch (error) {
            logger.error('Error in login:', error);
            throw error;
        }
    }

    async generateApiToken(userId, description) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            const token = crypto.randomBytes(32).toString('hex');
            const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

            // Add token to user's API tokens
            user.apiTokens.push({
                token: hashedToken,
                description,
                createdAt: new Date()
            });

            await user.save();

            return token;
        } catch (error) {
            logger.error('Error generating API token:', error);
            throw error;
        }
    }

    async validateApiToken(token) {
        try {
            const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
            const user = await User.findOne({
                'apiTokens.token': hashedToken
            });

            return user ? this._sanitizeUser(user) : null;
        } catch (error) {
            logger.error('Error validating API token:', error);
            throw error;
        }
    }

    async revokeApiToken(userId, tokenId) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            user.apiTokens = user.apiTokens.filter(token => token._id.toString() !== tokenId);
            await user.save();

            return this._sanitizeUser(user);
        } catch (error) {
            logger.error('Error revoking API token:', error);
            throw error;
        }
    }

    generateJWT(user) {
        return jwt.sign(
            { id: user._id, email: user.email },
            this.JWT_SECRET,
            { expiresIn: this.JWT_EXPIRES_IN }
        );
    }

    verifyJWT(token) {
        try {
            return jwt.verify(token, this.JWT_SECRET);
        } catch (error) {
            return null;
        }
    }

    _sanitizeUser(user) {
        const sanitized = user.toObject();
        delete sanitized.password;
        delete sanitized.__v;
        sanitized.apiTokens = sanitized.apiTokens?.map(token => ({
            id: token._id,
            description: token.description,
            createdAt: token.createdAt
        }));
        return sanitized;
    }
}

module.exports = new AuthService();
