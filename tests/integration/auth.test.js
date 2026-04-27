const request = require('supertest');
const { app } = require('../../src/app');
const { prisma } = require('../../src/config/database');
const { redis } = require('../../src/config/redis');

describe('Auth Integration', () => {
  afterAll(async () => {
    await prisma.user.deleteMany();
    await redis.quit();
  });

  it('should register a new user', async () => {
    const res = await request(app).post('/v1/auth/register').send({
      phone: '+77001234567',
      password: 'SecurePass123!',
      firstName: 'Test',
      lastName: 'User',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.phone).toBe('+77001234567');
  });

  it('should reject duplicate phone', async () => {
    const res = await request(app).post('/v1/auth/register').send({
      phone: '+77001234567',
      password: 'AnotherPass123!',
    });
    expect(res.status).toBe(409);
  });

  it('should login and return tokens', async () => {
    const res = await request(app).post('/v1/auth/login').send({
      phone: '+77001234567',
      password: 'SecurePass123!',
    });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('should reject invalid credentials', async () => {
    const res = await request(app).post('/v1/auth/login').send({
      phone: '+77001234567',
      password: 'WrongPassword',
    });
    expect(res.status).toBe(401);
  });

  it('should reject protected route without token', async () => {
    const res = await request(app).post('/v1/circles').send({ name: 'Test' });
    expect(res.status).toBe(401);
  });

  it('should return 403 for wrong role (MEMBER cannot create circle)', async () => {
    const phone = `+7700${Date.now().toString().slice(-7)}`;

    await request(app).post('/v1/auth/register').send({
      phone,
      password: 'Pass123456!',
    });

    const loginRes = await request(app).post('/v1/auth/login').send({
      phone,
      password: 'Pass123456!',
    });

    const token = loginRes.body.data.accessToken;

    const res = await request(app)
      .post('/v1/circles')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Circle',
        contributionAmount: 10000,
        memberCount: 5,
        startDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
      });

    expect(res.status).toBe(403);
  });

  it('should return 401 for missing token', async () => {
    const res = await request(app).get('/v1/circles/some-id');
    expect(res.status).toBe(401);
  });
});