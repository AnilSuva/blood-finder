'use client';
import { useEffect, useRef } from 'react';
declare global { interface Window { turnstile?: { render: (element: HTMLElement, options: { sitekey: string; callback: (token: string) => void; 'error-callback': () => void }) => void } } }
export function Turnstile({ onToken }: { onToken: (token: string) => void }) {
  const ref = useRef<HTMLDivElement>(null); const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  useEffect(() => {
    if (!siteKey) { onToken('development'); return; }
    const render = () => { if (ref.current && window.turnstile) window.turnstile.render(ref.current, { sitekey: siteKey, callback: onToken, 'error-callback': () => onToken('') }); };
    const existing = document.querySelector('script[data-turnstile]');
    if (window.turnstile) render(); else if (existing) existing.addEventListener('load', render, { once: true }); else { const script = document.createElement('script'); script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; script.async = true; script.dataset.turnstile = 'true'; script.onload = render; document.head.appendChild(script); }
  }, [onToken, siteKey]);
  return <div ref={ref} aria-label="Bot protection" />;
}
