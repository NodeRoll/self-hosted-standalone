const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { User } = require('../models');
const githubService = require('../services/github.service');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

class AuthController {
    async githubCallback(req, res, next) {
        try {
            const { code } = req.query;

            if (!code) {
                throw new AppError(400, 'GitHub code is required');
            }

            // GitHub'dan access token al
            const accessToken = await githubService.getAccessToken(code);

            // GitHub profil bilgilerini al
            const profile = await githubService.getUserProfile(accessToken);

            // Kullanıcıyı bul veya oluştur
            let user = await User.findByGithubId(profile.githubId);

            if (!user) {
                // İlk kullanıcıyı admin yap
                const isFirstUser = await User.count() === 0;
                
                user = await User.create({
                    ...profile,
                    role: isFirstUser ? 'admin' : 'user'
                });

                logger.info(`New user created: ${user.email} (${user.role})`);
            }

            // Son giriş zamanını güncelle
            user.lastLoginAt = new Date();
            await user.save();

            // JWT token oluştur
            const token = jwt.sign(
                { id: user.id },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN }
            );

            res.json({
                user: user.toJSON(),
                token
            });
        } catch (error) {
            next(error);
        }
    }

    async register(req, res, next) {
        try {
            const { email, password, name } = req.body;

            if (!email || !password || !name) {
                throw new AppError(400, 'Missing required fields');
            }

            // Check if user exists
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                throw new AppError(409, 'User already exists');
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Create user
            const isFirstUser = await User.count() === 0;
            const user = await User.create({
                email,
                password: hashedPassword,
                name,
                role: isFirstUser ? 'admin' : 'user'
            });

            logger.info(`New user registered: ${user.email} (${user.role})`);

            // Generate token
            const token = this._generateToken(user);

            res.status(201).json({
                user: this._sanitizeUser(user),
                token
            });
        } catch (error) {
            next(error);
        }
    }

    async login(req, res, next) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                throw new AppError(400, 'Missing required fields');
            }

            // Find user
            const user = await User.findOne({ email }).select('+password');
            if (!user) {
                throw new AppError(401, 'Invalid credentials');
            }

            // Check password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                throw new AppError(401, 'Invalid credentials');
            }

            // Update last login
            user.lastLoginAt = new Date();
            await user.save();

            // Generate token
            const token = this._generateToken(user);

            res.json({
                user: this._sanitizeUser(user),
                token
            });
        } catch (error) {
            next(error);
        }
    }

    async getCurrentUser(req, res, next) {
        try {
            const user = req.user;
            
            // Kullanıcının projelerini getir
            const projects = await user.getProjects({
                include: ['owner', 'collaborators']
            });

            res.json({
                user: user.toJSON(),
                projects
            });
        } catch (error) {
            next(error);
        }
    }

    async logout(req, res, next) {
        try {
            // JWT blacklist veya revoke mekanizması eklenebilir
            res.json({
                message: 'Logged out successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    async generateApiToken(req, res, next) {
        try {
            const { description } = req.body;
            if (!description) {
                throw new AppError(400, 'Token description is required');
            }

            const user = await User.findById(req.user.id);
            if (!user) {
                throw new AppError(404, 'User not found');
            }

            const token = crypto.randomBytes(32).toString('hex');
            const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

            user.apiTokens.push({
                token: hashedToken,
                description,
                createdAt: new Date()
            });

            await user.save();

            res.json({ token });
        } catch (error) {
            next(error);
        }
    }

    async listApiTokens(req, res, next) {
        try {
            const user = await User.findById(req.user.id);
            if (!user) {
                throw new AppError(404, 'User not found');
            }

            res.json({ 
                tokens: user.apiTokens.map(token => ({
                    id: token._id,
                    description: token.description,
                    createdAt: token.createdAt
                }))
            });
        } catch (error) {
            next(error);
        }
    }

    async revokeApiToken(req, res, next) {
        try {
            const { tokenId } = req.params;
            const user = await User.findById(req.user.id);
            if (!user) {
                throw new AppError(404, 'User not found');
            }

            user.apiTokens = user.apiTokens.filter(token => token._id.toString() !== tokenId);
            await user.save();

            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    _generateToken(user) {
        return jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );
    }

    _sanitizeUser(user) {
        const sanitized = user.toJSON();
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

module.exports = new AuthController();
