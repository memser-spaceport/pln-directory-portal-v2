import { MemberProfileCard } from '@components/MemberProfileCard';

export default function MemberProfileCardPreviewPage() {
  return (
    <div style={{
      padding: '40px',
      background: 'var(--background-neutral-subtle)',
      minHeight: '100vh',
    }}>
      <h1 style={{ marginBottom: 8, fontSize: 20, fontWeight: 600 }}>MemberProfileCard</h1>
      <p style={{ marginBottom: 40, color: 'var(--foreground-neutral-secondary)', fontSize: 14 }}>
        Hero member card — directory pages &amp; discovery surfaces. <br/>
        Gradient header · decorative rings · 96px avatar · availability pill.
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 24,
        maxWidth: 1200,
      }}>

        {/* 1. Photo + available */}
        <MemberProfileCard
          name="Maya Krishnamurthy"
          role="Research Engineer"
          company="Protocol Labs"
          location="San Francisco, CA"
          availability="available"
          avatar="https://i.pravatar.cc/200?img=49"
          tags={['IPFS', 'Distributed Systems', 'Rust']}
        />

        {/* 2. Photo + booked */}
        <MemberProfileCard
          name="David Park"
          role="Protocol Engineer"
          company="Filecoin Foundation"
          location="New York, NY"
          availability="booked"
          avatar="https://i.pravatar.cc/200?img=12"
          tags={['Solidity', 'FVM', 'Cryptography']}
        />

        {/* 3. Photo + no status */}
        <MemberProfileCard
          name="Fatima Al-Hassan"
          role="Product Designer"
          company="Ethereum Foundation"
          location="Berlin, Germany"
          avatar="https://i.pravatar.cc/200?img=47"
          tags={['Design Systems', 'Figma', 'Accessibility']}
        />

        {/* 4. Initials fallback + available — 3xl = 96px = above lg cutoff → two initials "AS" */}
        <MemberProfileCard
          name="Avery Santos"
          role="DevRel Engineer"
          company="IPFS"
          location="Austin, TX"
          availability="available"
          tags={['Go', 'libp2p', 'Community']}
        />

        {/* 5. Initials fallback + unavailable */}
        <MemberProfileCard
          name="Jordan Kim"
          role="Infrastructure Lead"
          company="libp2p"
          location="Remote"
          availability="unavailable"
          tags={['Kubernetes', 'Networking', 'Go']}
        />

        {/* 6. Long name — layout stress test */}
        <MemberProfileCard
          name="Bartholomew Fitzgerald-Nguyen"
          role="Senior Applied Cryptography Researcher"
          company="Protocol Labs"
          location="Cambridge, United Kingdom"
          availability="booked"
          avatar="https://i.pravatar.cc/200?img=59"
          tags={['ZK Proofs', 'Halo2', 'Mathematics', 'Cryptography']}
        />

      </div>
    </div>
  );
}
