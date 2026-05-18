// /preview/forum-post-card — visual verification after Phase 2.2 Avatar refactor
// Checks: 24px avatar in meta row, branded blue fallback, photo state, flex layout.

import { ForumPostCard } from '@components/ForumPostCard';

const PHOTO_URL = 'https://i.pravatar.cc/300?img=11';
const BAD_URL = 'https://not-a-real-domain.example/broken.jpg';

export default function ForumPostCardPreviewPage() {
  return (
    <main style={{ maxWidth: 640, margin: '40px auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h1 style={{ fontFamily: 'var(--font-family-primary)', fontSize: 24, fontWeight: 600, marginBottom: 8 }}>
        ForumPostCard — Avatar refactor verification
      </h1>
      <p style={{ fontFamily: 'var(--font-family-primary)', fontSize: 14, color: 'var(--foreground-neutral-secondary)', marginBottom: 16 }}>
        Avatar should be 24px (sm), brand-blue bg + white initials for fallback.
      </p>

      <ForumPostCard
        title="Photo state — avatar should show photo at 24px"
        excerpt="The author avatar is now rendered via the Avatar primitive at size=sm (24px). Photo should load from pravatar."
        authorAvatar={PHOTO_URL}
        authorName="Alex Chen"
        authorRole="Protocol Engineer"
        timeAgo="2h ago"
        viewCount={142}
        likeCount={18}
        commentCount={7}
      />

      <ForumPostCard
        title="Initials fallback — brand-blue bg, white text, 24px circle"
        excerpt="No src provided. Avatar should render initials 'AC' on brand-blue (#1b4dff) background with white text. Size 24px."
        authorName="Alex Chen"
        authorRole="Core Dev"
        timeAgo="1d ago"
        viewCount={89}
        likeCount={4}
      />

      <ForumPostCard
        title="Single-word name — single initial 'A'"
        excerpt="Author name has only one word. Avatar should render 'A' as the initial."
        authorName="Alibek"
        timeAgo="3d ago"
        commentCount={2}
      />

      <ForumPostCard
        title="Broken src — should fall back to initials gracefully"
        excerpt="The src URL points to a non-existent resource. Avatar should catch the error and show initials on brand-blue."
        authorAvatar={BAD_URL}
        authorName="Sam Rivera"
        timeAgo="5d ago"
        likeCount={11}
      />

      <ForumPostCard
        title="Long author name — meta row should not squash the avatar"
        excerpt="Verifies flex-shrink: 0 behaviour. The Avatar primitive has flex-shrink: 0 on its root. The authorText should truncate, not the avatar."
        authorName="Bartholomew Hendrickson-Fairweather"
        authorRole="Distinguished Research Fellow in Distributed Systems"
        timeAgo="1w ago"
        viewCount={3210}
        likeCount={99}
        commentCount={34}
        pinned
      />
    </main>
  );
}
