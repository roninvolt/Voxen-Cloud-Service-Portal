const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');

// Mock db.query for health test
jest.mock('../src/config/db', () => ({
  query: jest.fn().mockResolvedValue({ rows: [{ '?column?': 1 }] }),
  pool: { end: jest.fn() },
}));

describe('GET /api/health', () => {
  it('should return 200 and healthy status when database is connected', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('ok');
    expect(res.body.database).toEqual('connected');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('should return 503 if database query fails', async () => {
    db.query.mockRejectedValueOnce(new Error('Connection failed'));
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toEqual(503);
    expect(res.body.status).toEqual('error');
    expect(res.body.database).toEqual('disconnected');
  });
});
