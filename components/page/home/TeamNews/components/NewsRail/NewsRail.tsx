'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { useForumAccess } from '@/services/access-control/hooks/useForumAccess';
import { useCurrentUserStore } from '@/services/auth/store';
import { useGetForumDigestSettings, type ForumDigestSettings } from '@/services/forum/hooks/useGetForumDigestSettings';
import { useUpdateForumDigestSettings } from '@/services/forum/hooks/useUpdateForumDigestSettings';
import { useSettingsAnalytics } from '@/analytics/settings.analytics';
import { TeamsIcon } from '@/components/core/navbar/components/icons';

import s from './NewsRail.module.scss';

const ArrowRight = () => (
  <svg width="11" height="10" viewBox="0 0 11 10" fill="none" aria-hidden="true">
    <path
      d="M10.7455 5.06028L6.80805 8.99778C6.68476 9.12106 6.51755 9.19032 6.3432 9.19032C6.16885 9.19032 6.00164 9.12106 5.87836 8.99778C5.75508 8.8745 5.68582 8.70729 5.68582 8.53294C5.68582 8.35859 5.75508 8.19138 5.87836 8.06809L8.69531 5.25223H0.65625C0.482202 5.25223 0.315282 5.18309 0.192211 5.06002C0.0691404 4.93695 0 4.77003 0 4.59598C0 4.42193 0.0691404 4.25501 0.192211 4.13194C0.315282 4.00887 0.482202 3.93973 0.65625 3.93973H8.69531L5.87945 1.12223C5.75617 0.998948 5.68691 0.831738 5.68691 0.657388C5.68691 0.483038 5.75617 0.315829 5.87945 0.192544C6.00274 0.0692602 6.16995 1.83708e-09 6.3443 0C6.51865 -1.83708e-09 6.68586 0.0692602 6.80914 0.192544L10.7466 4.13004C10.8078 4.19109 10.8564 4.26363 10.8894 4.34349C10.9225 4.42335 10.9395 4.50895 10.9394 4.59539C10.9393 4.68183 10.9221 4.76739 10.8888 4.84717C10.8556 4.92695 10.8069 4.99937 10.7455 5.06028Z"
      fill="currentColor"
    />
  </svg>
);

const MailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <rect x="2.5" y="4.5" width="15" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M3 6l7 5 7-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const buildDefaultDigestSettings = (uid: string): ForumDigestSettings => ({
  forumDigestEnabled: false,
  forumDigestFrequency: 7,
  forumDigestNewsEnabled: false,
  forumDigestLastSentAt: null,
  memberExternalId: null,
  memberUid: uid,
});

interface NewsRailProps {
  /** Fetched server-side (like Settings > Email) so the subscribed/not-subscribed
   * card matches on first paint — no client-side flash while the query resolves. */
  initialDigestSettings?: ForumDigestSettings | null;
}

/** Static why-follow explainer + a digest subscribe CTA that reuses the same forum-digest mutation as Settings > Email (weekly frequency). */
export function NewsRail({ initialDigestSettings = null }: NewsRailProps) {
  const router = useRouter();
  const { currentUser, isHydrated } = useCurrentUserStore();
  const { hasAccess, isLoading: forumAccessLoading } = useForumAccess();
  const analytics = useSettingsAnalytics();
  const showDigest = !currentUser || (!forumAccessLoading && hasAccess);
  const { mutate } = useUpdateForumDigestSettings();

  const defaultSettings = useMemo(
    () => initialDigestSettings ?? buildDefaultDigestSettings(currentUser?.uid ?? ''),
    [initialDigestSettings, currentUser?.uid],
  );
  const { data } = useGetForumDigestSettings(currentUser?.uid, defaultSettings);
  // Known server-side up front (via initialDigestSettings), so this doesn't
  // need to wait on client auth-store hydration the way the button below does.
  const isSubscribed = Boolean(data?.forumDigestEnabled);

  const handleSubscribeClick = () => {
    if (!currentUser?.uid) {
      router.push(`${window.location.pathname}${window.location.search}#login`);
      return;
    }

    const payload = { ...(data ?? defaultSettings), forumDigestEnabled: true, forumDigestFrequency: 7 as const };
    mutate(
      { uid: currentUser.uid, payload },
      { onError: () => analytics.onForumDigestSaveFailed({ attemptedFrequency: 'weekly' }) },
    );
    analytics.onForumDigestOptionSelect(payload);
  };

  return (
    <aside className={s.rail} aria-label="News feed sidebar">
      <section className={s.whyCard} aria-label="Why follow teams">
        <span className={s.iconBadge} aria-hidden="true">
          <TeamsIcon />
        </span>
        <p className={s.whyTitle}>Stay in the loop</p>
        <p className={s.whyBody}>Follow teams to receive updates and announcements.</p>
      </section>

      {showDigest &&
        (isSubscribed ? (
          <section className={s.subscribedCard} aria-label="You're subscribed to the news digest">
            <span className={s.iconBadge} aria-hidden="true">
              <MailIcon />
            </span>
            <p className={s.whyTitle}>You&apos;re subscribed to the Digest</p>
            <p className={s.whyBody}>Change frequency or unsubscribe anytime in Settings.</p>
            <Link href="/settings/email" className={s.manageLink}>
              <span>Manage in Settings</span>
              <ArrowRight />
            </Link>
          </section>
        ) : (
          <section className={s.digestCard} aria-label="Subscribe to the news digest">
            <p className={s.digestTitle}>Get notified about network news updates</p>
            <p className={s.digestBody}>
              A news digest covering raises, launches, and milestones across the network, straight to your inbox.
            </p>
            {isHydrated && (
              <button type="button" className={s.digestBtn} onClick={handleSubscribeClick}>
                <span>Subscribe for Digest</span>
                <ArrowRight />
              </button>
            )}
          </section>
        ))}
    </aside>
  );
}
