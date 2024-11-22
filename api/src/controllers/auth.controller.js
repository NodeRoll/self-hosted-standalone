const jwt = require('jsonwebtoken');
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
}

module.exports = new AuthController();
