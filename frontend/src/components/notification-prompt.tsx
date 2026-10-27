'use client';
import { useEffect, useState } from 'react';
import {
  isPushSupported,
  registerServiceWorker,
  getExistingSubscription,
  subscribeToPush,
  sendTestAlert,
} from '@/lib/notifications';
import { Button } from './ui';
import { Bell, BellRing, Check, ShieldCheck, Sparkles } from 'lucide-react';

export function NotificationPrompt({
  city,
  bloodGroup,
}: {
  city?: string | null;
  bloodGroup?: string | null;
}) {
  const [supported, setSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isPushSupported()) {
      setSupported(true);
      registerServiceWorker();
      getExistingSubscription().then((sub) => {
        setIsSubscribed(Boolean(sub));
      });
    }
  }, []);

  if (!supported) return null;

  async function handleEnable() {
    setIsLoading(true);
    setErrorMsg('');
    const res = await subscribeToPush();
    setIsLoading(false);
    if (res.success) {
      setIsSubscribed(true);
      // Automatically send a welcome/test alert so they immediately feel the connection!
      try {
        await sendTestAlert();
        setTestSent(true);
      } catch {
        // ignore test error
      }
    } else if (res.error) {
      setErrorMsg(res.error);
    }
  }

  async function handleTest() {
    setIsLoading(true);
    setTestSent(false);
    setErrorMsg('');
    try {
      await sendTestAlert();
      setTestSent(true);
      setTimeout(() => setTestSent(false), 5000);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Failed to trigger test alert');
    } finally {
      setIsLoading(false);
    }
  }

  const cityDisplay = city ? city.replaceAll('-', ' ') : 'your city';

  return (
    <div className="relative overflow-hidden rounded-3xl border border-blood-200/80 bg-gradient-to-br from-white via-rose-50/50 to-blood-50/70 p-5 sm:p-6 shadow-card backdrop-blur-md mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-md transition-colors ${
              isSubscribed
                ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-emerald-600/20'
                : 'bg-gradient-to-br from-blood-600 to-blood-800 text-white shadow-blood-700/25'
            }`}
          >
            {isSubscribed ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                {isSubscribed
                  ? 'Phone Notifications Active'
                  : 'Get Emergency Alerts on this Phone'}
              </h3>
              {isSubscribed && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  <Check className="h-3 w-3" />
                  Connected
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              {isSubscribed
                ? `Your device will vibrate and display emergency alerts when someone in ${cityDisplay} needs compatible blood.`
                : `Instant lock-screen alert when an urgent request matches your blood group in ${cityDisplay}.`}
            </p>

            {errorMsg && (
              <p className="mt-1 text-xs text-blood-600 font-semibold">{errorMsg}</p>
            )}
            {testSent && (
              <p className="mt-1 text-xs text-emerald-700 font-bold flex items-center gap-1">
                <Check className="h-3.5 w-3.5" />
                Notification sent! Check your notification bar / lock screen.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isSubscribed ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleTest}
              isLoading={isLoading}
              leftIcon={<Sparkles className="h-3.5 w-3.5 text-blood-600" />}
            >
              Test Notification
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={handleEnable}
              isLoading={isLoading}
              leftIcon={<Bell className="h-3.5 w-3.5" />}
            >
              Enable Phone Alerts
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
