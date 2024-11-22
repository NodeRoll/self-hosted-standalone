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
        this.activityCache = new Map();
        this.CACHE_TTL = 5 * 60 * 1000; // 5 minutes
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

    async getRepositoryMetrics(accessToken, owner, repo) {
        try {
            // Check cache first
            const cacheKey = `${owner}/${repo}`;
            const cachedData = this.activityCache.get(cacheKey);
            if (cachedData && Date.now() - cachedData.timestamp < this.CACHE_TTL) {
                return cachedData.metrics;
            }

            // Fetch various metrics in parallel
            const [commits, pullRequests, issues, traffic] = await Promise.all([
                this._getRecentCommits(accessToken, owner, repo),
                this._getOpenPullRequests(accessToken, owner, repo),
                this._getActiveIssues(accessToken, owner, repo),
                this._getTrafficStats(accessToken, owner, repo)
            ]);

            const metrics = {
                commitFrequency: this._calculateCommitFrequency(commits),
                activePRs: pullRequests.length,
                activeIssues: issues.length,
                trafficLoad: this._calculateTrafficLoad(traffic),
                timestamp: Date.now()
            };

            // Cache the results
            this.activityCache.set(cacheKey, {
                metrics,
                timestamp: Date.now()
            });

            return metrics;
        } catch (error) {
            logger.error('GitHub metrics error:', error);
            throw new Error('Failed to get GitHub repository metrics');
        }
    }

    async _getRecentCommits(accessToken, owner, repo) {
        const response = await this.client.get(
            `/repos/${owner}/${repo}/commits`,
            {
                headers: { Authorization: `token ${accessToken}` },
                params: {
                    per_page: 100,
                    since: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Last 24 hours
                }
            }
        );
        return response.data;
    }

    async _getOpenPullRequests(accessToken, owner, repo) {
        const response = await this.client.get(
            `/repos/${owner}/${repo}/pulls`,
            {
                headers: { Authorization: `token ${accessToken}` },
                params: { state: 'open' }
            }
        );
        return response.data;
    }

    async _getActiveIssues(accessToken, owner, repo) {
        const response = await this.client.get(
            `/repos/${owner}/${repo}/issues`,
            {
                headers: { Authorization: `token ${accessToken}` },
                params: {
                    state: 'open',
                    labels: 'active'
                }
            }
        );
        return response.data;
    }

    async _getTrafficStats(accessToken, owner, repo) {
        const response = await this.client.get(
            `/repos/${owner}/${repo}/traffic/views`,
            {
                headers: { Authorization: `token ${accessToken}` }
            }
        );
        return response.data;
    }

    async _calculateTrafficLoad(accessToken, owner, repo) {
        try {
            // Get repository traffic data
            const trafficData = await this.client.get(`/repos/${owner}/${repo}/traffic/views`, {
                headers: {
                    Authorization: `token ${accessToken}`
                }
            });

            const views = trafficData.data.views || [];
            const now = new Date();
            const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);

            // Calculate total views in the last 24 hours
            const recentViews = views.filter(view => {
                const viewDate = new Date(view.timestamp);
                return viewDate >= oneDayAgo;
            });

            const totalViews = recentViews.reduce((sum, view) => sum + view.count, 0);
            
            // Calculate load score (0-100)
            // Assuming 1000 views/day is high traffic (100% load)
            const loadScore = Math.min(Math.round((totalViews / 1000) * 100), 100);

            return {
                totalViews,
                loadScore,
                timestamp: now.toISOString()
            };
        } catch (error) {
            logger.error('Failed to calculate traffic load:', error);
            throw new Error('Failed to calculate repository traffic load');
        }
    }

    _calculateCommitFrequency(commits) {
        // Calculate commits per hour over the last 24 hours
        const now = Date.now();
        const commitTimes = commits.map(c => new Date(c.commit.author.date).getTime());
        const recentCommits = commitTimes.filter(time => now - time <= 24 * 60 * 60 * 1000);
        return recentCommits.length / 24;
    }

    _calculateTrafficLoad(traffic) {
        // Calculate average views per hour over the last day
        const views = traffic.views || [];
        const recentViews = views.slice(-24);
        const totalViews = recentViews.reduce((sum, view) => sum + view.count, 0);
        return totalViews / 24;
    }
}

module.exports = new GitHubService();
