/**
 * AWS Lambda Handler for Conversations endpoint
 */
import { wrapHandler } from './_lambdaAdapter.js';
import conversationsHandler from '../conversations.js';

export const handler = wrapHandler(conversationsHandler);
