// utils/ratingSystem.js
import User from '../models/User.js';
import Deal from '../models/Deal.js';

/**
 * Calculate automatic ratings for all agents based on won deal values
 * Rating is based on the highest value of won deals relative to other agents
 */
export const calculateAgentRatings = async (tenantId = null) => {
  try {
    const query = { role: 'agent', isActive: true };
    if (tenantId) query.tenant = tenantId;
    const agents = await User.find(query);
    if (agents.length === 0) return [];

    const dealQuery = tenantId ? { tenant: tenantId } : {};
    const agentStats = await Promise.all(
      agents.map(async (agent) => {
        const wonDeals = await Deal.find({ agent: agent._id, stage: 'won', ...dealQuery });
        const totalWonValue = wonDeals.reduce((sum, deal) => sum + (Number(deal.value) || 0), 0);
        const wonDealsCount = wonDeals.length;
        return {
          agentId: agent._id,
          name: agent.name,
          totalWonValue,
          wonDealsCount,
          avgDealValue: wonDealsCount > 0 ? totalWonValue / wonDealsCount : 0
        };
      })
    );

    // Sort agents by total won deal value (highest first)
    agentStats.sort((a, b) => b.totalWonValue - a.totalWonValue);

    // Calculate ratings based on ranking and value thresholds
    const maxValue = Math.max(...agentStats.map(a => a.totalWonValue));
    const avgValue = agentStats.reduce((sum, a) => sum + a.totalWonValue, 0) / agentStats.length;

    const ratings = agentStats.map((agent, index) => {
      let rating = 1; // Default rating

      // Rating based on value thresholds relative to max
      const valueRatio = agent.totalWonValue / maxValue;

      if (valueRatio >= 0.9) rating = 5; // Top 10% of max value
      else if (valueRatio >= 0.7) rating = 4; // Top 30% of max value
      else if (valueRatio >= 0.5) rating = 3; // Top 50% of max value
      else if (valueRatio >= 0.3) rating = 2; // Top 70% of max value
      else rating = 1;

      // Bonus for consistency (having multiple won deals)
      if (agent.wonDealsCount >= 10) rating = Math.min(5, rating + 0.5);
      else if (agent.wonDealsCount >= 5) rating = Math.min(5, rating + 0.25);

      // Bonus for high average deal value
      if (agent.avgDealValue > avgValue * 1.5) rating = Math.min(5, rating + 0.5);
      else if (agent.avgDealValue > avgValue * 1.2) rating = Math.min(5, rating + 0.25);

      return {
        agentId: agent.agentId,
        rating: Math.round(rating * 10) / 10, // Round to 1 decimal place
        totalWonValue: agent.totalWonValue,
        wonDealsCount: agent.wonDealsCount
      };
    });

    // Update agent ratings in database
    const updatePromises = ratings.map(async (rating) => {
      await User.findByIdAndUpdate(rating.agentId, {
        performanceScore: rating.rating,
        lastRankUpdate: new Date()
      });
    });

    await Promise.all(updatePromises);


    return ratings;
  } catch (error) {
    console.error('❌ Error calculating agent ratings:', error);
    throw error;
  }
};

/**
 * Get current agent rankings
 */
export const getAgentRankings = async (tenantId = null) => {
  try {
    const query = { role: 'agent', isActive: true };
    if (tenantId) query.tenant = tenantId;
    const agents = await User.find(query, 'name email performanceScore totalDeals successfulDeals')
      .sort({ performanceScore: -1 });

    return agents.map((agent, index) => ({
      rank: index + 1,
      agent: {
        id: agent._id,
        name: agent.name,
        email: agent.email
      },
      rating: agent.performanceScore,
      totalDeals: agent.totalDeals,
      successfulDeals: agent.successfulDeals
    }));
  } catch (error) {
    console.error('Error getting agent rankings:', error);
    throw error;
  }
};

/**
 * Update single agent rating (useful after deal changes)
 */
export const updateAgentRating = async (agentId) => {
  try {
    // Get agent's won deals
    const wonDeals = await Deal.find({
      agent: agentId,
      stage: 'won'
    });

    const totalWonValue = wonDeals.reduce((sum, deal) => sum + (Number(deal.value) || 0), 0);

    // Get all agents for comparison
    const allAgents = await User.find({ role: 'agent', isActive: true });
    const allAgentStats = await Promise.all(
      allAgents.map(async (agent) => {
        const agentWonDeals = await Deal.find({
          agent: agent._id,
          stage: 'won'
        });
        const agentTotalValue = agentWonDeals.reduce((sum, deal) => sum + (Number(deal.value) || 0), 0);
        return { id: agent._id, totalValue: agentTotalValue, dealsCount: agentWonDeals.length };
      })
    );

    // Sort by value
    allAgentStats.sort((a, b) => b.totalValue - a.totalValue);
    const maxValue = Math.max(...allAgentStats.map(a => a.totalValue));
    const avgValue = allAgentStats.reduce((sum, a) => sum + a.totalValue, 0) / allAgentStats.length;

    // Find current agent stats
    const currentAgentStats = allAgentStats.find(a => a.id.toString() === agentId.toString());
    if (!currentAgentStats) return;

    // Calculate rating
    let rating = 1;
    const valueRatio = currentAgentStats.totalValue / maxValue;

    if (valueRatio >= 0.9) rating = 5;
    else if (valueRatio >= 0.7) rating = 4;
    else if (valueRatio >= 0.5) rating = 3;
    else if (valueRatio >= 0.3) rating = 2;

    // Bonuses
    if (currentAgentStats.dealsCount >= 10) rating = Math.min(5, rating + 0.5);
    else if (currentAgentStats.dealsCount >= 5) rating = Math.min(5, rating + 0.25);

    if (currentAgentStats.dealsCount > 0) {
      const avgDealValue = currentAgentStats.totalValue / currentAgentStats.dealsCount;
      if (avgDealValue > avgValue * 1.5) rating = Math.min(5, rating + 0.5);
      else if (avgDealValue > avgValue * 1.2) rating = Math.min(5, rating + 0.25);
    }

    // Update agent
    await User.findByIdAndUpdate(agentId, {
      performanceScore: Math.round(rating * 10) / 10,
      lastRankUpdate: new Date()
    });


    return Math.round(rating * 10) / 10;
  } catch (error) {
    console.error('Error updating agent rating:', error);
    throw error;
  }
};

/**
 * Schedule automatic rating updates (call this on server start)
 */
export const scheduleRatingUpdates = () => {
  // Update ratings every 6 hours
  setInterval(async () => {
    try {
      await calculateAgentRatings();
    } catch (error) {
      console.error('Scheduled rating update failed:', error);
    }
  }, 6 * 60 * 60 * 1000); // 6 hours

  // Also update on startup
  calculateAgentRatings();
};

