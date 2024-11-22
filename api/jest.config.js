module.exports = {
    testEnvironment: 'node',
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    testMatch: ['**/tests/**/*.test.js'],
    collectCoverage: true,
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/migrations/**',
        '!src/seeders/**'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'clover'],
    verbose: true
};
