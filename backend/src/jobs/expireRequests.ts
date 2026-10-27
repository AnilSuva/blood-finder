import { BloodRequestModel } from '../modules/requests/model.js';
import { logger } from '../utils/logger.js';
export async function expireRequests(): Promise<void> {
  const result = await BloodRequestModel.updateMany({ status: 'open', expiresAt: { $lte: new Date() } }, { $set: { status: 'expired' } });
  if (result.modifiedCount) logger.info({ count: result.modifiedCount }, 'Expired blood requests');
}
