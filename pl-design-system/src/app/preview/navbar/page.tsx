// /preview/navbar — visual verification after Phase 2.2 Avatar refactor
// Checks:
//   - 32px Avatar inside button shell (photo state)
//   - 32px Avatar inside button shell (single-initial fallback: brand-blue bg, white text)
//   - Hover ring: 2px brand-primary outline OUTSIDE the avatar (no clipping)
//   - Focus ring: same brand-primary outline on keyboard focus (:focus-visible)
//   - name="PL" fallback → "P" (single initial at md — confirm looks intentional)
//   - Notification badge renders alongside avatar
//   - Nav items: active state, badge count

import { NavBar } from '@components/NavBar';

const PHOTO = 'https://i.pravatar.cc/300?img=12';

export default function NavBarPreviewPage() {
  return (
    <main style={{ fontFamily: 'var(--font-family-primary)' }}>
      <div style={{ padding: '24px 32px 8px', color: 'var(--foreground-neutral-secondary)', fontSize: 13 }}>
        <strong style={{ color: 'var(--foreground-neutral-primary)' }}>NavBar — Avatar refactor</strong>
        &nbsp;&nbsp;·&nbsp;&nbsp;
        Hover the avatar circle → brand-primary outline ring (outline, not border — no clipping)
        &nbsp;&nbsp;·&nbsp;&nbsp;
        Tab to avatar → same ring visible on keyboard focus
      </div>

      {/* 1. Photo avatar */}
      <div style={{ marginTop: 16 }}>
        <div style={{ padding: '0 32px 6px', fontSize: 12, color: 'var(--foreground-neutral-tertiary)' }}>
          1 · Photo avatar (src provided) — confirm 32px circle, no grey border, ring on hover
        </div>
        <NavBar
          userName="Alex Chen"
          avatar={PHOTO}
          items={[
            { label: 'Directory', href: '#', active: true },
            { label: 'Teams', href: '#' },
            { label: 'Events', href: '#', badge: 3 },
          ]}
          notificationCount={5}
        />
      </div>

      {/* 2. Initials fallback — single initial at md */}
      <div style={{ marginTop: 32 }}>
        <div style={{ padding: '0 32px 6px', fontSize: 12, color: 'var(--foreground-neutral-tertiary)' }}>
          2 · Initials fallback (no src) — "A" from "Alex Chen", brand-blue bg, white text, 12px
        </div>
        <NavBar
          userName="Alex Chen"
          items={[
            { label: 'Directory', href: '#' },
            { label: 'Teams', href: '#', active: true },
          ]}
          notificationCount={0}
        />
      </div>

      {/* 3. Single-word userName */}
      <div style={{ marginTop: 32 }}>
        <div style={{ padding: '0 32px 6px', fontSize: 12, color: 'var(--foreground-neutral-tertiary)' }}>
          3 · Single-word userName "Alibek" → "A" initial
        </div>
        <NavBar
          userName="Alibek"
          items={[{ label: 'Directory', href: '#' }]}
        />
      </div>

      {/* 4. userName undefined → name="PL" → single initial "P" */}
      <div style={{ marginTop: 32 }}>
        <div style={{ padding: '0 32px 6px', fontSize: 12, color: 'var(--foreground-neutral-tertiary)' }}>
          4 · No userName (undefined) → Avatar name="PL" → renders "P" (single initial at md)
          — confirm this looks intentional as a logged-out placeholder
        </div>
        <NavBar
          items={[{ label: 'Directory', href: '#' }]}
          notificationCount={99}
        />
      </div>

      {/* 5. Long userName — confirm initials derive from first word only */}
      <div style={{ marginTop: 32 }}>
        <div style={{ padding: '0 32px 6px', fontSize: 12, color: 'var(--foreground-neutral-tertiary)' }}>
          5 · Long userName "Jordan Blake Kim" → "J" (single initial at md — not "JK")
        </div>
        <NavBar
          userName="Jordan Blake Kim"
          items={[{ label: 'Directory', href: '#', active: true }]}
        />
      </div>

      {/* 6. Broken src — should fall back to initials gracefully */}
      <div style={{ marginTop: 32 }}>
        <div style={{ padding: '0 32px 6px', fontSize: 12, color: 'var(--foreground-neutral-tertiary)' }}>
          6 · Broken src → graceful fallback to "S" initial, no broken img icon
        </div>
        <NavBar
          userName="Sam Rivera"
          avatar="https://broken.example/not-found.jpg"
          items={[{ label: 'Directory', href: '#' }]}
        />
      </div>

      <div style={{ height: 64 }} />
    </main>
  );
}
