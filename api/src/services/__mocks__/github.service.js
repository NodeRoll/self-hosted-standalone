const githubService = {
    validateCommit: jest.fn().mockImplementation((owner, repo, commitHash) => {
        if (commitHash === 'invalid') {
            throw new Error('Invalid commit hash');
        }
        return Promise.resolve(true);
    })
};

module.exports = githubService;
