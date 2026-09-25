const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const documentModel = require('../src/models/documentModel');
const userModel = require('../src/models/userModel');
const { JWT_SECRET } = require('../src/middleware/auth');

jest.mock('../src/models/documentModel');
jest.mock('../src/models/userModel');
jest.mock('../src/models/activityModel', () => ({
  log: jest.fn().mockResolvedValue(true),
}));

describe('Document Endpoints', () => {
  const mockUser = {
    id: 'user-uuid-1234',
    name: 'Test User',
    email: 'test@voxen.io',
    role: 'USER',
    is_active: true,
  };

  const token = jwt.sign(
    { id: mockUser.id, email: mockUser.email, role: mockUser.role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  beforeEach(() => {
    userModel.findById.mockResolvedValue(mockUser);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/documents', () => {
    it('should require authentication', async () => {
      const res = await request(app).get('/api/documents');
      expect(res.statusCode).toEqual(401);
    });

    it('should return list of user documents', async () => {
      documentModel.findDocuments.mockResolvedValueOnce({
        documents: [
          {
            id: 'doc-1',
            original_name: 'test.pdf',
            file_size: 1024,
            category: 'Work',
            created_at: new Date(),
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      const res = await request(app)
        .get('/api/documents')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.documents).toHaveLength(1);
      expect(res.body.documents[0].original_name).toEqual('test.pdf');
    });
  });

  describe('Upload validation', () => {
    it('should reject file upload without file', async () => {
      const res = await request(app)
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toMatch(/No file was provided/i);
    });

    it('should reject unsupported file extension', async () => {
      const res = await request(app)
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', Buffer.from('malicious script'), 'virus.exe');

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toMatch(/Unsupported file type/i);
    });
  });
});
