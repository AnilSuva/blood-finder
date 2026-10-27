import webpush from 'web-push';
import { env } from '../../config/env.js';
import { UserModel, type User } from '../users/model.js';
import { logger } from '../../utils/logger.js';
import type { Types } from 'mongoose';

let isConfigured = false;

export function configureWebPush() {
  if (isConfigured) return;
  if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
    isConfigured = true;
    logger.info('Web Push initialized with VAPID keys');
  } else {
    logger.warn('Web Push VAPID keys not configured');
  }
}

export type PushSubscriptionPayload = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export async function savePushSubscription(userId: Types.ObjectId, sub: PushSubscriptionPayload): Promise<void> {
  configureWebPush();
  // Remove any existing subscription with this exact endpoint for this user to avoid duplicates
  await UserModel.updateOne(
    { _id: userId },
    { $pull: { pushSubscriptions: { endpoint: sub.endpoint } } }
  );
  // Add new subscription
  await UserModel.updateOne(
    { _id: userId },
    { $push: { pushSubscriptions: { endpoint: sub.endpoint, keys: sub.keys } } }
  );
}

export async function removePushSubscription(userId: Types.ObjectId, endpoint: string): Promise<void> {
  await UserModel.updateOne(
    { _id: userId },
    { $pull: { pushSubscriptions: { endpoint } } }
  );
}

export async function sendPushToUser(
  userId: Types.ObjectId,
  payload: { title: string; body: string; url?: string; tag?: string }
): Promise<number> {
  configureWebPush();
  if (!isConfigured) return 0;

  const user = await UserModel.findById(userId).select('pushSubscriptions');
  if (!user || !user.pushSubscriptions || user.pushSubscriptions.length === 0) return 0;

  const content = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    tag: payload.tag || 'blood-notification',
    data: {
      url: payload.url || '/',
    },
  });

  let successfulSends = 0;
  const deadEndpoints: string[] = [];

  for (const sub of user.pushSubscriptions) {
    if (!sub.keys?.p256dh || !sub.keys?.auth) continue;
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.keys.p256dh,
            auth: sub.keys.auth,
          },
        },
        content
      );
      successfulSends++;
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number })?.statusCode;
      if (statusCode === 404 || statusCode === 410) {
        // Expired or unsubscribed device subscription
        deadEndpoints.push(sub.endpoint);
      } else {
        logger.error({ err, endpoint: sub.endpoint }, 'Failed to deliver push notification');
      }
    }
  }

  // Cleanup dead/expired device subscriptions
  if (deadEndpoints.length > 0) {
    await UserModel.updateOne(
      { _id: userId },
      { $pull: { pushSubscriptions: { endpoint: { $in: deadEndpoints } } } }
    );
  }

  return successfulSends;
}

export async function sendDonorBloodAlert(request: {
  _id: Types.ObjectId;
  city: string;
  patientBloodGroup: string;
  compatibleDonorGroups: string[];
  unitsNeeded: number;
  hospital?: string | null;
}, requesterId: Types.ObjectId): Promise<void> {
  configureWebPush();
  if (!isConfigured) return;

  try {
    // Find all active, available donors in the city with a compatible blood group
    const matchingDonors = await UserModel.find({
      _id: { $ne: requesterId },
      city: request.city,
      available: true,
      bloodGroup: { $in: request.compatibleDonorGroups },
      'pushSubscriptions.0': { $exists: true },
    }).select('_id pushSubscriptions name');

    if (matchingDonors.length === 0) return;

    const cityDisplayName = request.city.replaceAll('-', ' ');
    const hospitalName = request.hospital ? `at ${request.hospital}` : `in ${cityDisplayName}`;

    const payload = {
      title: `🚨 Urgent ${request.patientBloodGroup} Blood Needed!`,
      body: `${request.unitsNeeded} unit(s) needed ${hospitalName}. Tap to respond and help save a life.`,
      url: `/?requestId=${request._id.toString()}`,
      tag: `blood-req-${request._id.toString()}`,
    };

    logger.info(
      { count: matchingDonors.length, city: request.city, bloodGroup: request.patientBloodGroup },
      'Sending emergency push alerts to matching donors'
    );

    await Promise.allSettled(
      matchingDonors.map((donor) => sendPushToUser(donor._id, payload))
    );
  } catch (error) {
    logger.error({ err: error }, 'Error in sendDonorBloodAlert');
  }
}
