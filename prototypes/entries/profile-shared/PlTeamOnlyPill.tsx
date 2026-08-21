'use client';

import s from './PlTeamOnlyPill.module.scss';

/**
 * The "VISIBLE TO YOU AND LABOS ADMINS" pill — the prototypes' established mark
 * for a field the member can see and edit but nobody else in the network can.
 *
 * **It used to read "Visible to PL Team only".** Two things were wrong with it.
 * It named only the exclusion, leaving the member out of a sentence about their
 * own data — the first question anyone asks of a lock is "can *I* see it?", and
 * "PL Team only" answers no. And "PL Team" is not what this product calls its
 * administrators anywhere a member reads: the app is LabOS, so the people with
 * the keys are LabOS admins. Naming the member first and the admins second is
 * the whole promise in the order it matters. (The file keeps its old name —
 * every importer already knows it, and the label is the part anyone reads.)
 *
 * SHARED (prototypes/entries/profile-shared/, no registry entry — like
 * nav-shared/ and news-shared/). It started life inside the member-profile
 * entry, on the internal Relationship card; the job-board profile drawer needed
 * the same mark for its private "Job search status" section, so it moved here
 * rather than being copied. Two copies of a privacy marker is exactly the drift
 * worth avoiding: the day one of them changes shape, the product is telling
 * people two different things about the same promise.
 *
 * **Why a pill and not a banner.** It qualifies the section it sits in — it is
 * a fact about the data, not something you can act on — so it belongs beside the
 * section title, at label weight, the way every other qualifying chip in this
 * product does. A full-width banner would announce the privacy more loudly than
 * the setting it protects.
 *
 * **Why a lock is right here specifically.** Every lock in *production* means
 * "you don't have access" (the logged-out contact strip, the gated forum
 * digest), which is the opposite of what this says. It works here because the
 * pill carries the audience in words: the lock is decoration on the label,
 * not the message itself. Never use the lock alone.
 */
export function PlTeamOnlyPill({ className }: { className?: string }) {
  return (
    <span className={className ? `${s.pill} ${className}` : s.pill}>
      <LockIcon />
      Visible to you and LabOS admins
    </span>
  );
}

/* No lock exists in `@/components/icons` — every LockIcon in the repo is a
   locally re-declared inline SVG (gantry ×3, forum, the IRL planning section).
   `currentColor` so the pill's own tint drives it. */
const LockIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path
      d="M12 6.667h-.667V5.333a3.333 3.333 0 0 0-6.666 0v1.334H4c-.736 0-1.333.597-1.333 1.333v5.333c0 .736.597 1.334 1.333 1.334h8c.736 0 1.333-.598 1.333-1.334V8c0-.736-.597-1.333-1.333-1.333Zm-6-1.334a2 2 0 0 1 4 0v1.334H6V5.333Zm2.667 6.334v1a.667.667 0 0 1-1.334 0v-1a1 1 0 1 1 1.334 0Z"
      fill="currentColor"
    />
  </svg>
);
