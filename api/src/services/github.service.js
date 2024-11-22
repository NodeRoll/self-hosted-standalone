const axios = require('axios');
const logger = require('../utils/logger');

class GitHubService {
    constructor() {
        this.client = axios.create({
            baseURL: 'https://api.github.com',
            headers: {
                Accept: 'application/vnd.github.v3+json'
            }
        });
    }

    async getAccessToken(code) {
        try {
            const response = await axios.post('https://github.com/login/oauth/access_token', {
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code
            }, {
                headers: {
                    Accept: 'application/json'
                }
            });

            return response.data.access_token;
        } catch (error) {
            logger.error('GitHub access token error:', error);
            throw new Error('Failed to get GitHub access token');
        }
    }

    async getUserProfile(accessToken) {
        try {
            const response = await this.client.get('/user', {
                headers: {
                    Authorization: `token ${accessToken}`
                }
            });

            return {
                githubId: response.data.id.toString(),
                name: response.data.name || response.data.login,
                email: response.data.email,
                avatarUrl: response.data.avatar_url
            };
        } catch (error) {
            logger.error('GitHub user profile error:', error);
            throw new Error('Failed to get GitHub user profile');
        }
    }

    async getRepository(accessToken, owner, repo) {
        try {
            const response = await this.client.get(`/repos/${owner}/${repo}`, {
                headers: {
                    Authorization: `token ${accessToken}`
                }
            });

            return response.data;
        } catch (error) {
            logger.error('GitHub repository error:', error);
            throw new Error('Failed to get GitHub repository');
        }
    }

    async getBranches(accessToken, owner, repo) {
        try {
            const response = await this.client.get(`/repos/${owner}/${repo}/branches`, {
                headers: {
                    Authorization: `token ${accessToken}`
                }
            });

            return response.data.map(branch => branch.name);
        } catch (error) {
            logger.error('GitHub branches error:', error);
            throw new Error('Failed to get GitHub branches');
        }
    }
}

module.exports = new GitHubService();
