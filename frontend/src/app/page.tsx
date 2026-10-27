'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import type { BloodRequest, User } from '@/lib/types';
import { Topbar } from '@/components/topbar';
import { BloodBadge, Button, Status, UrgencyBadge } from '@/components/ui';
import { NotificationPrompt } from '@/components/notification-prompt';
import {
  Building2,
  CheckCircle,
  Clock,
  Heart,
  HelpCircle,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  RefreshCw,
  Share2,
  ShieldCheck,
  User as UserIcon,
  XCircle,
} from 'lucide-react';

function relativeTime(value: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000));
  return minutes < 1
    ? 'Just now'
    : minutes < 60
    ? `${minutes}m ago`
    : minutes < 1440
    ? `${Math.floor(minutes / 60)}h ago`
    : `${Math.floor(minutes / 1440)}d ago`;
}

export default function HomePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [contacts, setContacts] = useState<Record<string, string>>({});
  const [filterTab, setFilterTab] = useState<'all' | 'compatible' | 'mine'>('all');

  const me = useQuery({
    queryKey: ['me'],
    queryFn: () => api<{ user: User }>('/me'),
  });

  const feed = useInfiniteQuery({
    queryKey: ['requests'],
    initialPageParam: '',
    queryFn: ({ pageParam }) =>
      api<{ requests: BloodRequest[]; nextCursor: string | null }>(
        `/requests${pageParam ? `?cursor=${encodeURIComponent(pageParam)}` : ''}`
      ),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  const user = me.data?.user;

  useEffect(() => {
    if (me.data && !me.data.user.onboardingComplete) router.replace('/onboarding');
    if (me.error instanceof ApiError && me.error.status === 401) router.replace('/login');
  }, [me.data, me.error, router]);

  const statusMutation = useMutation({
    mutationFn: ({ id, next }: { id: string; next: 'fulfilled' | 'cancelled' }) =>
      api<void>(`/requests/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: next }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['requests'] }),
  });

  const contactMutation = useMutation({
    mutationFn: (id: string) => api<{ phone: string }>(`/requests/${id}/contact`),
    onSuccess: (data, id) => setContacts((current) => ({ ...current, [id]: data.phone })),
  });

  const rawRequests = feed.data?.pages.flatMap((page) => page.requests) ?? [];

  const requests = useMemo(() => {
    if (filterTab === 'mine') {
      return rawRequests.filter((r) => r.isOwner);
    }
    if (filterTab === 'compatible' && user?.bloodGroup) {
      // Show requests compatible with user's blood group
      return rawRequests.filter((r) => !r.isOwner);
    }
    return rawRequests;
  }, [rawRequests, filterTab, user?.bloodGroup]);

  return (
    <div className="min-h-screen bg-slate-50/70 pb-28">
      <Topbar />

      <main className="mx-auto max-w-3xl px-4 sm:px-6 pt-6">
        {/* Donor Banner / Welcome */}
        {user && (
          <div className="relative mb-6 overflow-hidden rounded-3xl border border-blood-100 bg-gradient-to-br from-white via-rose-50/40 to-blood-50/60 p-5 sm:p-6 shadow-card backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <BloodBadge group={user.bloodGroup ?? '—'} size="md" />
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                      Hello, {user.name?.split(' ')[0] ?? 'Donor'}!
                    </h1>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        user.available
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          user.available ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                      />
                      {user.available ? 'Ready to Donate' : 'Away'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Viewing emergency requests in{' '}
                    <strong className="font-semibold text-slate-800">
                      {user.city ? user.city.replaceAll('-', ' ') : 'your city'}
                    </strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/request/new"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blood-600 to-blood-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-blood-600/20 hover:from-blood-700 hover:to-blood-800 active:scale-[0.98] transition"
                >
                  <Plus className="h-4 w-4" />
                  Post Blood Request
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Push Notification Prompt */}
        {user && <NotificationPrompt city={user.city} bloodGroup={user.bloodGroup} />}

        {/* Filter Tabs & Refresh */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center rounded-2xl border border-slate-200/80 bg-white/90 p-1 shadow-xs">
            <button
              onClick={() => setFilterTab('all')}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                filterTab === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Requests ({rawRequests.length})
            </button>
            <button
              onClick={() => setFilterTab('compatible')}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                filterTab === 'compatible'
                  ? 'bg-blood-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Heart className="h-3 w-3" />
              Can Help
            </button>
            <button
              onClick={() => setFilterTab('mine')}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                filterTab === 'mine'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserIcon className="h-3 w-3" />
              My Requests
            </button>
          </div>

          <button
            onClick={() => feed.refetch()}
            disabled={feed.isFetching}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${feed.isFetching ? 'animate-spin' : ''}`} />
            <span>Live Feed</span>
          </button>
        </div>

        {/* Loading State */}
        {feed.isLoading && (
          <div className="space-y-4 py-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-slate-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 rounded bg-slate-200" />
                    <div className="h-3 w-1/2 rounded bg-slate-200" />
                    <div className="h-3 w-1/4 rounded bg-slate-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {feed.error && (
          <div className="mb-4">
            <Status kind="error">{(feed.error as Error).message}</Status>
          </div>
        )}

        {/* Empty State */}
        {!feed.isLoading && !feed.error && requests.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/80 px-6 py-16 text-center shadow-card">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-blood-600 shadow-inner">
              <CheckCircle className="h-8 w-8 text-blood-600" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-900">
              No matching requests right now
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-sm leading-relaxed">
              {filterTab === 'mine'
                ? "You haven't posted any blood requests yet. Click below if you or someone you know needs urgent blood."
                : "Great news! There are no open urgent blood requirements in your city right now. We'll alert you when someone needs your blood type."}
            </p>
            <Link
              href="/request/new"
              className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-blood-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-blood-700 transition"
            >
              <Plus className="h-4 w-4" />
              Create Blood Request
            </Link>
          </div>
        )}

        {/* Request Cards Feed */}
        <section className="space-y-4" aria-live="polite">
          {requests.map((request) => {
            const hasContact = Boolean(contacts[request.id]);
            const isContactPending =
              contactMutation.isPending && contactMutation.variables === request.id;

            return (
              <article
                key={request.id}
                className="group relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-card hover:shadow-card-hover transition-all duration-200"
              >
                {/* Urgent accent stripe */}
                {request.neededBy === 'asap' && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blood-500 via-rose-500 to-amber-500" />
                )}

                <div className="flex flex-col sm:flex-row items-start gap-4">
                  {/* Blood Group Badge */}
                  <div className="flex items-center gap-3">
                    <BloodBadge group={request.patientBloodGroup} size="lg" />
                  </div>

                  {/* Main Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <UrgencyBadge neededBy={request.neededBy} />

                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="h-3.5 w-3.5" />
                        {relativeTime(request.createdAt)}
                      </span>

                      {request.isOwner && (
                        <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                          Your Request
                        </span>
                      )}

                      {request.status !== 'open' && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                            request.status === 'fulfilled'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {request.status}
                        </span>
                      )}
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold text-slate-900">
                      <div className="flex items-center gap-1.5 text-slate-800">
                        <MapPin className="h-4 w-4 text-blood-600" />
                        <span>{request.city.replaceAll('-', ' ')}</span>
                      </div>

                      {request.hospital && (
                        <div className="flex items-center gap-1.5 text-slate-600 font-normal">
                          <Building2 className="h-4 w-4 text-slate-400" />
                          <span>{request.hospital}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-2 text-xs sm:text-sm text-slate-700">
                      Requirement:{' '}
                      <strong className="font-bold text-slate-950">
                        {request.unitsNeeded} {request.unitsNeeded === 1 ? 'Unit' : 'Units'}
                      </strong>{' '}
                      of <strong>{request.patientBloodGroup}</strong>
                    </div>

                    {request.note && (
                      <div className="mt-2.5 rounded-xl bg-slate-50 border border-slate-100 p-2.5 text-xs text-slate-600 italic leading-relaxed">
                        &ldquo;{request.note}&rdquo;
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="mt-5 border-t border-slate-100 pt-4 flex flex-wrap items-center justify-between gap-3">
                  {request.isOwner ? (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {request.status === 'open' && (
                        <>
                          <Button
                            variant="success"
                            size="sm"
                            leftIcon={<CheckCircle className="h-4 w-4" />}
                            onClick={() =>
                              statusMutation.mutate({ id: request.id, next: 'fulfilled' })
                            }
                            isLoading={statusMutation.isPending}
                          >
                            Mark Fulfilled
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<XCircle className="h-4 w-4" />}
                            onClick={() =>
                              statusMutation.mutate({ id: request.id, next: 'cancelled' })
                            }
                            isLoading={statusMutation.isPending}
                          >
                            Cancel Request
                          </Button>
                        </>
                      )}
                    </div>
                  ) : hasContact ? (
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      <div className="mr-2 flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-mono font-bold text-slate-800">
                        <Phone className="h-3.5 w-3.5 text-blood-600" />
                        {contacts[request.id]}
                      </div>
                      <a
                        href={`tel:${contacts[request.id]}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-blood-600 hover:bg-blood-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition active:scale-[0.98]"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        Call Now
                      </a>
                      <a
                        href={`https://wa.me/${contacts[request.id].replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-1.5 text-xs font-bold text-emerald-800 shadow-xs transition active:scale-[0.98]"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        WhatsApp
                      </a>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<Phone className="h-4 w-4" />}
                        onClick={() => contactMutation.mutate(request.id)}
                        isLoading={isContactPending}
                      >
                        Reveal Hospital Contact
                      </Button>
                    </div>
                  )}

                  <span className="text-[11px] text-slate-400 font-medium">
                    Verified Request • BloodFinder Protection
                  </span>
                </div>
              </article>
            );
          })}
        </section>

        {/* Pagination */}
        {feed.hasNextPage && (
          <div className="mt-6 text-center">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => feed.fetchNextPage()}
              isLoading={feed.isFetchingNextPage}
            >
              Load Older Requests
            </Button>
          </div>
        )}
      </main>

      {/* Floating CTA for Mobile */}
      <Link
        href="/request/new"
        className="fixed bottom-5 left-4 right-4 z-30 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blood-600 to-blood-700 py-3.5 text-sm font-bold text-white shadow-xl shadow-blood-700/30 hover:from-blood-700 hover:to-blood-800 active:scale-[0.98] sm:hidden"
      >
        <Plus className="h-5 w-5" />
        Request Emergency Blood
      </Link>
    </div>
  );
}
