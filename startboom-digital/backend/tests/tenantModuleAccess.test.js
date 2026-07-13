import { describe, it, expect } from '@jest/globals';
import { isModuleEnabled } from '../utils/moduleRegistry.js';
import { requireTenantModule } from '../middleware/tenantAuth.js';

const runMiddleware = (middleware, req) => new Promise((resolve) => {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      resolve(this);
      return this;
    }
  };

  middleware(req, res, () => resolve({ statusCode: 200, nextCalled: true }));
});

describe('tenant module access', () => {
  it('treats missing module config as enabled for backwards compatibility', () => {
    expect(isModuleEnabled(undefined, 'clients')).toBe(true);
    expect(isModuleEnabled({}, 'clients')).toBe(true);
  });

  it('supports boolean module values', () => {
    expect(isModuleEnabled({ clients: true }, 'clients')).toBe(true);
    expect(isModuleEnabled({ clients: false }, 'clients')).toBe(false);
  });

  it('supports object-shaped module values from legacy settings', () => {
    expect(isModuleEnabled({ clients: { enabled: true } }, 'clients')).toBe(true);
    expect(isModuleEnabled({ clients: { enabled: false } }, 'clients')).toBe(false);
  });

  it('normalizes module aliases', () => {
    expect(isModuleEnabled({ customFields: false }, 'custom_fields')).toBe(false);
    expect(isModuleEnabled({ schedules: false }, 'meetings')).toBe(false);
    expect(isModuleEnabled({ clients: false }, 'leads')).toBe(false);
  });

  it('blocks regular tenant users when a module is disabled', async () => {
    const result = await runMiddleware(requireTenantModule('clients'), {
      isSuperAdmin: false,
      tenant: { modules: { clients: false } }
    });

    expect(result.statusCode).toBe(403);
    expect(result.body.code).toBe('TENANT_MODULE_DISABLED');
    expect(result.body.module).toBe('clients');
  });

  it('allows superadmin regardless of tenant module state', async () => {
    const result = await runMiddleware(requireTenantModule('clients'), {
      isSuperAdmin: true,
      tenant: { modules: { clients: false } }
    });

    expect(result.nextCalled).toBe(true);
  });
});
