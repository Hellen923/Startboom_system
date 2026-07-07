// services/reportEngine.js
// Report execution engine
import mongoose from 'mongoose';

/**
 * Execute a report and return results
 */
export const executeReport = async (report) => {
  const startTime = Date.now();
  
  try {
    // Get the model for the data source
    const Model = mongoose.model(report.dataSource.entity);
    
    // Build query
    const query = buildQuery(report);
    
    // Build aggregation pipeline
    const pipeline = buildAggregationPipeline(report, query);
    
    // Execute query
    let results;
    if (pipeline.length > 0) {
      results = await Model.aggregate(pipeline);
    } else {
      results = await Model.find(query)
        .select(getFieldSelection(report.dataSource.fields))
        .sort(getSortObject(report.dataSource.sortBy))
        .limit(report.dataSource.limit);
    }
    
    // Apply calculated fields
    if (report.calculatedFields && report.calculatedFields.length > 0) {
      results = applyCalculatedFields(results, report.calculatedFields);
    }
    
    // Format results
    const formattedResults = formatResults(results, report);
    
    // Calculate summary statistics
    const summary = calculateSummary(formattedResults, report);
    
    const executionTime = Date.now() - startTime;
    
    // Record execution
    await report.recordRun(executionTime);
    
    return {
      success: true,
      data: formattedResults,
      summary,
      metadata: {
        totalRecords: formattedResults.length,
        executionTime,
        generatedAt: new Date(),
        reportName: report.name,
        dataSource: report.dataSource.entity
      }
    };
    
  } catch (error) {
    console.error('Report execution error:', error);
    throw error;
  }
};

/**
 * Build MongoDB query from report filters
 */
const buildQuery = (report) => {
  const query = {
    tenant: report.tenant
  };
  
  // Apply filters
  if (report.dataSource.filters && report.dataSource.filters.length > 0) {
    const andFilters = [];
    const orFilters = [];
    
    report.dataSource.filters.forEach(filter => {
      const condition = buildFilterCondition(filter);
      
      if (filter.logicalOperator === 'OR') {
        orFilters.push(condition);
      } else {
        andFilters.push(condition);
      }
    });
    
    if (andFilters.length > 0) {
      Object.assign(query, ...andFilters);
    }
    
    if (orFilters.length > 0) {
      query.$or = orFilters;
    }
  }
  
  // Apply date range
  if (report.dataSource.dateRange && report.dataSource.dateRange.field) {
    const dateFilter = buildDateRangeFilter(report.dataSource.dateRange);
    query[report.dataSource.dateRange.field] = dateFilter;
  }
  
  return query;
};

/**
 * Build filter condition
 */
const buildFilterCondition = (filter) => {
  const { field, operator, value } = filter;
  
  switch (operator) {
    case 'equals':
      return { [field]: value };
    
    case 'not_equals':
      return { [field]: { $ne: value } };
    
    case 'greater_than':
      return { [field]: { $gt: value } };
    
    case 'less_than':
      return { [field]: { $lt: value } };
    
    case 'greater_or_equal':
      return { [field]: { $gte: value } };
    
    case 'less_or_equal':
      return { [field]: { $lte: value } };
    
    case 'contains':
      return { [field]: { $regex: value, $options: 'i' } };
    
    case 'not_contains':
      return { [field]: { $not: { $regex: value, $options: 'i' } } };
    
    case 'in':
      return { [field]: { $in: Array.isArray(value) ? value : [value] } };
    
    case 'not_in':
      return { [field]: { $nin: Array.isArray(value) ? value : [value] } };
    
    case 'is_null':
      return { [field]: null };
    
    case 'is_not_null':
      return { [field]: { $ne: null } };
    
    default:
      return { [field]: value };
  }
};

/**
 * Build date range filter
 */
const buildDateRangeFilter = (dateRange) => {
  const now = new Date();
  let startDate, endDate;
  
  switch (dateRange.type) {
    case 'today':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      endDate = new Date(now.setHours(23, 59, 59, 999));
      break;
    
    case 'yesterday':
      startDate = new Date(now.setDate(now.getDate() - 1));
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);
      break;
    
    case 'this_week':
      startDate = new Date(now.setDate(now.getDate() - now.getDay()));
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      break;
    
    case 'last_week':
      startDate = new Date(now.setDate(now.getDate() - now.getDay() - 7));
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;
    
    case 'this_month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date();
      break;
    
    case 'last_month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    
    case 'this_quarter':
      const currentQuarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
      endDate = new Date();
      break;
    
    case 'this_year':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date();
      break;
    
    case 'custom':
      startDate = dateRange.startDate;
      endDate = dateRange.endDate;
      break;
    
    case 'all_time':
      return { $exists: true };
    
    default:
      return { $exists: true };
  }
  
  return {
    $gte: startDate,
    $lte: endDate
  };
};

/**
 * Build aggregation pipeline for grouped reports
 */
const buildAggregationPipeline = (report, query) => {
  const pipeline = [];
  
  // Match stage (filters)
  pipeline.push({ $match: query });
  
  // Group stage (if groupBy specified)
  if (report.groupBy && report.groupBy.length > 0) {
    const groupStage = {
      _id: {}
    };
    
    // Build group _id
    report.groupBy.forEach(group => {
      if (group.interval) {
        // Date grouping with interval
        groupStage._id[group.field] = {
          $dateToString: {
            format: getDateFormat(group.interval),
            date: `$${group.field}`
          }
        };
      } else {
        groupStage._id[group.field] = `$${group.field}`;
      }
    });
    
    // Add aggregations
    report.dataSource.fields.forEach(field => {
      if (field.aggregate && field.aggregate !== 'none') {
        switch (field.aggregate) {
          case 'sum':
            groupStage[field.name] = { $sum: `$${field.name}` };
            break;
          case 'avg':
            groupStage[field.name] = { $avg: `$${field.name}` };
            break;
          case 'count':
            groupStage[field.name] = { $sum: 1 };
            break;
          case 'min':
            groupStage[field.name] = { $min: `$${field.name}` };
            break;
          case 'max':
            groupStage[field.name] = { $max: `$${field.name}` };
            break;
        }
      }
    });
    
    pipeline.push({ $group: groupStage });
  }
  
  // Sort stage
  if (report.dataSource.sortBy && report.dataSource.sortBy.length > 0) {
    const sortStage = {};
    report.dataSource.sortBy.forEach(sort => {
      sortStage[sort.field] = sort.order === 'asc' ? 1 : -1;
    });
    pipeline.push({ $sort: sortStage });
  }
  
  // Limit stage
  if (report.dataSource.limit) {
    pipeline.push({ $limit: report.dataSource.limit });
  }
  
  return pipeline;
};

/**
 * Get date format for grouping interval
 */
const getDateFormat = (interval) => {
  switch (interval) {
    case 'day':
      return '%Y-%m-%d';
    case 'week':
      return '%Y-W%U';
    case 'month':
      return '%Y-%m';
    case 'quarter':
      return '%Y-Q';
    case 'year':
      return '%Y';
    default:
      return '%Y-%m-%d';
  }
};

/**
 * Get field selection object
 */
const getFieldSelection = (fields) => {
  if (!fields || fields.length === 0) return {};
  
  const selection = {};
  fields.forEach(field => {
    selection[field.name] = 1;
  });
  
  return selection;
};

/**
 * Get sort object
 */
const getSortObject = (sortBy) => {
  if (!sortBy || sortBy.length === 0) return {};
  
  const sort = {};
  sortBy.forEach(s => {
    sort[s.field] = s.order === 'asc' ? 1 : -1;
  });
  
  return sort;
};

/**
 * Apply calculated fields
 */
const applyCalculatedFields = (results, calculatedFields) => {
  return results.map(row => {
    const newRow = { ...row };
    
    calculatedFields.forEach(calc => {
      try {
        // Safely evaluate formula
        const formula = calc.formula.replace(/\{(\w+)\}/g, (match, field) => {
          return `row.${field}`;
        });
        
        // eslint-disable-next-line no-eval
        newRow[calc.name] = eval(formula);
      } catch (error) {
        console.error(`Error calculating field ${calc.name}:`, error);
        newRow[calc.name] = null;
      }
    });
    
    return newRow;
  });
};

/**
 * Format results based on field formats
 */
const formatResults = (results, report) => {
  return results.map(row => {
    const formattedRow = { ...row };
    
    report.dataSource.fields.forEach(field => {
      if (formattedRow[field.name] !== undefined && field.format) {
        formattedRow[field.name] = formatValue(formattedRow[field.name], field.format);
      }
    });
    
    return formattedRow;
  });
};

/**
 * Format a single value
 */
const formatValue = (value, format) => {
  if (value === null || value === undefined) return value;
  
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    
    case 'percentage':
      return `${(value * 100).toFixed(2)}%`;
    
    case 'number':
      return new Intl.NumberFormat('en-US').format(value);
    
    case 'date':
      return new Date(value).toLocaleDateString();
    
    default:
      return value;
  }
};

/**
 * Calculate summary statistics
 */
const calculateSummary = (results, report) => {
  const summary = {};
  
  report.dataSource.fields.forEach(field => {
    if (field.type === 'number' && field.aggregate) {
      const values = results.map(r => r[field.name]).filter(v => v !== null && v !== undefined);
      
      switch (field.aggregate) {
        case 'sum':
          summary[`${field.name}_sum`] = values.reduce((a, b) => a + b, 0);
          break;
        case 'avg':
          summary[`${field.name}_avg`] = values.reduce((a, b) => a + b, 0) / values.length;
          break;
        case 'min':
          summary[`${field.name}_min`] = Math.min(...values);
          break;
        case 'max':
          summary[`${field.name}_max`] = Math.max(...values);
          break;
      }
    }
  });
  
  return summary;
};

export default {
  executeReport
};
