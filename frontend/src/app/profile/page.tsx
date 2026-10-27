'use client';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import type { z } from 'zod';
import { api, ApiError } from '@/lib/api';
import type { User } from '@/lib/types';
import { profileSchema, bloodGroups } from '@/lib/validators';
import { Topbar } from '@/components/topbar';
import { CityField } from '@/components/city-field';
import { BloodBadge, Button, Field, Input, Status } from '@/components/ui';
import { NotificationPrompt } from '@/components/notification-prompt';
import {
  Bell,
  Calendar,
  Check,
  Droplet,
  Heart,
  LogOut,
  MapPin,
  Save,
  Shield,
  Trash2,
  User as UserIcon,
} from 'lucide-react';

type Values = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const me = useQuery({ queryKey: ['me'], queryFn: () => api<{ user: User }>('/me') });

  const form = useForm<Values>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      bloodGroup: 'O+',
      city: '',
      available: true,
      lastDonatedAt: '',
      emailAlerts: true,
    },
  });

  const [notice, setNotice] = useState<{ message: string; kind: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (me.error instanceof ApiError && me.error.status === 401) router.replace('/login');
    const user = me.data?.user;
    if (user && !user.onboardingComplete) {
      router.replace('/onboarding');
      return;
    }
    if (user?.bloodGroup && user.city && user.name) {
      form.reset({
        name: user.name,
        bloodGroup: user.bloodGroup,
        city: user.city,
        available: user.available,
        lastDonatedAt: user.lastDonatedAt?.slice(0, 10) ?? '',
        emailAlerts: user.emailAlerts,
      });
    }
  }, [form, me.data?.user, me.error, router]);

  async function save(values: Values) {
    setNotice(null);
    try {
      const response = await api<{ user: User }>('/me', {
        method: 'PATCH',
        body: JSON.stringify({
          ...values,
          lastDonatedAt: values.lastDonatedAt
            ? new Date(`${values.lastDonatedAt}T00:00:00.000Z`).toISOString()
            : null,
        }),
      });
      queryClient.setQueryData(['me'], response);
      setNotice({ message: 'Profile updated successfully!', kind: 'success' });
    } catch (cause) {
      setNotice({ message: (cause as Error).message, kind: 'error' });
    }
  }

  async function logout(all = false) {
    try {
      await api<void>(all ? '/auth/logout-all' : '/auth/logout', { method: 'POST' });
      queryClient.clear();
      router.replace('/login');
    } catch (cause) {
      setNotice({ message: (cause as Error).message, kind: 'error' });
    }
  }

  async function remove() {
    if (
      !window.confirm(
        'Are you sure you want to delete your donor account and all your requests? This cannot be undone.'
      )
    )
      return;
    try {
      await api<void>('/me', { method: 'DELETE' });
      queryClient.clear();
      router.replace('/login');
    } catch (cause) {
      setNotice({ message: (cause as Error).message, kind: 'error' });
    }
  }

  const user = me.data?.user;
  const watchAvailable = form.watch('available');

  return (
    <div className="min-h-screen bg-slate-50/70 pb-24">
      <Topbar />

      <main className="mx-auto max-w-xl px-4 sm:px-6 pt-6 space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Donor Identity & Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Keep your location and availability updated so emergency alerts reach you promptly.
          </p>
        </div>

        {me.isLoading ? (
          <div className="animate-pulse rounded-3xl border border-slate-200 bg-white p-8 space-y-4">
            <div className="h-6 w-1/3 bg-slate-200 rounded" />
            <div className="h-10 bg-slate-100 rounded" />
            <div className="h-10 bg-slate-100 rounded" />
          </div>
        ) : (
          <>
            {/* Digital Donor Card */}
            {user && (
              <div className="relative overflow-hidden rounded-3xl border border-blood-200 bg-gradient-to-br from-white via-rose-50/30 to-blood-50/60 p-6 shadow-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <BloodBadge group={user.bloodGroup ?? '—'} size="lg" />
                    <div>
                      <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                        {user.name}
                        <Shield className="h-4 w-4 text-emerald-600 fill-emerald-100" />
                      </h2>
                      <p className="flex items-center gap-1 text-xs text-slate-600 font-medium mt-0.5">
                        <MapPin className="h-3.5 w-3.5 text-blood-600" />
                        {user.city ? user.city.replaceAll('-', ' ') : 'City not set'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1 font-mono">{user.email}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                        user.available
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          user.available ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                        }`}
                      />
                      {user.available ? 'Active Donor' : 'Away'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Push Notification Setup */}
            {user && <NotificationPrompt city={user.city} bloodGroup={user.bloodGroup} />}

            {/* Profile Form */}
            <form
              className="space-y-5 rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-card"
              onSubmit={form.handleSubmit(save)}
            >
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3">
                Donor Details
              </h2>

              <Field label="Full Name" required error={form.formState.errors.name?.message}>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <UserIcon className="h-4 w-4" />
                  </div>
                  <Input className="pl-10" {...form.register('name')} />
                </div>
              </Field>

              <Field label="Blood Group" required>
                <select
                  className="w-full rounded-xl border border-slate-200/90 bg-white/90 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blood-600 focus:ring-4 focus:ring-blood-500/10"
                  {...form.register('bloodGroup')}
                >
                  {bloodGroups.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="City" required>
                <Controller
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <CityField value={field.value} onChange={field.onChange} />
                  )}
                />
              </Field>

              <Field
                label="Last Blood Donation Date"
                hint="Recommended interval is 90 days"
              >
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <Input type="date" className="pl-10" {...form.register('lastDonatedAt')} />
                </div>
              </Field>

              {/* Toggles */}
              <div className="space-y-3 pt-2">
                <label className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 cursor-pointer hover:bg-slate-50 transition">
                  <div className="space-y-0.5">
                    <span className="text-sm font-bold text-slate-900 block">
                      Available to Donate
                    </span>
                    <span className="text-xs text-slate-500 block">
                      When active, you are eligible to be matched with emergency requests in your
                      city.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded-md accent-blood-600 cursor-pointer"
                    {...form.register('available')}
                  />
                </label>

                <label className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 cursor-pointer hover:bg-slate-50 transition">
                  <div className="space-y-0.5">
                    <span className="text-sm font-bold text-slate-900 block">
                      Email Emergency Alerts
                    </span>
                    <span className="text-xs text-slate-500 block">
                      Receive immediate notifications when an urgent request matches your blood
                      type.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded-md accent-blood-600 cursor-pointer"
                    {...form.register('emailAlerts')}
                  />
                </label>
              </div>

              {notice && <Status kind={notice.kind}>{notice.message}</Status>}

              <Button
                type="submit"
                size="md"
                className="w-full"
                isLoading={form.formState.isSubmitting}
                leftIcon={<Save className="h-4 w-4" />}
              >
                Save Profile Changes
              </Button>
            </form>

            {/* Account & Security Section */}
            <section className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-card space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3">
                Account & Security
              </h2>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => logout(false)}
                  leftIcon={<LogOut className="h-4 w-4" />}
                >
                  Log Out
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => logout(true)}
                  leftIcon={<Shield className="h-4 w-4" />}
                >
                  Log Out All Devices
                </Button>

                <Button
                  variant="danger"
                  size="sm"
                  onClick={remove}
                  leftIcon={<Trash2 className="h-4 w-4" />}
                >
                  Delete Account
                </Button>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
