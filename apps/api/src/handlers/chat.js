/**
 * AWS Lambda Handler for Chat endpoint
 */
import { wrapHandler } from './_lambdaAdapter.js';
import chatHandler from '../chat.js';

export const handler = wrapHandler(chatHandler);
