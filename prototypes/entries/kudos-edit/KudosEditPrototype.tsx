'use client';

import { useState } from 'react';
import type { ICommunityKudosInput } from '@/components/page/aligement-assets/kudos-board/data/kudos-board.types';

import { KudosCard } from '@/components/page/aligement-assets/kudos-board/kudos-card';
import { mockCurrentUser, mockRecipients, mockLimits, mockKudos, mockPoolRemaining } from './mocks';

/**
 * PLAA-50 click-through, no login or PLAA backend needed. Renders the real
 * KudosCard via its preview props. Don't seed the real `useCurrentUserStore`
 * here: other always-mounted components watch it for real session state, and
 * a fake user reads to them as a broken session.
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
