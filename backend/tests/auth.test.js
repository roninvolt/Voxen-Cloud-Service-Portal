const request = require('supertest');
const app = require('../src/app');
const userModel = require('../src/models/userModel');
const bcrypt = require('bcryptjs');

jest.mock('../src/models/userModel');
jest.mock('../src/models/activityModel', () => ({
  log: jest.fn().mockResolvedValue(true),
}));

describe('Auth Endpoints', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should reject registration if fields are missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com' });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/All fields are required/i);
    });

    it('should reject registration if passwords do not match', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password123!',
          confirmPassword: 'DifferentPassword!',
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toMatch(/Passwords do not match/i);
    });

    it('should register a new user successfully', async () => {
      userModel.findByEmail.mockResolvedValueOnce(null);
      userModel.create.mockResolvedValueOnce({
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Jane Doe',
        email: 'jane@voxen.io',
        role: 'USER',
        is_active: true,
        created_at: new Date(),
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane@voxen.io',
          password: 'SecurePassword123!',
          confirmPassword: 'SecurePassword123!',
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toEqual('jane@voxen.io');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return 401 on non-existent user', async () => {
      userModel.findByEmail.mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@voxen.io',
          password: 'Password123!',
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 200 and token on valid credentials', async () => {
      const passwordHash = await bcrypt.hash('CorrectPassword123!', 10);
      userModel.findByEmail.mockResolvedValueOnce({
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Jane Doe',
        email: 'jane@voxen.io',
        password_hash: passwordHash,
        role: 'USER',
        is_active: true,
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'jane@voxen.io',
          password: 'CorrectPassword123!',
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.name).toEqual('Jane Doe');
    });
  });
});
