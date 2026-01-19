/**
 * Lambda Adapter
 * Converts Vercel-style handlers (req, res) to AWS Lambda format
 */

/**
 * Create mock request/response objects compatible with Vercel handler signature
 */
export function createVercelCompatible(event) {
  const body = event.body ? (typeof event.body === 'string' ? JSON.parse(event.body) : event.body) : {};
  const headers = event.headers || {};

  const req = {
    method: event.requestContext?.http?.method || event.httpMethod || 'GET',
    headers,
    body,
    query: event.queryStringParameters || {},
    url: event.rawPath || event.path || '/',
  };

  let responseBody = null;
  let statusCode = 200;
  let responseHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  const res = {
    status: (code) => {
      statusCode = code;
      return res;
    },
    json: (data) => {
      responseBody = data;
      responseHeaders['Content-Type'] = 'application/json';
      return res;
    },
    send: (data) => {
      responseBody = data;
      return res;
    },
    setHeader: (key, value) => {
      responseHeaders[key] = value;
      return res;
    },
    getResponse: () => ({
      statusCode,
      headers: responseHeaders,
      body: typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody),
    }),
  };

  return { req, res };
}

/**
 * Wrap a Vercel-style handler for AWS Lambda
 * @param {Function} vercelHandler - Vercel handler function (req, res) => Promise
 * @returns {Function} AWS Lambda handler
 */
export function wrapHandler(vercelHandler) {
  return async (event, context) => {
    // Handle OPTIONS for CORS preflight
    if (event.requestContext?.http?.method === 'OPTIONS' || event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        },
        body: '',
      };
    }

    const { req, res } = createVercelCompatible(event);

    try {
      await vercelHandler(req, res);
      return res.getResponse();
    } catch (error) {
      console.error('Handler error:', error);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: error.message }),
      };
    }
  };
}

export default { createVercelCompatible, wrapHandler };
