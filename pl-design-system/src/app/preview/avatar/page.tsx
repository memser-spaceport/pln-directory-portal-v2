// /preview/avatar — Avatar + AvatarStack visual verification (v2)
// Canonical Figma source: Avatar (10:1763). Presence dot removed; MemberCard pill restored.

import { Avatar, AvatarStack } from '@components/Avatar';
import type { AvatarSize, AvatarShape, AvatarType } from '@components/Avatar';
import { MemberCard } from '@components/MemberCard';
import styles from './page.module.scss';

const PHOTO_URL = 'https://i.pravatar.cc/300?img=11';
const PHOTO_URL_2 = 'https://i.pravatar.cc/300?img=32';
const PHOTO_URL_3 = 'https://i.pravatar.cc/300?img=47';
const BAD_URL = 'https://not-a-real-domain.example/broken.jpg';

export default function AvatarPreviewPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>Avatar</h1>
        <p>
          Canonical Figma source: <code>❖ Avatars canvas → "Avatar" (10:1763)</code>.
          Rewritten v2 — corrected sizes, canonical types, badge slots.
        </p>
      </header>

      {/* ── 1. Sizes ──────────────────────────────────────────────────────── */}
      <Section title="1 — Sizes (all 7, circle, letter-of-name)">
        <Row>
          {(['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'] as AvatarSize[]).map((size) => (
            <Cell key={size} label={`${size}`}>
              <Avatar name="Alex Chen" size={size} />
            </Cell>
          ))}
        </Row>
        <p className={styles.note}>
          xs=20 sm=24 md=32 lg=40 xl=56 2xl=64 3xl=96px — corrected from v1 (xl was 48, 3xl was 80).
        </p>
      </Section>

      {/* ── 2. Types ──────────────────────────────────────────────────────── */}
      <Section title="2 — Types (xl, circle)">
        <Row>
          <Cell label="image">
            <Avatar name="Alex Chen" src={PHOTO_URL} size="xl" />
          </Cell>
          <Cell label="letter-of-name">
            <Avatar name="Alex Chen" size="xl" type="letter-of-name" />
          </Cell>
          <Cell label="placeholder">
            <Avatar name="Alex Chen" size="xl" type="placeholder" />
          </Cell>
          <Cell label="image → fallback">
            <Avatar name="Alex Chen" src={BAD_URL} size="xl" />
          </Cell>
          <Cell label="brand-logo">
            <Avatar
              name="Protocol Labs"
              size="xl"
              type="brand-logo"
              icon={
                <svg viewBox="0 0 24 24" fill="var(--foreground-brand-primary)">
                  <circle cx="12" cy="12" r="10" />
                </svg>
              }
            />
          </Cell>
          <Cell label="emoji">
            <Avatar name="Happy" size="xl" type="emoji" icon={<span style={{ fontSize: 28 }}>😊</span>} />
          </Cell>
        </Row>
      </Section>

      {/* ── 3. Shapes ─────────────────────────────────────────────────────── */}
      <Section title="3 — Shapes (xl, photo + initials)">
        <Row>
          {(['circle', 'rounded'] as AvatarShape[]).map((shape) => (
            <>
              <Cell key={`${shape}-photo`} label={`${shape} + photo`}>
                <Avatar name="Alex Chen" src={PHOTO_URL} size="xl" shape={shape} />
              </Cell>
              <Cell key={`${shape}-initials`} label={`${shape} + initials`}>
                <Avatar name="Alex Chen" size="xl" shape={shape} />
              </Cell>
              <Cell key={`${shape}-placeholder`} label={`${shape} + placeholder`}>
                <Avatar name="Alex Chen" size="xl" shape={shape} type="placeholder" />
              </Cell>
            </>
          ))}
        </Row>
        <p className={styles.note}>
          Figma has exactly two shapes: circle (50%) and rounded (4px / radius-xsm).
          Previous impl had a spurious 12px-rounded shape — removed.
        </p>
      </Section>

      {/* ── 4. Badge slots ────────────────────────────────────────────────── */}
      <Section title="4 — Badge slots: topBadge + bottomBadge">
        <p className={styles.note}>
          <code>topBadge</code> renders at top-right (Verified, Logo, etc.).{' '}
          <code>bottomBadge</code> renders at bottom-center — for card-level badges.
          Consumers own the badge content and styling.
        </p>
        <Row>
          <Cell label="topBadge (verified)">
            <Avatar name="Alex Chen" src={PHOTO_URL} size="2xl" topBadge={<VerifiedBadge />} />
          </Cell>
          <Cell label="bottomBadge (custom)" tall>
            <Avatar
              name="Alex Chen"
              src={PHOTO_URL}
              size="3xl"
              bottomBadge={
                <div style={{
                  height: 16, padding: '0 6px', borderRadius: 9999,
                  background: 'var(--background-neutral-subtle)',
                  border: '1px solid var(--border-neutral-subtle)',
                  fontSize: 10, fontFamily: 'var(--font-family-primary)',
                  fontWeight: 400, color: 'var(--foreground-neutral-secondary)',
                  whiteSpace: 'nowrap', display: 'flex', alignItems: 'center',
                }}>
                  Custom badge
                </div>
              }
            />
          </Cell>
        </Row>
      </Section>

      {/* ── 5. 3xl hero + decorative rings ───────────────────────────────── */}
      <Section title="5 — 3xl hero: decorative rings (rings off / on)">
        <div className={styles.heroRow}>
          <Cell label="3xl — no rings">
            <div className={styles.heroContainer}>
              <Avatar name="Alex Chen" src={PHOTO_URL} size="3xl" />
            </div>
          </Cell>
          <Cell label="3xl — rings">
            <div className={styles.heroContainer}>
              <Avatar name="Alex Chen" src={PHOTO_URL} size="3xl" decorativeRing />
            </div>
          </Cell>
          <Cell label="rings + initials">
            <div className={styles.heroContainer}>
              <Avatar name="Alex Chen" size="3xl" decorativeRing />
            </div>
          </Cell>
        </div>
      </Section>

      {/* ── 6. MemberCard context ─────────────────────────────────────────── */}
      <Section title="6 — MemberCard availability pill (restored)">
        <p className={styles.note}>
          The pill is a card-level badge rendered inline by <code>MemberCard</code>, not routed through Avatar.
          Routing it through <code>Avatar.status</code> is deferred to Phase 2.2.
        </p>
        <Row>
          <Cell label='availability="available"' tall>
            <MemberCard
              name="Alex Chen"
              role="Senior Engineer"
              company="Ripple"
              avatar={PHOTO_URL}
              availability="available"
            />
          </Cell>
          <Cell label='availability="booked"' tall>
            <MemberCard
              name="Sam Rivera"
              role="Protocol Engineer"
              company="Protocol Labs"
              avatar={PHOTO_URL_2}
              availability="booked"
            />
          </Cell>
          <Cell label="no availability" tall>
            <MemberCard
              name="Jordan Kim"
              role="Research Scientist"
              company="Filecoin Foundation"
              avatar={PHOTO_URL_3}
            />
          </Cell>
        </Row>
      </Section>

      {/* ── 7. AvatarStack ───────────────────────────────────────────────── */}
      <Section title="7 — AvatarStack (gap=auto, circle + photo)">
        <Row>
          {(['xs', 'sm', 'md', 'lg', 'xl'] as AvatarSize[]).map((size) => (
            <Cell key={size} label={`size=${size}`}>
              <AvatarStack size={size}>
                <Avatar name="Alex Chen" src={PHOTO_URL} size={size} />
                <Avatar name="Sam Rivera" src={PHOTO_URL_2} size={size} />
                <Avatar name="Jordan Kim" src={PHOTO_URL_3} size={size} />
              </AvatarStack>
            </Cell>
          ))}
        </Row>
      </Section>

      {/* ── 8. AvatarStack shapes ─────────────────────────────────────────── */}
      <Section title="8 — AvatarStack shapes (lg)">
        <Row>
          {(['circle', 'rounded'] as AvatarShape[]).map((shape) => (
            <Cell key={shape} label={`shape=${shape}`}>
              <AvatarStack size="lg" shape={shape}>
                <Avatar name="Alex Chen" size="lg" shape={shape} />
                <Avatar name="Sam Rivera" size="lg" shape={shape} />
                <Avatar name="Jordan Kim" size="lg" shape={shape} />
              </AvatarStack>
            </Cell>
          ))}
        </Row>
      </Section>

      {/* ── 9. AvatarStack overflow + gap ────────────────────────────────── */}
      <Section title="9 — AvatarStack overflow pill + gap overrides (md)">
        <Row>
          <Cell label="5 avatars, maxVisible=3">
            <AvatarStack size="md" maxVisible={3}>
              <Avatar name="Alex Chen" src={PHOTO_URL} size="md" />
              <Avatar name="Sam Rivera" src={PHOTO_URL_2} size="md" />
              <Avatar name="Jordan Kim" src={PHOTO_URL_3} size="md" />
              <Avatar name="Riley Park" size="md" />
              <Avatar name="Casey Mori" size="md" />
            </AvatarStack>
          </Cell>
          <Cell label="overflow=99">
            <AvatarStack size="md" maxVisible={3} overflow={99}>
              <Avatar name="Alex Chen" src={PHOTO_URL} size="md" />
              <Avatar name="Sam Rivera" src={PHOTO_URL_2} size="md" />
              <Avatar name="Jordan Kim" size="md" />
            </AvatarStack>
          </Cell>
          <Cell label="gap=2 (dense)">
            <AvatarStack size="md" gap={2}>
              <Avatar name="Alex Chen" src={PHOTO_URL} size="md" />
              <Avatar name="Sam Rivera" src={PHOTO_URL_2} size="md" />
              <Avatar name="Jordan Kim" size="md" />
            </AvatarStack>
          </Cell>
          <Cell label="gap=−14 (spacious)">
            <AvatarStack size="md" gap={-14}>
              <Avatar name="Alex Chen" src={PHOTO_URL} size="md" />
              <Avatar name="Sam Rivera" src={PHOTO_URL_2} size="md" />
              <Avatar name="Jordan Kim" size="md" />
            </AvatarStack>
          </Cell>
        </Row>
      </Section>
    </main>
  );
}

// ─── Mock badge sub-components ────────────────────────────────────────────────

function VerifiedBadge() {
  return (
    <div
      style={{
        width: 20,
        height: 20,
        borderRadius: '50%',
        background: '#1b4dff',
        border: '2px solid white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
        <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

// ─── Layout helpers ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {children}
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className={styles.row}>{children}</div>;
}

function Cell({ label, children, tall }: { label: string; children: React.ReactNode; tall?: boolean }) {
  return (
    <div className={`${styles.cell} ${tall ? styles.cellTall : ''}`}>
      <div className={styles.cellContent}>{children}</div>
      <span className={styles.cellLabel}>{label}</span>
    </div>
  );
}
