'use client';

/**
 * Member profile: the events a member is going to.
 *
 * /events/irl became admin-only on 2026-11-05 (LAB-3117), so a member's
 * attendance lives in two places they already are: this profile section and
 * the Home rail (`homepage`). Both open one `GatheringModal`.
 *
 * Reuse map
 *  - Page: `MemberProfilePage` (new optional props, nothing else changed).
 *  - Modal: production's IrlGatheringModal parts and stylesheet; the submit hooks are `goingStore`.
 *  - Row: Home's rail row. Past tiles: team profile's Contributions.
 *  - Menu: NewsShareMenu chrome. Confirm: core ConfirmDialog.
 */

import clsx from 'clsx';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { MemberProfilePage } from '../member-profile/MemberProfilePrototype';
import { MOCK_MEMBER } from '../member-profile/mocks';
import band from '../member-profile/MemberProfile.module.scss';
import { SuggestedRail, SUGGESTED_MEMBERS } from '../profile-shared/SuggestedRail';

import { SEEDED_OWNER, setOwnerPlans, useGoing } from './goingStore';
import { MemberEventsSection, useVisibleUpcoming, type ProfileViewer } from './MemberEventsSection';

const VIEWERS: { value: ProfileViewer; label: string }[] = [
  { value: 'owner', label: 'Their own profile' },
  { value: 'member', label: 'Signed-in member' },
  { value: 'signed-out', label: 'Signed out' },
];

export default function MemberEventsGoingPrototype() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const raw = searchParams.get('viewer');
  const viewer: ProfileViewer = VIEWERS.some((v) => v.value === raw) ? (raw as ProfileViewer) : 'owner';

  const going = useGoing('owner');
  const hasPlans = Object.keys(going).length > 0;
  const upcoming = useVisibleUpcoming(viewer);

  if (!mounted) return null;

  const setViewer = (value: ProfileViewer) =>
    router.replace(value === 'owner' ? pathname : `${pathname}?viewer=${value}`, { scroll: false });

  const reviewBand = (
    <div className={band.demoSwitch}>
      <div className={band.demoSwitchGroup}>
        <span className={band.demoSwitchLabel}>Viewer</span>
        <div className={band.demoSwitchRow}>
          {VIEWERS.map((v) => (
            <button
              key={v.value}
              type="button"
              className={clsx(band.demoSwitchBtn, { [band.active]: v.value === viewer })}
              onClick={() => setViewer(v.value)}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>
      <div className={band.demoSwitchGroup}>
        <span className={band.demoSwitchLabel}>Upcoming events</span>
        <div className={band.demoSwitchRow}>
          <button
            type="button"
            className={clsx(band.demoSwitchBtn, { [band.active]: hasPlans })}
            onClick={() => setOwnerPlans(SEEDED_OWNER)}
          >
            Has plans
          </button>
          <button
            type="button"
            className={clsx(band.demoSwitchBtn, { [band.active]: !hasPlans })}
            onClick={() => setOwnerPlans({})}
          >
            None yet
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <MemberProfilePage
      askAi="header"
      reviewBand={reviewBand}
      isOwner={viewer === 'owner'}
      eventsSection={<MemberEventsSection viewer={viewer} firstName={MOCK_MEMBER.name.split(' ')[0]} />}
      /* Up under Office Hours while there is something to act on, and for the
         owner, whose prompt has to be seen. Otherwise production's slot. */
      eventsHigh={upcoming.length > 0 || viewer === 'owner'}
      suggestions={<SuggestedRail kind="member" items={SUGGESTED_MEMBERS} />}
    />
  );
}
