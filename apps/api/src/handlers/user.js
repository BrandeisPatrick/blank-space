/**
 * AWS Lambda Handlers for User endpoints
 */
import { wrapHandler } from './_lambdaAdapter.js';
import profileHandler from '../user/profile.js';
import usageHandler from '../user/usage.js';
import incrementUsageHandler from '../user/increment-usage.js';

export const profileHandler_ = wrapHandler(profileHandler);
export const usageHandler_ = wrapHandler(usageHandler);
export const incrementUsageHandler_ = wrapHandler(incrementUsageHandler);
