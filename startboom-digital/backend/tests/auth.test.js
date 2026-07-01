import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import mongoose from 'mongoose';
import User from '../models/User.js';

const API_URL = process.env.TEST_API_URL || 'http://localhost:5000';

describe('Authentication API Tests', () => {
  let testUserId;
  let authToken;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/startboom_test');
    }
  });

  afterAll(async () => {
    // Cleanup test data
    if (testUserId) {
      await User.findByIdAndDelete(testUserId);
    }
    await mongoose.connection.close();
  });

  describe('POST /api/auth/login', () => {
    it('should reject login with invalid credentials', async () => {
      const response = await request(API_URL)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
    });

    it('should reject login with missing email', async () => {
      const response = await request(API_URL)
        .post('/api/auth/login')
        .send({
          password: 'password123'
        });

      expect(response.status).toBe(400);
    });

    it('should reject login with missing password', async () => {
      const response = await request(API_URL)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com'
        });

      expect(response.status).toBe(400);
    });

    it('should enforce rate limiting after 5 attempts', async () => {
      const loginAttempt = {
        email: 'ratelimit@example.com',
        password: 'wrongpassword'
      };

      // Make 5 failed attempts
      for (let i = 0; i < 5; i++) {
        await request(API_URL)
          .post('/api/auth/login')
          .send(loginAttempt);
      }

      // 6th attempt should be rate limited
      const response = await request(API_URL)
        .post('/api/auth/login')
        .send(loginAttempt);

      expect(response.status).toBe(429);
      expect(response.body.message).toContain('Too many');
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should accept valid email format', async () => {
      const response = await request(API_URL)
        .post('/api/auth/forgot-password')
        .send({
          email: 'test@example.com'
        });

      // Should return 200 even if email doesn't exist (security)
      expect([200, 404]).toContain(response.status);
    });

    it('should reject invalid email format', async () => {
      const response = await request(API_URL)
        .post('/api/auth/forgot-password')
        .send({
          email: 'notanemail'
        });

      expect(response.status).toBe(400);
    });

    it('should enforce rate limiting', async () => {
      // Make 3 requests (limit is 3 per hour)
      for (let i = 0; i < 3; i++) {
        await request(API_URL)
          .post('/api/auth/forgot-password')
          .send({ email: 'ratelimit@example.com' });
      }

      // 4th attempt should be rate limited
      const response = await request(API_URL)
        .post('/api/auth/forgot-password')
        .send({ email: 'ratelimit@example.com' });

      expect(response.status).toBe(429);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should reject request without token', async () => {
      const response = await request(API_URL)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
    });

    it('should reject request with invalid token', async () => {
      const response = await request(API_URL)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken123');

      expect(response.status).toBe(401);
    });
  });
});
