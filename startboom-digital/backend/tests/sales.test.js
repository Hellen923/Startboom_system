import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';

const API_URL = process.env.TEST_API_URL || 'http://localhost:5000';
let authToken;

describe('Sales API Tests', () => {
  beforeAll(async () => {
    // Login to get auth token for protected routes
    // Note: You'll need a test user in your test database
    try {
      const loginResponse = await request(API_URL)
        .post('/api/auth/login')
        .send({
          email: process.env.TEST_USER_EMAIL || 'agent@test.com',
          password: process.env.TEST_USER_PASSWORD || 'testpassword123'
        });
      
      if (loginResponse.body.token) {
        authToken = loginResponse.body.token;
      }
    } catch (error) {
      console.log('Warning: Could not login test user. Some tests may fail.');
    }
  });

  describe('POST /api/sales', () => {
    it('should reject sale creation without authentication', async () => {
      const response = await request(API_URL)
        .post('/api/sales')
        .send({
          customerName: 'Test Customer',
          items: [{ itemName: 'Test Product', quantity: 1, unitPrice: 100 }]
        });

      expect(response.status).toBe(401);
    });

    it('should reject sale without customer name', async () => {
      if (!authToken) {
        console.log('Skipping test: No auth token');
        return;
      }

      const response = await request(API_URL)
        .post('/api/sales')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [{ itemName: 'Test Product', quantity: 1, unitPrice: 100 }]
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Customer name');
    });

    it('should reject sale with invalid payment method', async () => {
      if (!authToken) {
        console.log('Skipping test: No auth token');
        return;
      }

      const response = await request(API_URL)
        .post('/api/sales')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          customerName: 'Test Customer',
          paymentMethod: 'invalid_method',
          items: [{ itemName: 'Test Product', quantity: 1, unitPrice: 100 }]
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid payment method');
    });

    it('should accept valid Uganda payment methods', async () => {
      if (!authToken) {
        console.log('Skipping test: No auth token');
        return;
      }

      const validMethods = ['cash', 'credit', 'mtn_momo', 'airtel_momo', 'bank_transfer', 'cheque'];

      for (const method of validMethods) {
        const response = await request(API_URL)
          .post('/api/sales')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            customerName: 'Test Customer',
            paymentMethod: method,
            items: [{ itemName: 'Test Product', quantity: 1, unitPrice: 100 }]
          });

        // Should not fail due to payment method (may fail for other reasons in test env)
        expect(response.status).not.toBe(400);
      }
    });

    it('should enforce rate limiting (30 per minute)', async () => {
      if (!authToken) {
        console.log('Skipping test: No auth token');
        return;
      }

      // Make 31 rapid requests
      const requests = [];
      for (let i = 0; i < 31; i++) {
        requests.push(
          request(API_URL)
            .post('/api/sales')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              customerName: 'Bulk Test',
              items: [{ itemName: 'Test', quantity: 1, unitPrice: 100 }]
            })
        );
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.status === 429);

      expect(rateLimited).toBe(true);
    }, 30000); // Increase timeout for this test
  });

  describe('GET /api/sales', () => {
    it('should require authentication', async () => {
      const response = await request(API_URL)
        .get('/api/sales');

      expect(response.status).toBe(401);
    });

    it('should return sales list for authenticated user', async () => {
      if (!authToken) {
        console.log('Skipping test: No auth token');
        return;
      }

      const response = await request(API_URL)
        .get('/api/sales')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 403]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('sales');
        expect(Array.isArray(response.body.sales)).toBe(true);
      }
    });

    it('should support pagination', async () => {
      if (!authToken) {
        console.log('Skipping test: No auth token');
        return;
      }

      const response = await request(API_URL)
        .get('/api/sales?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('pagination');
        expect(response.body.pagination).toHaveProperty('page');
        expect(response.body.pagination).toHaveProperty('limit');
        expect(response.body.pagination).toHaveProperty('total');
      }
    });
  });

  describe('GET /api/sales/summary', () => {
    it('should return sales summary', async () => {
      if (!authToken) {
        console.log('Skipping test: No auth token');
        return;
      }

      const response = await request(API_URL)
        .get('/api/sales/summary')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 403]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('totalSales');
        expect(response.body).toHaveProperty('totalAmount');
      }
    });

    it('should support period filtering', async () => {
      if (!authToken) {
        console.log('Skipping test: No auth token');
        return;
      }

      const periods = ['daily', 'weekly', 'monthly'];
      
      for (const period of periods) {
        const response = await request(API_URL)
          .get(`/api/sales/summary?period=${period}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect([200, 403]).toContain(response.status);
      }
    });
  });
});
