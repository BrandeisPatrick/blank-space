/**
 * AWS Lambda Handler for Files endpoint
 */
import { wrapHandler } from './_lambdaAdapter.js';
import filesHandler from '../files.js';

export const handler = wrapHandler(filesHandler);
