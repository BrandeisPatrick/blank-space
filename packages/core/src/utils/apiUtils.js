/**
 * Shared API Utilities
 * Common functions for API calls across all agents
 */

import { auth } from '../../config/firebase.js';

/**
 * Get auth headers for API requests
 * @param {string} context - Context for logging (e.g., 'Code Agent')
 * @returns {Promise<Object>} Headers object with Content-Type and optional Authorization
 */
export async function getAuthHeaders(context = 'API') {
  const headers = { 'Content-Type': 'application/json' };
  try {
    if (auth?.currentUser) {
      const token = await auth.currentUser.getIdToken(true);
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (error) {
    console.warn(`[${context}] Failed to get auth token:`, error.message);
  }
  return headers;
}

/**
 * Execute a tool/function call with error handling
 * @param {string} name - Tool name
 * @param {Object} args - Tool arguments
 * @param {Object} executor - ToolExecutor instance
 * @param {Object} context - Execution context
 * @returns {Promise<Object>} Result object with success status
 */
export async function executeFunction(name, args, executor, context) {
  try {
    const result = await executor.execute(name, args, context);
    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Create a quota exceeded error with standard properties
 * @param {Object} errorData - Error data from API response
 * @returns {Error} Error with quota properties
 */
export function createQuotaError(errorData) {
  const err = new Error(errorData.message || 'Quota exceeded');
  err.isQuotaExceeded = true;
  err.quota = errorData.quota;
  err.upgradeUrl = errorData.upgradeUrl || '/pricing';
  return err;
}

/**
 * Handle API response errors with quota detection
 * @param {Response} response - Fetch response
 * @returns {Promise<void>} Throws error if response is not ok
 */
export async function handleAPIError(response) {
  if (response.ok) return;

  const errorData = await response.json().catch(() => ({}));

  if (response.status === 429 && errorData.quota) {
    throw createQuotaError(errorData);
  }

  throw new Error(errorData.message || `API error: ${response.status}`);
}

export default {
  getAuthHeaders,
  executeFunction,
  createQuotaError,
  handleAPIError
};
