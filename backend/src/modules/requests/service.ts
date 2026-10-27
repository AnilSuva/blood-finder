import { Types } from 'mongoose';
import { env } from '../../config/env.js';
import { CityModel } from '../cities/model.js';
import { BloodRequestModel, ContactRevealModel, ReportModel } from './model.js';
import type { User } from '../users/model.js';
import { compatibleDonorsFor, type BloodGroup } from '../../utils/bloodCompatibility.js';
import { ApiError } from '../../middleware/error.js';
import { cleanText } from '../../utils/text.js';
import { sendDonorBloodAlert } from '../notifications/service.js';

type CurrentUser = User & { _id: Types.ObjectId };
type Cursor = { createdAt: string; id: string };
const encodeCursor = (createdAt: Date, id: Types.ObjectId) => Buffer.from(JSON.stringify({ createdAt: createdAt.toISOString(), id: id.toString() })).toString('base64url');
function decodeCursor(value?: string): Cursor | undefined {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as Cursor;
    if (!parsed.createdAt || Number.isNaN(Date.parse(parsed.createdAt)) || !Types.ObjectId.isValid(parsed.id)) throw new Error();
    return parsed;
  } catch { throw new ApiError(400, 'INVALID_CURSOR', 'Invalid cursor'); }
}
export function buildFeedFilter(user: Pick<CurrentUser, '_id' | 'available' | 'city' | 'bloodGroup'>, cursor?: Cursor): Record<string, unknown> {
  const donorMatch = user.available && user.city && user.bloodGroup ? {
    city: user.city, status: 'open', expiresAt: { $gt: new Date() }, compatibleDonorGroups: user.bloodGroup,
    flagged: { $ne: true },
  } : { _id: null };
  const filter: Record<string, unknown> = { $or: [{ requesterId: user._id }, donorMatch] };
  if (cursor) filter.$and = [{ $or: [{ createdAt: { $lt: new Date(cursor.createdAt) } }, { createdAt: new Date(cursor.createdAt), _id: { $lt: new Types.ObjectId(cursor.id) } }] }];
  return filter;
}
export async function createRequest(user: CurrentUser, input: { city: string; hospital?: string; phone: string; patientBloodGroup: BloodGroup; unitsNeeded: number; neededBy: 'asap' | 'today' | '48h'; note?: string }) {
  if (!await CityModel.exists({ slug: input.city })) throw new ApiError(400, 'INVALID_CITY', 'Choose a city from the list');
  const now = new Date();
  const active = await BloodRequestModel.countDocuments({ requesterId: user._id, status: 'open', expiresAt: { $gt: now } });
  if (active >= env.MAX_ACTIVE_REQUESTS_PER_USER) throw new ApiError(429, 'ACTIVE_REQUEST_LIMIT', 'You already have the maximum number of active requests');
  const previous = await BloodRequestModel.findOne({ requesterId: user._id }).sort({ createdAt: -1 }).select('createdAt');
  if (previous && previous.createdAt.getTime() + 5 * 60 * 1000 > now.getTime()) throw new ApiError(429, 'REQUEST_COOLDOWN', 'Please wait a few minutes before posting another request');
  const request = await BloodRequestModel.create({
    requesterId: user._id, city: input.city, hospital: input.hospital ? cleanText(input.hospital) : undefined,
    phone: `${env.DEFAULT_COUNTRY_CODE}${input.phone}`, patientBloodGroup: input.patientBloodGroup,
    compatibleDonorGroups: compatibleDonorsFor(input.patientBloodGroup), unitsNeeded: input.unitsNeeded,
    neededBy: input.neededBy, note: input.note ? cleanText(input.note) : undefined,
    expiresAt: new Date(now.getTime() + env.REQUEST_EXPIRY_HOURS * 3600000),
  });

  // Notify matching compatible donors in this city via web push
  void sendDonorBloodAlert(request, user._id);

  return request;
}
export async function listFeed(user: CurrentUser, rawCursor: string | undefined, limit: number) {
  const cursor = decodeCursor(rawCursor);
  const filter = buildFeedFilter(user, cursor);
  const requests = await BloodRequestModel.find(filter).sort({ createdAt: -1, _id: -1 }).limit(limit + 1).lean();
  const hasMore = requests.length > limit;
  const page = hasMore ? requests.slice(0, limit) : requests;
  const data = page.map((request) => ({
    id: request._id.toString(), city: request.city, hospital: request.hospital ?? null,
    patientBloodGroup: request.patientBloodGroup, unitsNeeded: request.unitsNeeded, neededBy: request.neededBy,
    note: request.note ?? null, status: request.status, expiresAt: request.expiresAt, createdAt: request.createdAt,
    isOwner: request.requesterId.toString() === user._id.toString(),
  }));
  const last = page.at(-1);
  return { requests: data, nextCursor: hasMore && last ? encodeCursor(last.createdAt, last._id) : null };
}
export async function updateStatus(user: CurrentUser, id: string, status: 'fulfilled' | 'cancelled') {
  const request = await BloodRequestModel.findById(id);
  if (!request) throw new ApiError(404, 'NOT_FOUND', 'Request not found');
  if (request.requesterId.toString() !== user._id.toString()) throw new ApiError(403, 'FORBIDDEN', 'You can only update your own request');
  if (request.status !== 'open') throw new ApiError(409, 'REQUEST_CLOSED', 'This request is already closed');
  request.status = status; await request.save();
  return request;
}
export async function revealContact(user: CurrentUser, id: string) {
  const request = await BloodRequestModel.findById(id).select('+phone');
  if (!request) throw new ApiError(404, 'NOT_FOUND', 'Request not found');
  const owner = request.requesterId.toString() === user._id.toString();
  const eligible = Boolean(user.available && user.city === request.city && user.bloodGroup && request.compatibleDonorGroups.includes(user.bloodGroup));
  if (!owner && !eligible) throw new ApiError(403, 'NOT_ELIGIBLE', 'You are not eligible to view this contact');
  await ContactRevealModel.create({ requestId: request._id, userId: user._id });
  return request.phone;
}
export async function reportRequest(user: CurrentUser, id: string, reason: string): Promise<void> {
  const request = await BloodRequestModel.findById(id);
  if (!request) throw new ApiError(404, 'NOT_FOUND', 'Request not found');
  if (request.requesterId.toString() === user._id.toString()) throw new ApiError(400, 'CANNOT_REPORT_OWN', 'You cannot report your own request');
  await ReportModel.create({ requestId: request._id, reporterId: user._id, reason: cleanText(reason) });
  const count = await ReportModel.countDocuments({ requestId: request._id });
  if (count >= 3) await BloodRequestModel.updateOne({ _id: request._id }, { $set: { flagged: true } });
}
