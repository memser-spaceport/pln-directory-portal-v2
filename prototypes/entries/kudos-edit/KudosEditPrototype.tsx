'use client';

import { useState } from 'react';
import type { ICommunityKudosInput } from '@/components/page/aligement-assets/kudos-board/data/kudos-board.types';

import { KudosCard } from '@/components/page/aligement-assets/kudos-board/kudos-card';
import { mockCurrentUser, mockRecipients, mockLimits, mockKudos, mockPoolRemaining } from './mocks';

/**
 * PLAA-50 (Enable Givers to Edit Community Kudos) — click-through of the three
 * card states without needing a real login or the PLAA backend:
 *   1. Your own kudos, current round  -> Edit action
 *   2. Your own kudos, a past round   -> lock icon, frozen
 *   3. Someone else's kudos           -> neither
 *
 * KudosCard itself is the real production component, unmodified in behavior
 * for the real app:
 *   - `currentUserForPreview` feeds the "is this my kudos" check instead of
 *     the real session. Do NOT seed the real `useCurrentUserStore` here — it's
 *     a global singleton several other always-mounted app components watch
 *     for real session state, and a fake user with no backing cookies reads
 *     to them as a broken session (that's what caused a repeating "logged
 *     out" toast the first version of this file produced).
 *   - `onSaveForPreview` stands in for the real update mutation, which needs
 *     a reachable PLAA backend. Without it, "Save changes" would show a real
 *     error toast instead of demonstrating what a successful edit looks like.
 *   - `limits` mirrors what the real board threads down from `useCommunityPool()`
 *     (`ICommunityPool`'s `pointsMin`/`pointsMax`/`pointsStep`/`messageMin`/
 *     `messageMax` — server-driven, not a hardcoded client constant).
 *
 * No local <ToastContainer> — the app already mounts one globally
 * (components/core/ToastContainer, in app/layout.tsx).
 */
export default function KudosEditPrototype() {
  const [kudosList, setKudosList] = useState(mockKudos);

  function handleSaveForPreview({ id, input }: { id: string; input: ICommunityKudosInput }) {
    return new Promise<(typeof mockKudos)[number]>((resolve) => {
      setTimeout(() => {
        setKudosList((current) =>
          current.map((k) => {
            if (k.id !== id) return k;
            const recipient = mockRecipients.find((r) => r.memberId === input.recipientId) ?? k.recipient;
            const updated = { ...k, recipient, points: input.points, message: input.message };
            resolve(updated);
            return updated;
          }),
        );
      }, 400); // small delay so "Saving…" is visible, same as a real round trip
    });
  }

  return (
    <div style={{ maxWidth: 420, margin: '0 auto', padding: '24px 20px 64px' }}>
      <h1
        style={{
          font: '600 20px/28px var(--font-inter, inherit)',
          color: 'var(--foreground-neutral-primary, #0a0c11)',
          marginBottom: 6,
        }}
      >
        Kudos — edit states
      </h1>
      <p
        style={{
          font: '400 14px/20px var(--font-inter, inherit)',
          color: 'var(--foreground-neutral-secondary, #455468)',
          marginBottom: 24,
        }}
      >
        Previewing as <strong>{mockCurrentUser.name}</strong> (not a real session). Card 1 is hers and open —
        try Edit, change a field, and Save. Card 2 is hers but the round has closed. Card 3 belongs to someone
        else.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {kudosList.map((kudos) => (
          <KudosCard
            key={kudos.id}
            kudos={kudos}
            recipients={mockRecipients}
            poolRemaining={mockPoolRemaining}
            limits={mockLimits}
            currentUserForPreview={mockCurrentUser}
            onSaveForPreview={handleSaveForPreview}
          />
        ))}
      </div>
    </div>
  );
}
