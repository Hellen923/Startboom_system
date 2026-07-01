import { describe, it, expect } from '@jest/globals';
import request from 'supertest';

const API_URL = process.env.TEST_API_URL || 'http://localhost:5000';

describe('Health Check API Tests', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(API_URL).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body.status).toBe('ok');
    });

    it('should not require authentication', async () => {
      const response = await request(API_URL).get('/health');

      expect(response.status).toBe(200);
    });
  });

  describe('GET /health/detailed', () => {
    it('should return detailed health information', async () => {
      const response = await request(API_URL).get('/health/detailed');

      expect([200, 503]).toContain(response.status);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('checks');
      expect(response.body.checks).toHaveProperty('database');
      expect(response.body.checks).toHaveProperty('memory');
      expect(response.body.checks).toHaveProperty('cpu');
    });

    it('should return database connection status', async () => {
      const response = await request(API_URL).get('/health/detailed');

      expect(response.body.checks.database).toHaveProperty('status');
      expect(['ok', 'error']).toContain(response.body.checks.database.status);
    });

    it('should return memory usage information', async () => {
      const response = await request(API_URL).get('/health/detailed');

      expect(response.body.checks.memory).toHaveProperty('status');
      expect(response.body.checks.memory).toHaveProperty('heapUsed');
      expect(response.body.checks.memory).toHaveProperty('heapTotal');
    });
  });

  describe('GET /ready', () => {
    it('should return readiness status', async () => {
      const response = await request(API_URL).get('/ready');

      expect([200, 503]).toContain(response.status);
      expect(response.body).toHaveProperty('status');
      expect(['ready', 'not ready']).toContain(response.body.status);
    });
  });

  describe('GET /live', () => {
    it('should return liveness status', async () => {
      const response = await request(API_URL).get('/live');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('alive');
    });

    it('should respond quickly (< 100ms)', async () => {
      const start = Date.now();
      await request(API_URL).get('/live');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });
  });
});
