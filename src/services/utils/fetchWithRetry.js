/**
 * Fetch with Retry and Timeout
 * Shared utility for making HTTP requests with:
 * - Timeout enforcement via AbortController
 * - Exponential backoff retry on transient errors
 * - Consistent error handling
 */

/**
 * Sleep utility for retry delays
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if HTTP status code is retryable
 */
function isRetryableStatus(status) {
  return (
    status === 429 || // Rate limit
    status === 500 || // Server error
    status === 502 || // Bad gateway
    status === 503 || // Service unavailable
    status === 504    // Gateway timeout
  );
}

/**
 * Check if error is retryable
 */
function isRetryableError(error) {
  return (
    error.name === 'AbortError' ||
    error.message?.includes('timeout') ||
    error.message?.includes('network') ||
    error.code === 'ECONNRESET' ||
    error.code === 'ETIMEDOUT' ||
    error.code === 'ENOTFOUND'
  );
}

/**
 * Fetch with automatic retry and timeout
 *
 * @param {string} url - URL to fetch
 * @param {RequestInit} options - Fetch options (method, headers, body, etc.)
 * @param {Object} config - Retry/timeout configuration
 * @param {number} [config.timeout=30000] - Timeout in milliseconds
 * @param {number} [config.maxRetries=3] - Maximum retry attempts
 * @param {number} [config.baseDelay=1000] - Base delay for exponential backoff
 * @param {string} [config.context='fetch'] - Context for logging
 * @returns {Promise<Response>} Fetch response
 * @throws {Error} If all retries fail or non-retryable error occurs
 */
export async function fetchWithRetry(url, options = {}, config = {}) {
  const {
    timeout = 30000,
    maxRetries = 3,
    baseDelay = 1000,
    context = 'fetch'
  } = config;

  let lastError = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // Merge abort signal with any existing signal
      const fetchOptions = {
        ...options,
        signal: controller.signal
      };

      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      // Check for retryable HTTP status
      if (!response.ok && isRetryableStatus(response.status)) {
        // Clone response to read error body
        const errorData = await response.clone().json().catch(() => ({}));
        const error = new Error(errorData.message || `HTTP ${response.status}`);
        error.status = response.status;
        error.response = response;

        // Don't retry on last attempt
        if (attempt === maxRetries - 1) {
          throw error;
        }

        // Log retry
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(
          `[${context}] Request failed (attempt ${attempt + 1}/${maxRetries}): ${error.message}. ` +
          `Retrying in ${delay}ms...`
        );
        await sleep(delay);
        lastError = error;
        continue;
      }

      // Success or non-retryable error status
      return response;

    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error;

      // Handle timeout (AbortError) - create new error since DOMException.message is read-only
      if (error.name === 'AbortError') {
        const timeoutError = new Error(`Request timeout after ${timeout}ms`);
        timeoutError.isTimeout = true;
        timeoutError.name = 'TimeoutError';
        lastError = timeoutError;

        // Don't retry on last attempt
        if (attempt === maxRetries - 1) {
          throw timeoutError;
        }

        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(
          `[${context}] Request timeout (attempt ${attempt + 1}/${maxRetries}). Retrying in ${delay}ms...`
        );
        await sleep(delay);
        continue;
      }

      // Check if error is retryable
      if (!isRetryableError(error) && !isRetryableStatus(error.status)) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === maxRetries - 1) {
        throw error;
      }

      // Log retry
      const delay = baseDelay * Math.pow(2, attempt);
      console.warn(
        `[${context}] Request failed (attempt ${attempt + 1}/${maxRetries}): ${error.message}. ` +
        `Retrying in ${delay}ms...`
      );
      await sleep(delay);
    }
  }

  // Should not reach here, but just in case
  throw lastError || new Error('All retry attempts failed');
}

/**
 * Fetch JSON with retry - convenience wrapper
 *
 * @param {string} url - URL to fetch
 * @param {RequestInit} options - Fetch options
 * @param {Object} config - Retry/timeout configuration
 * @returns {Promise<Object>} Parsed JSON response
 */
export async function fetchJSONWithRetry(url, options = {}, config = {}) {
  const response = await fetchWithRetry(url, options, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.message || `HTTP ${response.status}`);
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  return response.json();
}

export default { fetchWithRetry, fetchJSONWithRetry };
