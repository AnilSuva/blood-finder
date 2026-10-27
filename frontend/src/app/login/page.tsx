'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { User } from '@/lib/types';
import { Status } from '@/components/ui';
import { Droplet, HeartHandshake, ShieldCheck, Zap } from 'lucide-react';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: (momentListener?: (notification: unknown) => void) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: 'standard' | 'icon';
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'small' | 'medium' | 'large';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              width?: number | string;
              logo_alignment?: 'left' | 'center';
            }
          ) => void;
        };
      };
    };
  }
}

export default function LoginPage() {
  const router = useRouter();
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const me = useQuery({
    queryKey: ['me'],
    queryFn: () => api<{ user: User }>('/me'),
    retry: false,
  });

  const finish = useCallback((user: User) => {
    router.replace(user.onboardingComplete ? '/' : '/onboarding');
  }, [router]);

  useEffect(() => {
    if (me.data?.user) {
      router.replace(me.data.user.onboardingComplete ? '/' : '/onboarding');
    }
  }, [me.data, router]);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
    if (!clientId) {
      setMessage('Google Client ID is not configured.');
      return;
    }

    const setup = () => {
      if (!window.google?.accounts?.id) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async ({ credential }) => {
          try {
            setPending(true);
            setMessage('');
            const data = await api<{ user: User }>('/auth/google', {
              method: 'POST',
              body: JSON.stringify({ credential }),
            });
            finish(data.user);
          } catch (error) {
            setMessage((error as Error).message || 'Failed to authenticate with Google');
          } finally {
            setPending(false);
          }
        },
      });

      if (googleBtnRef.current) {
        googleBtnRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          width: 360,
          logo_alignment: 'left',
        });
      }

      setIsReady(true);

      try {
        window.google.accounts.id.prompt();
      } catch {
        // One Tap may be ignored if suppressed
      }
    };

    if (window.google?.accounts?.id) {
      setup();
    } else {
      const existing = document.querySelector('script[data-gsi]');
      if (existing) {
        existing.addEventListener('load', setup);
      } else {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.dataset.gsi = 'true';
        script.onload = setup;
        document.head.appendChild(script);
      }
    }
  }, [finish]);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-12 sm:px-6">
      {/* Background ambient decorative shapes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-blood-500/10 blur-3xl" />
        <div className="absolute -bottom-32 right-1/4 h-80 w-80 rounded-full bg-rose-400/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <section className="rounded-3xl border border-slate-200/90 bg-white/95 p-6 sm:p-8 shadow-card-elevated backdrop-blur-xl">
          {/* Logo & Header */}
          <div className="flex flex-col items-center text-center">
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blood-600 via-blood-700 to-blood-900 text-white shadow-lg shadow-blood-700/30">
              <Droplet className="h-7 w-7 fill-white" />
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-white" />
              </span>
            </div>

            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-blood-200/80 bg-blood-50/80 px-3 py-0.5 text-xs font-bold text-blood-700">
              <Zap className="h-3 w-3 text-blood-600" />
              Emergency Blood Matching
            </div>

            <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Find help when every minute matters.
            </h1>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed max-w-xs">
              Connect directly with verified voluntary blood donors in your city. Free, instant, and private.
            </p>
          </div>

          {/* Value Highlights */}
          <div className="mt-6 grid grid-cols-2 gap-2.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 text-left">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-800">Verified Donors</p>
                <p className="text-[10px] text-slate-500">Only matching types</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blood-100 text-blood-700">
                <HeartHandshake className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-800">Direct Contact</p>
                <p className="text-[10px] text-slate-500">Call & WhatsApp</p>
              </div>
            </div>
          </div>

          {/* Action Box */}
          <div className="mt-7 space-y-4">
            {message && <Status kind="error">{message}</Status>}

            {pending && (
              <div className="flex items-center justify-center gap-2.5 rounded-xl border border-blood-200 bg-blood-50/70 py-3.5 text-xs sm:text-sm font-semibold text-blood-800">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-blood-600 border-t-transparent" />
                Signing in with Google, please wait…
              </div>
            )}

            <div
              className={`flex min-h-[48px] justify-center transition-opacity duration-200 ${
                pending ? 'pointer-events-none opacity-50' : 'opacity-100'
              }`}
            >
              <div ref={googleBtnRef} className="flex justify-center w-full" />
            </div>

            {!isReady && !message && (
              <div className="flex items-center justify-center gap-2 py-2 text-xs text-slate-400">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-blood-600" />
                Initializing Google Sign-in…
              </div>
            )}

            {!clientId && (
              <p className="mt-2 text-center text-xs text-rose-600">
                Google sign-in is not configured. Add NEXT_PUBLIC_GOOGLE_CLIENT_ID to .env.
              </p>
            )}
          </div>

          <div className="mt-8 border-t border-slate-100 pt-4 text-center">
            <p className="text-[11px] text-slate-400 leading-normal">
              🔒 Powered by Google OAuth. Your email is never shared with the public or hospitals.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
