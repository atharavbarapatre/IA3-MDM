const request = require('supertest');
const app = require('../server');

describe('Demo app', () => {
  test('GET / serves the HTML dashboard', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toMatch(/Jenkins CI\/CD Pipeline/);
  });

  test('GET /api/info returns greeting JSON', async () => {
    const res = await request(app).get('/api/info');
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/Jenkins/);
    expect(res.body).toHaveProperty('version');
  });

  test('GET /health returns UP', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('UP');
  });

  test('GET /add/2/3 returns 5', async () => {
    const res = await request(app).get('/add/2/3');
    expect(res.statusCode).toBe(200);
    expect(res.body.result).toBe(5);
  });

  test('GET /add/x/3 returns 400', async () => {
    const res = await request(app).get('/add/x/3');
    expect(res.statusCode).toBe(400);
  });
});
