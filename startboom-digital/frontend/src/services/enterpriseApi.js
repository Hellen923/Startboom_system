// Enterprise API service for new features
import api from './api';

// Departments API
export const departmentApi = {
  getAll: () => api.get('/departments'),
  getById: (id) => api.get(`/departments/${id}`),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`),
  addModule: (id, moduleData) => api.post(`/departments/${id}/modules`, moduleData),
  removeModule: (id, moduleId) => api.delete(`/departments/${id}/modules/${moduleId}`),
};

// Teams API
export const teamApi = {
  getAll: () => api.get('/teams'),
  getById: (id) => api.get(`/teams/${id}`),
  getByDepartment: (deptId) => api.get(`/teams/department/${deptId}`),
  create: (data) => api.post('/teams', data),
  update: (id, data) => api.put(`/teams/${id}`, data),
  delete: (id) => api.delete(`/teams/${id}`),
  addMember: (id, memberData) => api.post(`/teams/${id}/members`, memberData),
  removeMember: (id, userId) => api.delete(`/teams/${id}/members/${userId}`),
};

// Branches API
export const branchApi = {
  getAll: () => api.get('/branches'),
  getTree: () => api.get('/branches/tree'),
  getById: (id) => api.get(`/branches/${id}`),
  getHierarchy: (id) => api.get(`/branches/${id}/hierarchy`),
  create: (data) => api.post('/branches', data),
  update: (id, data) => api.put(`/branches/${id}`, data),
  updateStats: (id, stats) => api.patch(`/branches/${id}/stats`, stats),
  delete: (id) => api.delete(`/branches/${id}`),
};

// Goals API
export const goalApi = {
  getAll: (params) => api.get('/goals', { params }),
  getMyGoals: (params) => api.get('/goals/my-goals', { params }),
  getTeamGoals: (teamId, params) => api.get(`/goals/team/${teamId}`, { params }),
  getById: (id) => api.get(`/goals/${id}`),
  getHierarchy: (id) => api.get(`/goals/${id}/hierarchy`),
  create: (data) => api.post('/goals', data),
  update: (id, data) => api.put(`/goals/${id}`, data),
  updateProgress: (id, data) => api.patch(`/goals/${id}/progress`, data),
  cascade: (id, assignments) => api.post(`/goals/${id}/cascade`, { childAssignments: assignments }),
  delete: (id) => api.delete(`/goals/${id}`),
};

// Activities API
export const activityApi = {
  getAll: (params) => api.get('/activities', { params }),
  getMyActivities: (params) => api.get('/activities/my-activities', { params }),
  getUserStats: (userId, params) => api.get(`/activities/stats/user/${userId}`, { params }),
  getMyStats: (params) => api.get('/activities/stats/my-stats', { params }),
  getBreakdown: (userId, params) => api.get(`/activities/stats/breakdown/${userId}`, { params }),
  getTeamStats: (teamId, params) => api.get(`/activities/stats/team/${teamId}`, { params }),
  getBattleCard: (params) => api.get('/activities/stats/battle-card', { params }),
  getScores: () => api.get('/activities/scores'),
  getById: (id) => api.get(`/activities/${id}`),
  create: (data) => api.post('/activities', data),
  update: (id, data) => api.put(`/activities/${id}`, data),
  delete: (id) => api.delete(`/activities/${id}`),
};

// Forecasts API
export const forecastApi = {
  getAll: (params) => api.get('/forecasts', { params }),
  getMyForecasts: (params) => api.get('/forecasts/my-forecasts', { params }),
  getById: (id) => api.get(`/forecasts/${id}`),
  create: (data) => api.post('/forecasts', data),
  calculate: (data) => api.post('/forecasts/calculate', data),
  update: (id, data) => api.put(`/forecasts/${id}`, data),
  updateActual: (id, actual) => api.patch(`/forecasts/${id}/actual`, { actual }),
  generateInsights: (id) => api.post(`/forecasts/${id}/insights`),
  delete: (id) => api.delete(`/forecasts/${id}`),
};

// Intelligence API
export const intelligenceApi = {
  getDashboard: (params) => api.get('/intelligence/dashboard', { params }),
  getStaleClients: (params) => api.get('/intelligence/stale-clients', { params }),
  getStuckDeals: (params) => api.get('/intelligence/stuck-deals', { params }),
  getGoalPredictions: (params) => api.get('/intelligence/goal-predictions', { params }),
  getOverdueFollowups: (params) => api.get('/intelligence/overdue-followups', { params }),
  getDealsClosingSoon: (params) => api.get('/intelligence/deals-closing-soon', { params }),
  getLowActivityUsers: (params) => api.get('/intelligence/low-activity-users', { params }),
};

// Workflows API
export const workflowApi = {
  getAll: (params) => api.get('/workflows', { params }),
  getTemplates: (params) => api.get('/workflows/templates', { params }),
  getById: (id) => api.get(`/workflows/${id}`),
  getExecutions: (id, params) => api.get(`/workflows/${id}/executions`, { params }),
  getStats: (id, params) => api.get(`/workflows/${id}/stats`, { params }),
  create: (data) => api.post('/workflows', data),
  update: (id, data) => api.put(`/workflows/${id}`, data),
  clone: (id, name) => api.post(`/workflows/${id}/clone`, { name }),
  execute: (id, data) => api.post(`/workflows/${id}/execute`, data),
  toggle: (id) => api.patch(`/workflows/${id}/toggle`),
  delete: (id) => api.delete(`/workflows/${id}`),
};

// Comments API
export const commentApi = {
  getEntityComments: (entityType, entityId, params) => 
    api.get(`/comments/entity/${entityType}/${entityId}`, { params }),
  getThread: (id) => api.get(`/comments/${id}/thread`),
  create: (data) => api.post('/comments', data),
  update: (id, data) => api.put(`/comments/${id}`, data),
  addReaction: (id, emoji) => api.post(`/comments/${id}/reactions`, { emoji }),
  removeReaction: (id, emoji) => api.delete(`/comments/${id}/reactions/${emoji}`),
  pin: (id) => api.patch(`/comments/${id}/pin`),
  delete: (id) => api.delete(`/comments/${id}`),
};

// Notes API
export const noteApi = {
  getAll: (params) => api.get('/notes', { params }),
  getMyNotes: (params) => api.get('/notes/my-notes', { params }),
  getFavorites: () => api.get('/notes/favorites'),
  getById: (id) => api.get(`/notes/${id}`),
  create: (data) => api.post('/notes', data),
  update: (id, data) => api.put(`/notes/${id}`, data),
  addCollaborator: (id, data) => api.post(`/notes/${id}/collaborators`, data),
  toggleFavorite: (id) => api.patch(`/notes/${id}/favorite`),
  delete: (id) => api.delete(`/notes/${id}`),
};

// Custom Reports API
export const customReportApi = {
  getAll: (params) => api.get('/reports-custom', { params }),
  getTemplates: (params) => api.get('/reports-custom/templates', { params }),
  getById: (id) => api.get(`/reports-custom/${id}`),
  create: (data) => api.post('/reports-custom', data),
  update: (id, data) => api.put(`/reports-custom/${id}`, data),
  execute: (id) => api.post(`/reports-custom/${id}/execute`),
  clone: (id, name) => api.post(`/reports-custom/${id}/clone`, { name }),
  delete: (id) => api.delete(`/reports-custom/${id}`),
};

// Pipelines API
export const pipelineApi = {
  getAll: (params) => api.get('/pipelines', { params }),
  getDefault: (entityType) => api.get(`/pipelines/default/${entityType}`),
  getById: (id) => api.get(`/pipelines/${id}`),
  create: (data) => api.post('/pipelines', data),
  update: (id, data) => api.put(`/pipelines/${id}`, data),
  addStage: (id, stage) => api.post(`/pipelines/${id}/stages`, stage),
  removeStage: (id, stageName) => api.delete(`/pipelines/${id}/stages/${stageName}`),
  reorderStages: (id, stageOrder) => api.put(`/pipelines/${id}/stages/reorder`, { stageOrder }),
  createDefault: () => api.post('/pipelines/setup/default'),
  delete: (id) => api.delete(`/pipelines/${id}`),
};

// Custom Fields API
export const customFieldApi = {
  getAll: (params) => api.get('/custom-fields', { params }),
  getByEntity: (entityType) => api.get(`/custom-fields/entity/${entityType}`),
  getById: (id) => api.get(`/custom-fields/${id}`),
  create: (data) => api.post('/custom-fields', data),
  update: (id, data) => api.put(`/custom-fields/${id}`, data),
  validate: (entityType, data) => api.post(`/custom-fields/validate/${entityType}`, data),
  reorder: (entityType, order) => api.put(`/custom-fields/reorder/${entityType}`, { fieldOrder: order }),
  delete: (id) => api.delete(`/custom-fields/${id}`),
};

export default {
  departments: departmentApi,
  teams: teamApi,
  branches: branchApi,
  goals: goalApi,
  activities: activityApi,
  forecasts: forecastApi,
  intelligence: intelligenceApi,
  workflows: workflowApi,
  comments: commentApi,
  notes: noteApi,
  customReports: customReportApi,
  pipelines: pipelineApi,
  customFields: customFieldApi,
};
