// Metric Aggregation Service - Cascades metrics from employee → team → department → company
import User from '../models/User.js';
import Team from '../models/Team.js';
import Department from '../models/Department.js';
import Tenant from '../models/Tenant.js';
import Deal from '../models/Deal.js';
import Sale from '../models/Sale.js';
import Client from '../models/Client.js';

/**
 * Calculate metrics for a specific user (employee)
 */
export const calculateUserMetrics = async (userId, startDate, endDate) => {
  try {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const dateFilter = {};
    if (startDate) dateFilter.$gte = startDate;
    if (endDate) dateFilter.$lte = endDate;

    // Fetch user's deals
    const deals = await Deal.find({
      agent: userId,
      ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
    });

    // Fetch user's sales
    const sales = await Sale.find({
      agent: userId,
      ...(Object.keys(dateFilter).length > 0 && { saleDate: dateFilter })
    });

    // Fetch user's clients
    const clients = await Client.find({
      agent: userId,
      ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
    });

    // Calculate metrics
    const wonDeals = deals.filter(d => d.stage === 'won');
    const totalRevenue = sales.reduce((sum, sale) => sum + (sale.finalAmount || 0), 0);
    const averageDealSize = wonDeals.length > 0 
      ? wonDeals.reduce((sum, d) => sum + (d.value || 0), 0) / wonDeals.length 
      : 0;

    return {
      userId: user._id,
      userName: user.name,
      position: user.position || 'Employee',
      department: user.department,
      team: user.team,
      metrics: {
        totalDeals: deals.length,
        wonDeals: wonDeals.length,
        lostDeals: deals.filter(d => d.stage === 'lost').length,
        activeDeals: deals.filter(d => !['won', 'lost'].includes(d.stage)).length,
        totalSales: sales.length,
        totalRevenue,
        averageDealSize,
        totalClients: clients.length,
        conversionRate: deals.length > 0 ? (wonDeals.length / deals.length) * 100 : 0
      },
      period: {
        startDate,
        endDate
      }
    };
  } catch (error) {
    console.error('Error calculating user metrics:', error);
    throw error;
  }
};

/**
 * Aggregate metrics for a team
 */
export const calculateTeamMetrics = async (teamId, startDate, endDate) => {
  try {
    const team = await Team.findById(teamId).populate('department');
    if (!team) throw new Error('Team not found');

    // Get all active team members
    const memberIds = team.members
      .filter(m => m.isActive)
      .map(m => m.user);

    // Calculate metrics for each member
    const memberMetrics = await Promise.all(
      memberIds.map(id => calculateUserMetrics(id, startDate, endDate))
    );

    // Aggregate team metrics
    const aggregated = memberMetrics.reduce((acc, member) => {
      acc.totalDeals += member.metrics.totalDeals;
      acc.wonDeals += member.metrics.wonDeals;
      acc.lostDeals += member.metrics.lostDeals;
      acc.activeDeals += member.metrics.activeDeals;
      acc.totalSales += member.metrics.totalSales;
      acc.totalRevenue += member.metrics.totalRevenue;
      acc.totalClients += member.metrics.totalClients;
      return acc;
    }, {
      totalDeals: 0,
      wonDeals: 0,
      lostDeals: 0,
      activeDeals: 0,
      totalSales: 0,
      totalRevenue: 0,
      totalClients: 0
    });

    aggregated.conversionRate = aggregated.totalDeals > 0 
      ? (aggregated.wonDeals / aggregated.totalDeals) * 100 
      : 0;
    aggregated.averageDealSize = aggregated.wonDeals > 0 
      ? aggregated.totalRevenue / aggregated.wonDeals 
      : 0;
    aggregated.averageRevenuePerMember = memberMetrics.length > 0
      ? aggregated.totalRevenue / memberMetrics.length
      : 0;

    return {
      teamId: team._id,
      teamName: team.name,
      department: team.department,
      memberCount: memberIds.length,
      metrics: aggregated,
      members: memberMetrics,
      period: {
        startDate,
        endDate
      }
    };
  } catch (error) {
    console.error('Error calculating team metrics:', error);
    throw error;
  }
};

/**
 * Aggregate metrics for a department
 */
export const calculateDepartmentMetrics = async (departmentId, startDate, endDate) => {
  try {
    const department = await Department.findById(departmentId);
    if (!department) throw new Error('Department not found');

    // Get all teams in department
    const teams = await Team.find({ 
      department: departmentId, 
      isActive: true 
    });

    // Calculate metrics for each team
    const teamMetrics = await Promise.all(
      teams.map(t => calculateTeamMetrics(t._id, startDate, endDate))
    );

    // Aggregate department metrics
    const aggregated = teamMetrics.reduce((acc, team) => {
      acc.totalDeals += team.metrics.totalDeals;
      acc.wonDeals += team.metrics.wonDeals;
      acc.lostDeals += team.metrics.lostDeals;
      acc.activeDeals += team.metrics.activeDeals;
      acc.totalSales += team.metrics.totalSales;
      acc.totalRevenue += team.metrics.totalRevenue;
      acc.totalClients += team.metrics.totalClients;
      acc.totalMembers += team.memberCount;
      return acc;
    }, {
      totalDeals: 0,
      wonDeals: 0,
      lostDeals: 0,
      activeDeals: 0,
      totalSales: 0,
      totalRevenue: 0,
      totalClients: 0,
      totalMembers: 0
    });

    aggregated.conversionRate = aggregated.totalDeals > 0 
      ? (aggregated.wonDeals / aggregated.totalDeals) * 100 
      : 0;
    aggregated.averageDealSize = aggregated.wonDeals > 0 
      ? aggregated.totalRevenue / aggregated.wonDeals 
      : 0;
    aggregated.averageRevenuePerTeam = teamMetrics.length > 0
      ? aggregated.totalRevenue / teamMetrics.length
      : 0;
    aggregated.averageRevenuePerMember = aggregated.totalMembers > 0
      ? aggregated.totalRevenue / aggregated.totalMembers
      : 0;

    return {
      departmentId: department._id,
      departmentName: department.name,
      teamCount: teams.length,
      memberCount: aggregated.totalMembers,
      metrics: aggregated,
      teams: teamMetrics,
      period: {
        startDate,
        endDate
      }
    };
  } catch (error) {
    console.error('Error calculating department metrics:', error);
    throw error;
  }
};

/**
 * Aggregate metrics for entire company (tenant)
 */
export const calculateCompanyMetrics = async (tenantId, startDate, endDate) => {
  try {
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) throw new Error('Tenant not found');

    // Get all departments
    const departments = await Department.find({ 
      tenant: tenantId, 
      isActive: true 
    });

    // Calculate metrics for each department
    const departmentMetrics = await Promise.all(
      departments.map(d => calculateDepartmentMetrics(d._id, startDate, endDate))
    );

    // Aggregate company metrics
    const aggregated = departmentMetrics.reduce((acc, dept) => {
      acc.totalDeals += dept.metrics.totalDeals;
      acc.wonDeals += dept.metrics.wonDeals;
      acc.lostDeals += dept.metrics.lostDeals;
      acc.activeDeals += dept.metrics.activeDeals;
      acc.totalSales += dept.metrics.totalSales;
      acc.totalRevenue += dept.metrics.totalRevenue;
      acc.totalClients += dept.metrics.totalClients;
      acc.totalMembers += dept.memberCount;
      acc.totalTeams += dept.teamCount;
      return acc;
    }, {
      totalDeals: 0,
      wonDeals: 0,
      lostDeals: 0,
      activeDeals: 0,
      totalSales: 0,
      totalRevenue: 0,
      totalClients: 0,
      totalMembers: 0,
      totalTeams: 0
    });

    aggregated.conversionRate = aggregated.totalDeals > 0 
      ? (aggregated.wonDeals / aggregated.totalDeals) * 100 
      : 0;
    aggregated.averageDealSize = aggregated.wonDeals > 0 
      ? aggregated.totalRevenue / aggregated.wonDeals 
      : 0;
    aggregated.averageRevenuePerDepartment = departmentMetrics.length > 0
      ? aggregated.totalRevenue / departmentMetrics.length
      : 0;
    aggregated.averageRevenuePerTeam = aggregated.totalTeams > 0
      ? aggregated.totalRevenue / aggregated.totalTeams
      : 0;
    aggregated.averageRevenuePerMember = aggregated.totalMembers > 0
      ? aggregated.totalRevenue / aggregated.totalMembers
      : 0;

    return {
      tenantId: tenant._id,
      companyName: tenant.name,
      departmentCount: departments.length,
      teamCount: aggregated.totalTeams,
      memberCount: aggregated.totalMembers,
      metrics: aggregated,
      departments: departmentMetrics,
      period: {
        startDate,
        endDate
      }
    };
  } catch (error) {
    console.error('Error calculating company metrics:', error);
    throw error;
  }
};

/**
 * Get cascading metrics for a specific level
 */
export const getCascadingMetrics = async (level, id, startDate, endDate) => {
  switch (level) {
    case 'user':
    case 'employee':
      return await calculateUserMetrics(id, startDate, endDate);
    case 'team':
      return await calculateTeamMetrics(id, startDate, endDate);
    case 'department':
      return await calculateDepartmentMetrics(id, startDate, endDate);
    case 'company':
    case 'tenant':
      return await calculateCompanyMetrics(id, startDate, endDate);
    default:
      throw new Error(`Invalid level: ${level}`);
  }
};

export default {
  calculateUserMetrics,
  calculateTeamMetrics,
  calculateDepartmentMetrics,
  calculateCompanyMetrics,
  getCascadingMetrics
};
