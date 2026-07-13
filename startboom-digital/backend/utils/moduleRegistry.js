const MODULE_ALIASES = {
  custom_fields: 'customFields',
  meetings: 'schedules',
  dashboards: 'analytics',
  intelligence: 'analytics',
  predictiveAnalytics: 'analytics',
  pipelines: 'deals',
  contacts: 'clients',
  leads: 'clients',
  myTerritory: 'territories',
  auditLogs: 'reports'
};

const normalizeModuleId = (moduleId) => MODULE_ALIASES[moduleId] || moduleId;

const readModuleValue = (modules, moduleId) => {
  if (!modules || !moduleId) return undefined;
  const normalized = normalizeModuleId(moduleId);
  const keys = [normalized, moduleId, ...Object.entries(MODULE_ALIASES)
    .filter(([, target]) => target === normalized)
    .map(([alias]) => alias)];

  for (const key of keys) {
    if (modules instanceof Map && modules.has(key)) return modules.get(key);
    if (Object.prototype.hasOwnProperty.call(modules, key)) return modules[key];
  }

  return undefined;
};

export const isModuleEnabled = (modules, moduleId) => {
  const value = readModuleValue(modules, moduleId);
  if (value === undefined) return true;
  if (value && typeof value === 'object') return value.enabled !== false && value.enabled !== 'false';
  return value !== false && value !== 'false';
};

export const canonicalModuleId = normalizeModuleId;
