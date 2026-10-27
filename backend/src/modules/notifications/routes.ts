import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { csrfProtection } from '../../middleware/csrf.js';
import { env } from '../../config/env.js';
import {
  savePushSubscription,
  removePushSubscription,
  sendPushToUser,
  type PushSubscriptionPayload,
} from './service.js';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { UserModel } from '../users/model.js';

export const notificationsRouter = Router();

// Public endpoint to fetch VAPID public key
notificationsRouter.get('/notifications/vapid-key', (_req, res) => {
  res.json({ publicKey: env.VAPID_PUBLIC_KEY ?? '' });
});

// Check subscription status for logged in user
notificationsRouter.get('/notifications/status', requireAuth, async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user!._id).select('pushSubscriptions');
    const deviceCount = user?.pushSubscriptions?.length ?? 0;
    res.json({
      isSubscribed: deviceCount > 0,
      deviceCount,
    });
  } catch (error) {
    next(error);
  }
});

const subscriptionSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string().min(1),
      auth: z.string().min(1),
    }),
  }),
});

// Subscribe device for push notifications
notificationsRouter.post(
  '/notifications/subscribe',
  requireAuth,
  csrfProtection,
  validate(subscriptionSchema),
  async (req, res, next) => {
    try {
      const { subscription } = req.body as { subscription: PushSubscriptionPayload };
      await savePushSubscription(req.user!._id, subscription);
      res.status(201).json({ status: 'subscribed' });
    } catch (error) {
      next(error);
    }
  }
);

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

// Unsubscribe device
notificationsRouter.post(
  '/notifications/unsubscribe',
  requireAuth,
  csrfProtection,
  validate(unsubscribeSchema),
  async (req, res, next) => {
    try {
      await removePushSubscription(req.user!._id, req.body.endpoint);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

// Send test notification to the authenticated user's device
notificationsRouter.post(
  '/notifications/test',
  requireAuth,
  csrfProtection,
  async (req, res, next) => {
    try {
      const count = await sendPushToUser(req.user!._id, {
        title: '🔔 BloodFinder Alert Test',
        body: 'Success! Emergency alerts for compatible blood requests will appear right here on your phone.',
        url: '/',
        tag: 'test-notification',
      });
      res.json({ delivered: count });
    } catch (error) {
      next(error);
    }
  }
);
