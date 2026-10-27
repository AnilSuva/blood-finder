'use client';
import { Controller, useForm } from 'react-hook-form';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import type { z } from 'zod';
import { api, ApiError } from '@/lib/api';
import type { User } from '@/lib/types';
import { requestSchema, bloodGroups } from '@/lib/validators';
import { Topbar } from '@/components/topbar';
import { Button, Field, Input, Status } from '@/components/ui';
import { CityField } from '@/components/city-field';
import { Turnstile } from '@/components/turnstile';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  Droplet,
  FileText,
  Phone,
  Send,
  ShieldAlert,
  Zap,
} from 'lucide-react';

type Values = z.infer<typeof requestSchema>;

export default function NewRequestPage() {
  const router = useRouter();
  const me = useQuery({ queryKey: ['me'], queryFn: () => api<{ user: User }>('/me') });

  const form = useForm<Values>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      city: '',
      hospital: '',
      phone: '',
      patientBloodGroup: 'O+',
      unitsNeeded: 1,
      neededBy: 'asap',
      note: '',
    },
  });

  const [turnstileToken, setTurnstileToken] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (me.error instanceof ApiError && me.error.status === 401) router.replace('/login');
    if (me.data && !me.data.user.onboardingComplete) router.replace('/onboarding');
    if (me.data?.user.city && !form.getValues('city')) form.setValue('city', me.data.user.city);
  }, [form, me.data, me.error, router]);

  async function submit(values: Values) {
    setError('');
    try {
      await api('/requests', {
        method: 'POST',
        body: JSON.stringify({
          ...values,
          hospital: values.hospital || undefined,
          note: values.note || undefined,
          turnstileToken,
        }),
      });
      router.replace('/');
    } catch (cause) {
      setError((cause as Error).message);
    }
  }

  const selectedBloodGroup = form.watch('patientBloodGroup');
  const selectedNeededBy = form.watch('neededBy');

  return (
    <div className="min-h-screen bg-slate-50/70 pb-24">
      <Topbar />

      <main className="mx-auto max-w-xl px-4 sm:px-6 pt-6">
        {/* Navigation Breadcrumb */}
        <Link
          href="/"
          className="group inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blood-700 transition mb-4"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Back to Live Requests
        </Link>

        {/* Card Header */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-card">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blood-600 to-blood-800 text-white shadow-md shadow-blood-700/25">
              <Droplet className="h-6 w-6 fill-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
                Request Emergency Blood
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Eligible voluntary donors in your city will see this alert immediately.
              </p>
            </div>
          </div>

          <form className="mt-8 space-y-6" onSubmit={form.handleSubmit(submit)}>
            {/* Blood Group Selector (Interactive Grid) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5">
                Patient Blood Group <span className="text-blood-600">*</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {bloodGroups.map((group) => {
                  const isSelected = selectedBloodGroup === group;
                  return (
                    <button
                      key={group}
                      type="button"
                      onClick={() => form.setValue('patientBloodGroup', group)}
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
              {form.formState.errors.patientBloodGroup && (
                <p className="mt-1.5 text-xs text-blood-600 font-medium">
                  {form.formState.errors.patientBloodGroup.message}
                </p>
              )}
            </div>

            {/* Urgency Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5">
                Required By <span className="text-blood-600">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {[
                  { value: 'asap', label: 'ASAP / Critical', icon: <Zap className="h-4 w-4" /> },
                  { value: 'today', label: 'Needed Today', icon: <Clock className="h-4 w-4" /> },
                  { value: '48h', label: 'Within 48h', icon: <Calendar className="h-4 w-4" /> },
                ].map((item) => {
                  const isSelected = selectedNeededBy === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() =>
                        form.setValue('neededBy', item.value as 'asap' | 'today' | '48h')
                      }
                      className={`flex flex-col items-center justify-center rounded-xl p-2.5 sm:p-3 border text-center transition-all ${
                        isSelected
                          ? 'border-blood-600 bg-rose-50/80 text-blood-800 font-bold shadow-xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div className={`mb-1 ${isSelected ? 'text-blood-600' : 'text-slate-400'}`}>
                        {item.icon}
                      </div>
                      <span className="text-xs">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* City Field */}
            <Field label="City" required error={form.formState.errors.city?.message}>
              <Controller
                control={form.control}
                name="city"
                render={({ field }) => (
                  <CityField value={field.value} onChange={field.onChange} />
                )}
              />
            </Field>

            {/* Hospital & Units Needed */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Hospital / Clinic"
                hint="Optional"
                error={form.formState.errors.hospital?.message}
              >
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <Input
                    className="pl-10"
                    placeholder="e.g. City Civil Hospital"
                    maxLength={120}
                    {...form.register('hospital')}
                  />
                </div>
              </Field>

              <Field
                label="Units Needed"
                required
                error={form.formState.errors.unitsNeeded?.message}
              >
                <Input
                  type="number"
                  min={1}
                  max={10}
                  placeholder="1"
                  {...form.register('unitsNeeded')}
                />
              </Field>
            </div>

            {/* Mobile Contact Number */}
            <Field
              label="Hospital / Attendant Phone"
              required
              hint="Revealed only to verified donors"
              error={form.formState.errors.phone?.message}
            >
              <div className="flex rounded-xl shadow-xs">
                <span className="inline-flex items-center rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-700">
                  +91
                </span>
                <Input
                  className="rounded-l-none"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  {...form.register('phone')}
                />
              </div>
            </Field>

            {/* Additional Note */}
            <Field
              label="Doctor or Ward Notes"
              hint="Optional, max 200 chars"
              error={form.formState.errors.note?.message}
            >
              <textarea
                className="w-full rounded-xl border border-slate-200/90 bg-white/90 p-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blood-600 focus:bg-white focus:ring-4 focus:ring-blood-500/10 disabled:bg-slate-100"
                rows={3}
                maxLength={200}
                placeholder="e.g. ICU Ward 4, Emergency Surgery scheduled, contact Attendant Mr. Sharma."
                {...form.register('note')}
              />
            </Field>

            {/* Invisible / Mock Turnstile */}
            <Turnstile onToken={setTurnstileToken} />

            {/* Medical Disclaimer Alert */}
            <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <div className="leading-relaxed">
                <strong>Medical Notice:</strong> Blood group compatibility is calculated based on
                standard medical charts. The treating hospital must perform mandatory cross-matching
                tests prior to transfusion.
              </div>
            </div>

            {error && <Status kind="error">{error}</Status>}

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              className="w-full"
              isLoading={form.formState.isSubmitting}
              disabled={!turnstileToken}
              leftIcon={<Send className="h-4 w-4" />}
            >
              Broadcast Emergency Request
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
