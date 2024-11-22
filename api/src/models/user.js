const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const apiTokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        select: false
    },
    role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user'
    },
    // GitHub OAuth fields
    githubId: {
        type: String,
        unique: true,
        sparse: true
    },
    githubUsername: String,
    githubAccessToken: {
        type: String,
        select: false
    },
    // API tokens
    apiTokens: [apiTokenSchema],
    // Timestamps
    lastLoginAt: Date,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamps before saving
userSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (this.isModified('password') && this.password) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
};

// Find by GitHub ID
userSchema.statics.findByGithubId = function(githubId) {
    return this.findOne({ githubId });
};

// Find by API token
userSchema.statics.findByApiToken = function(token) {
    return this.findOne({
        'apiTokens.token': token
    });
};

const User = mongoose.model('User', userSchema);

module.exports = { User };
