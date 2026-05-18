// /preview/office-hours-card — visual verification after Phase 2.2 Avatar refactor
// Checks: xl (56px) circle for person, rounded (12px) for team, photo + initials fallback.

import { OfficeHoursCard } from '@components/OfficeHoursCard';

const PERSON_PHOTO = 'https://i.pravatar.cc/300?img=11';
const TEAM_LOGO = 'https://i.pravatar.cc/300?img=50';
const BAD_URL = 'https://not-a-real-domain.example/broken.jpg';

export default function OfficeHoursCardPreviewPage() {
  return (
    <main style={{ maxWidth: 640, margin: '40px auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ fontFamily: 'var(--font-family-primary)' }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>OfficeHoursCard — Avatar refactor</h1>
        <p style={{ fontSize: 14, color: 'var(--foreground-neutral-secondary)', marginBottom: 16 }}>
          xl=56px · circle for person · rounded (12px) for team · photo + fallback states
        </p>
      </div>

      {/* Person with photo — 56px circle */}
      <OfficeHoursCard
        title="Open Office Hours"
        host={{ name: 'Alex Chen', role: 'Ripple', bio: 'Distributed systems, protocol engineering.', avatar: PERSON_PHOTO }}
        scheduleLabel="Schedule Meeting"
      />

      {/* Person without photo — 56px circle, brand-blue bg, two initials "AC" */}
      <OfficeHoursCard
        title="Open Office Hours"
        host={{ name: 'Alex Chen', role: 'Protocol Labs', bio: 'Cryptography and zero-knowledge proofs.' }}
        scheduleLabel="Schedule Meeting"
      />

      {/* Person with broken src — should fall back to initials */}
      <OfficeHoursCard
        title="Office Hours"
        host={{ name: 'Sam Rivera', role: 'Filecoin Foundation', avatar: BAD_URL }}
        scheduleLabel="Book a slot"
      />

      {/* Team with logo image — 56px rounded (12px radius), verify visual radius change */}
      <OfficeHoursCard
        title="Team Office Hours"
        host={{ name: 'Protocol Labs', role: 'Core Team', bio: 'Ask us anything about IPFS and libp2p.', avatar: TEAM_LOGO, isTeam: true }}
        scheduleLabel="Schedule with Team"
      />

      {/* Team without logo — 56px rounded (12px), brand-blue bg, two initials "PL" */}
      <OfficeHoursCard
        title="Research Office Hours"
        host={{ name: 'PL Research', role: 'Research Group', bio: 'Theoretical foundations and applied cryptography.', isTeam: true }}
        scheduleLabel="Join Session"
      />

      {/* No title — host name only */}
      <OfficeHoursCard
        host={{ name: 'Jordan Kim', role: 'Network Team' }}
      />
    </main>
  );
}
