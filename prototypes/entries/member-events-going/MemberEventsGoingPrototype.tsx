'use client';

/**
 * Member profile: the events a member is going to. And the team profile's copy.
 *
 * /events/irl became admin-only on 2026-11-05 (LAB-3117), so a member's
 * attendance lives in two places they already are: this profile section and
 * the Home rail (`homepage`). Both open one `GatheringModal`.
 *
 * One layout: one Events section, upcoming cards stacked above Contributions.
 * The Profile switch (?profile=team) shows the same section adapted for the
 * team profile, in place of the team page's Contributions tiles.
 *
 * Reuse map
 *  - Pages: `MemberProfilePage` and `team-profile`'s page (new optional props, nothing else changed).
 *  - Modal: production's IrlGatheringModal parts and stylesheet; the submit hooks are `goingStore`.
 *  - Section: production's DetailsSection, Home's date tile, team profile's role tags.
 *  - Menu: NewsShareMenu chrome. Confirm: core ConfirmDialog.
 */

import clsx from 'clsx';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { MemberProfilePage } from '../member-profile/MemberProfilePrototype';
import { MOCK_MEMBER } from '../member-profile/mocks';
import band from '../member-profile/MemberProfile.module.scss';
import { SuggestedRail, SUGGESTED_MEMBERS } from '../profile-shared/SuggestedRail';
import TeamProfilePrototype from '../team-profile/TeamProfilePrototype';
import teamBand from '../team-profile/TeamProfile.module.scss';

import { SEEDED_OWNER, setOwnerPlans, useGoing } from './goingStore';
import { MemberEventsSection, useVisibleUpcoming, type ProfileViewer } from './MemberEventsSection';

const VIEWERS: { value: ProfileViewer; label: string }[] = [
  { value: 'owner', label: 'Their own profile' },
  { value: 'member', label: 'Signed-in member' },
  { value: 'signed-out', label: 'Signed out' },
];

type Profile = 'member' | 'team';

const PROFILES: { value: Profile; label: string }[] = [
  { value: 'member', label: 'Member' },
  { value: 'team', label: 'Team' },
];

export default function MemberEventsGoingPrototype() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const raw = searchParams.get('viewer');
  const viewer: ProfileViewer = VIEWERS.some((v) => v.value === raw) ? (raw as ProfileViewer) : 'owner';
  const profile: Profile = searchParams.get('profile') === 'team' ? 'team' : 'member';

  const going = useGoing('owner');
  const hasPlans = Object.keys(going).length > 0;
  const upcoming = useVisibleUpcoming(viewer);

  if (!mounted) return null;

  const setParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    const query = params.toString();
    router.replace(query ? pathname + '?' + query : pathname, { scroll: false });
  };
  const setViewer = (value: ProfileViewer) => setParam('viewer', value === 'owner' ? null : value);
  const setProfile = (value: Profile) => setParam('profile', value === 'member' ? null : value);
  const firstName = MOCK_MEMBER.name.split(' ')[0];

  if (profile === 'team') {
    // The team page has its own review bar (View, Status, Roles); the Profile switch joins it.
    return (
      <TeamProfilePrototype
        demoBarExtra={
          <div className={teamBand.demoGroup}>
            <span className={teamBand.demoLabel}>Profile</span>
            <div className={teamBand.demoSwitch}>
              {PROFILES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  className={clsx(teamBand.demoBtn, { [teamBand.demoBtnActive]: p.value === profile })}
                  onClick={() => setProfile(p.value)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        }
      />
    );
  }

  const reviewBand = (
    <div className={band.demoSwitch}>
      <div className={band.demoSwitchGroup}>
        <span className={band.demoSwitchLabel}>Profile</span>
        <div className={band.demoSwitchRow}>
          {PROFILES.map((p) => (
            <button
              key={p.value}
              type="button"
              className={clsx(band.demoSwitchBtn, { [band.active]: p.value === profile })}
              onClick={() => setProfile(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
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
      eventsSection={<MemberEventsSection viewer={viewer} firstName={firstName} />}
      /* Up under Office Hours while there is something to act on, and for the
         owner, whose prompt has to be seen. Otherwise production's slot. */
      eventsHigh={upcoming.length > 0 || viewer === 'owner'}
      suggestions={<SuggestedRail kind="member" items={SUGGESTED_MEMBERS} />}
    />
  );
}
