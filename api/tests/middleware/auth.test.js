const { auth, requireAdmin, requireProjectAccess } = require('../../src/middleware/auth.middleware');
const { createTestUser, createTestAdmin, createTestProject, generateTestToken } = require('../helpers');
const { AppError } = require('../../src/middleware/errorHandler');

describe('Auth Middleware', () => {
    describe('auth', () => {
        it('should authenticate valid token', async () => {
            const user = await createTestUser();
            const token = generateTestToken(user);
            const req = {
                header: jest.fn().mockReturnValue(`Bearer ${token}`)
            };
            const res = {};
            const next = jest.fn();

            await auth(req, res, next);

            expect(req.user).toBeDefined();
            expect(req.user.id).toBe(user.id);
            expect(next).toHaveBeenCalled();
            expect(next).not.toHaveBeenCalledWith(expect.any(AppError));
        });

        it('should reject missing token', async () => {
            const req = {
                header: jest.fn().mockReturnValue(null)
            };
            const res = {};
            const next = jest.fn();

            await auth(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(AppError));
            expect(next.mock.calls[0][0].statusCode).toBe(401);
        });

        it('should reject invalid token', async () => {
            const req = {
                header: jest.fn().mockReturnValue('Bearer invalid_token')
            };
            const res = {};
            const next = jest.fn();

            await auth(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(AppError));
            expect(next.mock.calls[0][0].statusCode).toBe(401);
        });
    });

    describe('requireAdmin', () => {
        it('should allow admin access', async () => {
            const admin = await createTestAdmin();
            const req = { user: admin };
            const res = {};
            const next = jest.fn();

            await requireAdmin(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(next).not.toHaveBeenCalledWith(expect.any(AppError));
        });

        it('should reject non-admin access', async () => {
            const user = await createTestUser();
            const req = { user };
            const res = {};
            const next = jest.fn();

            await requireAdmin(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(AppError));
            expect(next.mock.calls[0][0].statusCode).toBe(403);
        });
    });

    describe('requireProjectAccess', () => {
        it('should allow project owner access', async () => {
            const user = await createTestUser();
            const project = await createTestProject(user);
            const req = {
                user,
                params: { projectId: project.id }
            };
            const res = {};
            const next = jest.fn();

            await requireProjectAccess(req, res, next);

            expect(req.project).toBeDefined();
            expect(req.project.id).toBe(project.id);
            expect(next).toHaveBeenCalled();
            expect(next).not.toHaveBeenCalledWith(expect.any(AppError));
        });

        it('should allow admin access to any project', async () => {
            const admin = await createTestAdmin();
            const user = await createTestUser();
            const project = await createTestProject(user);
            const req = {
                user: admin,
                params: { projectId: project.id }
            };
            const res = {};
            const next = jest.fn();

            await requireProjectAccess(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(next).not.toHaveBeenCalledWith(expect.any(AppError));
        });

        it('should reject unauthorized access', async () => {
            const owner = await createTestUser();
            const project = await createTestProject(owner);
            const unauthorizedUser = await createTestUser({
                email: 'unauthorized@example.com',
                githubId: '67890'
            });
            const req = {
                user: unauthorizedUser,
                params: { projectId: project.id }
            };
            const res = {};
            const next = jest.fn();

            await requireProjectAccess(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(AppError));
            expect(next.mock.calls[0][0].statusCode).toBe(403);
        });
    });
});
