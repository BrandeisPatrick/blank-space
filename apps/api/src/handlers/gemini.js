/**
 * AWS Lambda Handler for Gemini endpoint
 */
import { wrapHandler } from './_lambdaAdapter.js';
import geminiHandler from '../gemini.js';

export const handler = wrapHandler(geminiHandler);
