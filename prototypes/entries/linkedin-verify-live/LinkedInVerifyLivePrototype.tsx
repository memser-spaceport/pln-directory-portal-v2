'use client';

import { Suspense } from 'react';

import type { IMember } from '@/types/members.types';
import type { IUserInfo } from '@/types/shared.types';

// The real production component, imported — not transcribed. The whole point of
// this entry is to answer "what does it look like right now", so a copy would be
// worthless: it could drift the moment production changed and nobody would know.
import { OneClickVerification } from '@/components/page/member-details/OneClickVerification';

/**
 * A viewing stand for production's LinkedIn verification prompt.
 *
 * That component lives on the **member profile** page (`app/members/[id]`), not in
 * settings, and it renders only when every one of these is true:
 *   - the viewer owns the profile (`userInfo.uid === member.id`)
 *   - the member has no `linkedinProfile` yet
 *   - `member.rbac.status === 'PENDING'`
 *   - the member is not a new investor
 * Which is why it is hard to catch in the running app: it needs a signed-in,
 * pending, un-verified account. Here the props are mocked to satisfy the gate so
 * the block renders on demand.
 *
 * Mocked data only — no network. `useLinkedInVerification` is only called when the
 * button is pressed, so nothing fires on load.
 */
const MOCK_MEMBER = {
  id: 'mock-member',
  linkedinProfile: null,
  rbac: { status: 'PENDING' },
} as unknown as IMember;

const MOCK_USER: IUserInfo = { uid: 'mock-member' } as IUserInfo;

export default function LinkedInVerifyLivePrototype() {
  return (
    <div style={{ padding: 32, background: '#f1f5f9', minHeight: '100vh' }}>
      <div style={{ maxWidth: 656, margin: '0 auto' }}>
        <Suspense fallback={null}>
          <OneClickVerification member={MOCK_MEMBER} userInfo={MOCK_USER} isLoggedIn />
        </Suspense>
      </div>
    </div>
  );
}
