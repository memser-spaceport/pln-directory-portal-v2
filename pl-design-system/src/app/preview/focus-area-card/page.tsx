// /preview/focus-area-card — visual verification after Phase 2.2 Avatar refactor
// Checks: xs (20px) AvatarStack, single-initial fallback, overflow pill, 6px overlap.

import { FocusAreaCard } from '@components/FocusAreaCard';

const P1 = 'https://i.pravatar.cc/300?img=11';
const P2 = 'https://i.pravatar.cc/300?img=32';
const P3 = 'https://i.pravatar.cc/300?img=47';
const P4 = 'https://i.pravatar.cc/300?img=56';
const P5 = 'https://i.pravatar.cc/300?img=68';

export default function FocusAreaCardPreviewPage() {
  return (
    <main style={{ maxWidth: 720, margin: '40px auto', padding: '0 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      <div style={{ gridColumn: '1 / -1', fontFamily: 'var(--font-family-primary)' }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>FocusAreaCard — Avatar refactor</h1>
        <p style={{ fontSize: 14, color: 'var(--foreground-neutral-secondary)', marginBottom: 16 }}>
          xs=20px AvatarStack · single-initial fallback · overflow pill · ~6px overlap
        </p>
      </div>

      {/* 2 members — no overflow pill */}
      <FocusAreaCard
        title="Distributed Systems"
        description="Research and implementation of distributed consensus protocols."
        teamCount={3}
        projectCount={7}
        members={[
          { name: 'Alex Chen', avatar: P1 },
          { name: 'Sam Rivera', avatar: P2 },
        ]}
      />

      {/* 4 members — exactly maxVisible, no overflow */}
      <FocusAreaCard
        title="Cryptography"
        description="Zero-knowledge proofs and post-quantum primitives."
        teamCount={5}
        projectCount={12}
        members={[
          { name: 'Alex Chen', avatar: P1 },
          { name: 'Sam Rivera', avatar: P2 },
          { name: 'Jordan Kim', avatar: P3 },
          { name: 'Riley Park', avatar: P4 },
        ]}
      />

      {/* 6 members — overflow pill shows "+2" */}
      <FocusAreaCard
        title="Protocol Engineering"
        description="IPFS, libp2p, and content-addressed storage."
        teamCount={8}
        projectCount={20}
        members={[
          { name: 'Alex Chen', avatar: P1 },
          { name: 'Sam Rivera', avatar: P2 },
          { name: 'Jordan Kim', avatar: P3 },
          { name: 'Riley Park', avatar: P4 },
          { name: 'Casey Mori' },
          { name: 'Morgan Blake' },
        ]}
      />

      {/* Initials-only — no photos, verifies brand-blue + white text + single initial at xs */}
      <FocusAreaCard
        title="Network Research"
        description="Routing, congestion, and overlay topology."
        teamCount={2}
        projectCount={4}
        members={[
          { name: 'Alex Chen' },
          { name: 'Sam Rivera' },
          { name: 'Jordan Kim' },
          { name: 'Riley Park' },
          { name: 'Casey Mori' },
        ]}
      />

      {/* No members — avatar stack section should not render */}
      <FocusAreaCard
        title="Storage Systems"
        description="Filecoin storage market and retrieval protocols."
        teamCount={4}
        projectCount={9}
        members={[]}
      />

      {/* No stats at all */}
      <FocusAreaCard
        title="Governance"
        description="Decentralised decision-making and protocol parameter management."
      />
    </main>
  );
}
