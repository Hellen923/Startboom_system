// services/queryBuilder.js

/**
 * Build MongoDB query with security filters based on user permissions
 * This ensures users only see data they're allowed to see
 * 
 * 5-Level Hierarchy: Own → Team → Department → Branch → Company (All)
 */
export const buildSecurityQuery = (user, permissions = {}, baseQuery = {}) => {
  // Start with base query (usually just tenant filter)
  const query = { 
    tenant: user.tenant,
    ...baseQuery 
  };
  
  // Superadmin sees everything
  if (user.role === 'superadmin') {
    return query;
  }
  
  // Determine scope level from permissions (5-level hierarchy)
  let scopeLevel = 'own'; // Default: only see own records
  
  if (permissions.viewAll) {
    scopeLevel = 'all';
  } else if (permissions.viewBranch) {
    scopeLevel = 'branch';
  } else if (permissions.viewDepartment) {
    scopeLevel = 'department';
  } else if (permissions.viewTeam) {
    scopeLevel = 'team';
  } else if (permissions.viewOwn) {
    scopeLevel = 'own';
  }
  
  // Apply scope filters
  switch (scopeLevel) {
    case 'all':
      // No additional filters - can see everything in tenant
      break;
      
    case 'branch':
      // Can see all records in their branch
      if (user.branch) {
        query.branch = user.branch;
      }
      break;
      
    case 'department':
      // Can see all records in their department
      if (user.department) {
        query.department = user.department;
      }
      break;
      
    case 'team':
      // Can see records from their team
      if (user.team) {
        query.team = user.team;
      }
      break;
      
    case 'own':
    default:
      // Can only see their own records
      query.owner = user._id;
      break;
  }
  
  return query;
};

/**
 * Build query for resources that might be shared
 * Allows viewing records user owns OR records shared with them
 */
export const buildSecurityQueryWithSharing = (user, permissions = {}, baseQuery = {}) => {
  const query = buildSecurityQuery(user, permissions, baseQuery);
  
  // If user can only see own records, also include records shared with them
  if (query.owner) {
    delete query.owner;
    query.$or = [
      { owner: user._id },
      { 'sharedWith.user': user._id }
    ];
  }
  
  return query;
};

/**
 * Check if user can access a specific record
 * 5-Level Hierarchy Check
 */
export const canAccessRecord = (user, record, permissions = {}) => {
  // Superadmin can access everything
  if (user.role === 'superadmin') {
    return true;
  }
  
  // Check tenant match
  if (record.tenant.toString() !== user.tenant.toString()) {
    return false;
  }
  
  // Determine scope level
  if (permissions.viewAll) {
    return true;
  }
  
  if (permissions.viewBranch) {
    return record.branch?.toString() === user.branch?.toString();
  }
  
  if (permissions.viewDepartment) {
    return record.department?.toString() === user.department?.toString();
  }
  
  if (permissions.viewTeam) {
    return record.team?.toString() === user.team?.toString();
  }
  
  if (permissions.viewOwn) {
    // Check if user is the owner
    if (record.owner?.toString() === user._id.toString()) {
      return true;
    }
    
    // Check if record is shared with user
    if (record.sharedWith) {
      const isShared = record.sharedWith.some(
        share => share.user.toString() === user._id.toString()
      );
      if (isShared) return true;
    }
  }
  
  return false;
};

/**
 * Filter an array of records based on user permissions
 */
export const filterAccessibleRecords = (user, records, permissions = {}) => {
  return records.filter(record => canAccessRecord(user, record, permissions));
};

/**
 * Build aggregation pipeline with security filters
 * Useful for MongoDB aggregation queries
 */
export const buildSecurityPipeline = (user, permissions = {}) => {
  const matchStage = buildSecurityQuery(user, permissions);
  
  return [
    { $match: matchStage }
  ];
};

/**
 * Get permission scope description (for UI display)
 */
export const getScopeDescription = (permissions = {}) => {
  if (permissions.viewAll) {
    return 'Can view all records in the company';
  }
  if (permissions.viewBranch) {
    return 'Can view all records in their branch';
  }
  if (permissions.viewDepartment) {
    return 'Can view all records in their department';
  }
  if (permissions.viewTeam) {
    return 'Can view all records in their team';
  }
  if (permissions.viewOwn) {
    return 'Can view only their own records';
  }
  return 'No access';
};

export default {
  buildSecurityQuery,
  buildSecurityQueryWithSharing,
  canAccessRecord,
  filterAccessibleRecords,
  buildSecurityPipeline,
  getScopeDescription
};
