// services/workflowEngine.js
// Core workflow execution engine
import Workflow from '../models/Workflow.js';
import WorkflowExecution from '../models/WorkflowExecution.js';
import User from '../models/User.js';
import { sendEmail } from './emailService.js';

/**
 * Execute workflow based on trigger
 */
export const executeWorkflow = async (workflowId, triggerEntity, triggerData = {}) => {
  const startTime = Date.now();
  let execution;
  
  try {
    // Load workflow
    const workflow = await Workflow.findById(workflowId);
    
    if (!workflow || !workflow.settings.isActive) {
      throw new Error('Workflow not found or inactive');
    }
    
    // Create execution log
    execution = new WorkflowExecution({
      tenant: workflow.tenant,
      workflow: workflow._id,
      workflowName: workflow.name,
      triggerType: workflow.trigger.type,
      triggerEntity: triggerEntity?._id,
      triggerEntityType: triggerEntity?.constructor?.modelName,
      status: 'running',
      context: {
        ...triggerData,
        entity: triggerEntity
      }
    });
    await execution.save();
    
    // Check conditions
    if (workflow.trigger.conditions && workflow.trigger.conditions.length > 0) {
      const conditionsMet = evaluateConditions(workflow.trigger.conditions, triggerEntity, triggerData);
      
      if (!conditionsMet) {
        await execution.complete(true, { message: 'Conditions not met, workflow skipped' });
        return execution;
      }
    }
    
    // Execute actions in order
    const sortedActions = workflow.actions.sort((a, b) => a.order - b.order);
    
    for (let i = 0; i < sortedActions.length; i++) {
      const action = sortedActions[i];
      const actionStart = Date.now();
      
      try {
        const result = await executeAction(action, triggerEntity, triggerData, workflow.tenant);
        
        execution.actionsExecuted.push({
          actionType: action.type,
          status: 'completed',
          startedAt: new Date(actionStart),
          completedAt: new Date(),
          result
        });
      } catch (error) {
        console.error(`Action execution error in workflow ${workflow.name}:`, error);
        
        execution.actionsExecuted.push({
          actionType: action.type,
          status: 'failed',
          startedAt: new Date(actionStart),
          completedAt: new Date(),
          error: error.message
        });
        
        // Handle error based on action config
        if (action.onError === 'stop' || workflow.settings.stopOnError) {
          throw error;
        }
        
        // Retry if configured
        if (action.onError === 'retry' && action.retryConfig) {
          // Retry logic would go here (simplified for now)
          console.log(`Retrying action ${action.type}...`);
        }
      }
    }
    
    // Mark as completed
    const executionTime = Date.now() - startTime;
    await execution.complete(true, { 
      message: 'Workflow executed successfully',
      data: { actionsCompleted: execution.actionsExecuted.length }
    });
    
    // Update workflow stats
    await workflow.recordExecution(true, executionTime);
    
    // Send notification if configured
    if (workflow.settings.notifyOnExecution && workflow.settings.notificationRecipients?.length > 0) {
      await sendExecutionNotification(workflow, execution, true);
    }
    
    return execution;
    
  } catch (error) {
    console.error('Workflow execution error:', error);
    
    const executionTime = Date.now() - startTime;
    
    if (execution) {
      await execution.complete(false, {}, error);
    }
    
    // Update workflow stats
    const workflow = await Workflow.findById(workflowId);
    if (workflow) {
      await workflow.recordExecution(false, executionTime, error.message);
      
      // Send error notification
      if (workflow.settings.notifyOnError && workflow.settings.notificationRecipients?.length > 0) {
        await sendExecutionNotification(workflow, execution, false, error);
      }
    }
    
    throw error;
  }
};

/**
 * Execute a single action
 */
const executeAction = async (action, entity, triggerData, tenantId) => {
  switch (action.type) {
    case 'send_email':
      return await executeSendEmail(action, entity, triggerData);
    
    case 'send_notification':
      return await executeSendNotification(action, entity, triggerData, tenantId);
    
    case 'update_field':
      return await executeUpdateField(action, entity);
    
    case 'update_stage':
      return await executeUpdateStage(action, entity);
    
    case 'assign_to_user':
      return await executeAssignToUser(action, entity);
    
    case 'add_tag':
      return await executeAddTag(action, entity);
    
    case 'create_task':
      return await executeCreateTask(action, entity, triggerData, tenantId);
    
    case 'create_activity':
      return await executeCreateActivity(action, entity, triggerData, tenantId);
    
    case 'trigger_webhook':
      return await executeTriggerWebhook(action, entity, triggerData);
    
    case 'wait':
      return await executeWait(action);
    
    default:
      console.log(`Action type ${action.type} not yet implemented`);
      return { success: true, message: `Action ${action.type} skipped (not implemented)` };
  }
};

/**
 * Evaluate trigger conditions
 */
const evaluateConditions = (conditions, entity, triggerData) => {
  for (const condition of conditions) {
    const value = getNestedValue(entity, condition.field) || getNestedValue(triggerData, condition.field);
    const conditionMet = evaluateCondition(value, condition.operator, condition.value);
    
    if (!conditionMet) {
      return false;
    }
  }
  
  return true;
};

/**
 * Evaluate a single condition
 */
const evaluateCondition = (actualValue, operator, expectedValue) => {
  switch (operator) {
    case 'equals':
      return actualValue == expectedValue;
    
    case 'not_equals':
      return actualValue != expectedValue;
    
    case 'greater_than':
      return actualValue > expectedValue;
    
    case 'less_than':
      return actualValue < expectedValue;
    
    case 'greater_or_equal':
      return actualValue >= expectedValue;
    
    case 'less_or_equal':
      return actualValue <= expectedValue;
    
    case 'contains':
      return String(actualValue).includes(String(expectedValue));
    
    case 'not_contains':
      return !String(actualValue).includes(String(expectedValue));
    
    case 'in':
      return Array.isArray(expectedValue) && expectedValue.includes(actualValue);
    
    case 'not_in':
      return Array.isArray(expectedValue) && !expectedValue.includes(actualValue);
    
    case 'is_empty':
      return !actualValue || (Array.isArray(actualValue) && actualValue.length === 0);
    
    case 'is_not_empty':
      return !!actualValue && (!Array.isArray(actualValue) || actualValue.length > 0);
    
    default:
      return false;
  }
};

// Action Executors

const executeSendEmail = async (action, entity, triggerData) => {
  const { subject, body, recipients, template } = action.config;
  
  // Replace placeholders in subject and body
  const finalSubject = replacePlaceholders(subject, entity, triggerData);
  const finalBody = replacePlaceholders(body, entity, triggerData);
  
  // Send email to each recipient
  for (const recipient of recipients || []) {
    await sendEmail({
      to: recipient,
      subject: finalSubject,
      text: finalBody,
      html: finalBody
    });
  }
  
  return { success: true, message: `Email sent to ${recipients?.length || 0} recipients` };
};

const executeSendNotification = async (action, entity, triggerData, tenantId) => {
  const Notification = (await import('../models/Notification.js')).default;
  
  const { title, body, recipients } = action.config;
  
  const finalTitle = replacePlaceholders(title, entity, triggerData);
  const finalBody = replacePlaceholders(body, entity, triggerData);
  
  // Create notification for each recipient
  for (const recipientId of recipients || []) {
    await Notification.create({
      tenant: tenantId,
      user: recipientId,
      title: finalTitle,
      message: finalBody,
      type: 'automation',
      relatedEntity: entity?._id,
      relatedEntityType: entity?.constructor?.modelName
    });
  }
  
  return { success: true, message: `Notification sent to ${recipients?.length || 0} users` };
};

const executeUpdateField = async (action, entity) => {
  const { field, value } = action.config;
  
  if (!entity || !field) {
    throw new Error('Entity or field not specified');
  }
  
  setNestedValue(entity, field, value);
  await entity.save();
  
  return { success: true, message: `Field ${field} updated to ${value}` };
};

const executeUpdateStage = async (action, entity) => {
  if (!entity || !entity.stage) {
    throw new Error('Entity does not have a stage field');
  }
  
  entity.stage = action.config.value;
  entity.stageEntryDate = new Date();
  await entity.save();
  
  return { success: true, message: `Stage updated to ${action.config.value}` };
};

const executeAssignToUser = async (action, entity) => {
  const { userId } = action.config;
  
  if (!entity) {
    throw new Error('Entity not specified');
  }
  
  entity.owner = userId;
  entity.assignedTo = userId;
  await entity.save();
  
  return { success: true, message: `Assigned to user ${userId}` };
};

const executeAddTag = async (action, entity) => {
  const { value } = action.config;
  
  if (!entity) {
    throw new Error('Entity not specified');
  }
  
  if (!entity.tags) {
    entity.tags = [];
  }
  
  if (!entity.tags.includes(value)) {
    entity.tags.push(value);
    await entity.save();
  }
  
  return { success: true, message: `Tag ${value} added` };
};

const executeCreateTask = async (action, entity, triggerData, tenantId) => {
  // Task creation would integrate with your task system
  console.log('Create task action:', action.config);
  
  return { success: true, message: 'Task created (placeholder)' };
};

const executeCreateActivity = async (action, entity, triggerData, tenantId) => {
  const Activity = (await import('../models/Activity.js')).default;
  
  const { title, description, type, userId } = action.config;
  
  await Activity.create({
    tenant: tenantId,
    user: userId,
    type: type || 'note',
    title: replacePlaceholders(title, entity, triggerData),
    description: replacePlaceholders(description, entity, triggerData),
    entityType: entity?.constructor?.modelName?.toLowerCase(),
    entityId: entity?._id
  });
  
  return { success: true, message: 'Activity created' };
};

const executeTriggerWebhook = async (action, entity, triggerData) => {
  const { url, method, headers, payload } = action.config;
  
  const finalPayload = replacePlaceholders(JSON.stringify(payload || {}), entity, triggerData);
  
  const response = await fetch(url, {
    method: method || 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: finalPayload
  });
  
  return { 
    success: response.ok, 
    message: `Webhook triggered: ${response.status}`,
    data: await response.json().catch(() => null)
  };
};

const executeWait = async (action) => {
  const { delay } = action.config;
  
  if (delay) {
    await new Promise(resolve => setTimeout(resolve, delay * 60 * 1000));
  }
  
  return { success: true, message: `Waited ${delay} minutes` };
};

// Helper functions

const replacePlaceholders = (text, entity, triggerData) => {
  if (!text) return text;
  
  let result = String(text);
  
  // Replace {{entity.field}} placeholders
  const entityMatches = result.match(/\{\{entity\.(\w+)\}\}/g);
  if (entityMatches) {
    entityMatches.forEach(match => {
      const field = match.replace('{{entity.', '').replace('}}', '');
      const value = getNestedValue(entity, field);
      result = result.replace(match, value || '');
    });
  }
  
  // Replace {{trigger.field}} placeholders
  const triggerMatches = result.match(/\{\{trigger\.(\w+)\}\}/g);
  if (triggerMatches) {
    triggerMatches.forEach(match => {
      const field = match.replace('{{trigger.', '').replace('}}', '');
      const value = getNestedValue(triggerData, field);
      result = result.replace(match, value || '');
    });
  }
  
  return result;
};

const getNestedValue = (obj, path) => {
  if (!obj || !path) return null;
  
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

const setNestedValue = (obj, path, value) => {
  if (!obj || !path) return;
  
  const keys = path.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((current, key) => current[key] = current[key] || {}, obj);
  target[lastKey] = value;
};

const sendExecutionNotification = async (workflow, execution, success, error = null) => {
  const subject = success 
    ? `Workflow Executed: ${workflow.name}`
    : `Workflow Failed: ${workflow.name}`;
  
  const body = success
    ? `Workflow "${workflow.name}" executed successfully.\n\nActions completed: ${execution.actionsExecuted.length}\nExecution time: ${execution.executionTime}ms`
    : `Workflow "${workflow.name}" failed.\n\nError: ${error?.message || 'Unknown error'}\n\nExecution time: ${execution.executionTime}ms`;
  
  for (const recipient of workflow.settings.notificationRecipients) {
    await sendEmail({
      to: recipient,
      subject,
      text: body
    });
  }
};

export default {
  executeWorkflow
};
