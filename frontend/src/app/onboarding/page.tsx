'use client';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import type { User } from '@/lib/types';
import { onboardingSchema, bloodGroups } from '@/lib/validators';
import { CityField } from '@/components/city-field';
import { Button, Field, Input, Status } from '@/components/ui';
import { Check, Droplet, Heart, ShieldCheck, Sparkles, User as UserIcon } from 'lucide-react';
import type { z } from 'zod';

type Values = z.infer<typeof onboardingSchema>;

export default function OnboardingPage() {
  const router = useRouter();
  const me = useQuery({ queryKey: ['me'], queryFn: () => api<{ user: User }>('/me') });

  const form = useForm<Values>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { name: '', bloodGroup: 'O+', city: '', consent: false },
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (me.error instanceof ApiError && me.error.status === 401) router.replace('/login');
    if (me.data?.user.onboardingComplete) router.replace('/');
    if (me.data?.user.name && !form.getValues('name')) form.setValue('name', me.data.user.name);
  }, [form, me.data, me.error, router]);

  async function submit(values: Values) {
    setError('');
    try {
      await api('/me/onboarding', { method: 'PATCH', body: JSON.stringify(values) });
      router.replace('/');
    } catch (cause) {
      setError((cause as Error).message);
    }
  }

  const selectedBloodGroup = form.watch('bloodGroup');

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-12 sm:px-6">
      {/* Ambient background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-blood-500/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        <section className="rounded-3xl border border-slate-200/90 bg-white/95 p-6 sm:p-8 shadow-card-elevated backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blood-600 to-blood-800 text-white shadow-md shadow-blood-700/25">
              <Droplet className="h-6 w-6 fill-white" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-blood-700">
                <Sparkles className="h-3 w-3" />
                Quick 1-Minute Setup
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
                Complete Donor Profile
              </h1>
            </div>
          </div>

          <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
            We use your blood group and city exclusively to match you with compatible nearby
            patients in medical emergencies.
          </p>

          <form className="mt-8 space-y-6" onSubmit={form.handleSubmit(submit)}>
            {/* Full Name */}
            <Field label="Your Full Name" required error={form.formState.errors.name?.message}>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <UserIcon className="h-4 w-4" />
                </div>
                <Input
                  className="pl-10"
                  autoComplete="name"
                  placeholder="Enter your name"
                  {...form.register('name')}
                />
              </div>
            </Field>

            {/* Blood Group Grid */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Your Blood Group <span className="text-blood-600">*</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {bloodGroups.map((group) => {
                  const isSelected = selectedBloodGroup === group;
                  return (
                    <button
                      key={group}
                      type="button"
                      onClick={() => form.setValue('bloodGroup', group)}
                      className={`flex flex-col items-center justify-center rounded-xl py-3 border font-extrabold text-base transition-all ${
                        isSelected
                          ? 'border-blood-600 bg-gradient-to-br from-blood-600 to-blood-700 text-white shadow-sm shadow-blood-700/30 scale-[1.02]'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white'
                      }`}
                    >
                      {group}
                    </button>
                  );
                })}
              </div>
              {form.formState.errors.bloodGroup && (
                <p className="mt-1.5 text-xs text-blood-600 font-medium">
                  {form.formState.errors.bloodGroup.message}
                </p>
              )}
            </div>

            {/* City Field */}
            <Field label="Your City" required error={form.formState.errors.city?.message}>
              <Controller
                control={form.control}
                name="city"
                render={({ field }) => (
                  <CityField value={field.value} onChange={field.onChange} />
                )}
              />
            </Field>

            {/* Consent Card */}
            <label className="flex items-start gap-3 rounded-2xl border border-blood-100 bg-rose-50/50 p-4 text-xs sm:text-sm text-slate-700 cursor-pointer hover:bg-rose-50/70 transition">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded accent-blood-600 shrink-0 cursor-pointer"
                {...form.register('consent')}
              />
              <span className="leading-snug">
                I volunteer to be contacted when an urgent request matching my blood group arises in
                my city. I understand I can toggle my availability off at any time.
              </span>
            </label>
            {form.formState.errors.consent && (
              <p className="text-xs text-blood-600 font-medium">
                {form.formState.errors.consent.message}
              </p>
            )}

            {error && <Status kind="error">{error}</Status>}

            {/* Submit CTA */}
            <Button
              type="submit"
              size="lg"
              className="w-full"
              isLoading={form.formState.isSubmitting}
              leftIcon={<Heart className="h-4 w-4" />}
            >
              Activate My Donor Profile
            </Button>
          </form>
        </section>
      </div>
    </main>
  );
}
