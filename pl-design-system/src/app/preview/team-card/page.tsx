// /preview/team-card — visual verification after Phase 2.2 Avatar refactor
// Checks:
//   - 52px team logo unchanged (inline, pending design review)
//   - Member rows: md=32px circle, single-initial brand-blue fallback
//   - Brand-blue bg + white initial at 12px in 32px circle — balance check
//   - Avatar row aligns naturally with label-sm member name typography
//   - Overflow "+N" indicator (list-level, unchanged)

import { TeamCard } from '@components/TeamCard';

const TEAM_LOGO   = 'https://i.pravatar.cc/300?img=50';
const MEMBER_P1   = 'https://i.pravatar.cc/300?img=11';
const MEMBER_P2   = 'https://i.pravatar.cc/300?img=32';
const MEMBER_P3   = 'https://i.pravatar.cc/300?img=47';

export default function TeamCardPreviewPage() {
  return (
    <main style={{ maxWidth: 720, margin: '40px auto', padding: '0 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      <div style={{ gridColumn: '1 / -1', fontFamily: 'var(--font-family-primary)' }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>TeamCard — Avatar refactor</h1>
        <p style={{ fontSize: 14, color: 'var(--foreground-neutral-secondary)', marginBottom: 4 }}>
          52px team logo unchanged · md=32px member circles · single-initial brand-blue fallback
        </p>
        <p style={{ fontSize: 12, color: 'var(--foreground-neutral-tertiary)', marginBottom: 16 }}>
          Verify: single letter (not two) · blue bg + white text · row alignment with label-sm name
        </p>
      </div>

      {/* Logo + photo members — verify logo unchanged, members at md */}
      <TeamCard
        logo={TEAM_LOGO}
        name="Protocol Labs"
        description="Building the next generation of the internet."
        tags={['Web3', 'IPFS', 'Filecoin']}
        stage="Growth"
        members={[
          { name: 'Alex Chen', role: 'Protocol Engineer', avatar: MEMBER_P1 },
          { name: 'Sam Rivera', role: 'Research Scientist', avatar: MEMBER_P2 },
          { name: 'Jordan Kim', role: 'Developer Advocate', avatar: MEMBER_P3 },
        ]}
      />

      {/* No logo — logoFallback shows "PL" at 52px, inline, unchanged */}
      <TeamCard
        name="PL Research"
        logoFallback="PL"
        description="Theoretical foundations for decentralised systems."
        tags={['Cryptography', 'Research']}
        members={[
          { name: 'Alex Chen', role: 'Protocol Engineer' },
          { name: 'Sam Rivera', role: 'Research Scientist' },
        ]}
      />

      {/* Initials-only members — key visual check: single initial "A", "S", "J", "R" */}
      <TeamCard
        name="Cryptography Team"
        description="Zero-knowledge proofs and post-quantum primitives."
        tags={['ZK', 'Post-Quantum']}
        members={[
          { name: 'Alex Chen', role: 'Lead Engineer' },
          { name: 'Sam Rivera', role: 'Researcher' },
          { name: 'Jordan Kim', role: 'Engineer' },
          { name: 'Riley Park', role: 'Research Lead' },
        ]}
      />

      {/* Overflow — 6 members, MAX=4, overflow "+2" pill */}
      <TeamCard
        name="Network Research"
        description="Routing, congestion, and overlay topology."
        tags={['Networking']}
        members={[
          { name: 'Alex Chen', avatar: MEMBER_P1 },
          { name: 'Sam Rivera', avatar: MEMBER_P2 },
          { name: 'Jordan Kim', avatar: MEMBER_P3 },
          { name: 'Riley Park' },
          { name: 'Casey Mori' },
          { name: 'Morgan Blake' },
        ]}
      />

      {/* Single-word name member — should show single "A" not crash */}
      <TeamCard
        name="Governance"
        description="Decentralised decision-making."
        members={[
          { name: 'Alibek', role: 'Researcher' },
          { name: 'Jordan Kim', role: 'Engineer' },
        ]}
      />

      {/* Compact variant */}
      <TeamCard
        name="Storage Systems"
        description="Filecoin storage market and retrieval."
        compact
        logo={TEAM_LOGO}
        members={[
          { name: 'Alex Chen', avatar: MEMBER_P1 },
          { name: 'Sam Rivera', role: 'Engineer' },
        ]}
      />
    </main>
  );
}
