'use client';

import s from './PlTeamOnlyPill.module.scss';

/**
 * The lock pill — the prototypes' mark for data that is not visible to the
 * network. One shape, one lock, and an audience that the caller names.
 *
 * **The audience is not the same in both places, and that is the whole point.**
 * The default sentence is for a member's own private field — the job board's
 * "Job search status", which they set, they can see, and nobody on the network
 * reads. It answers the first question anyone asks of a lock ("can *I* see
 * it?") in its first two words, and it names no second audience, because naming
 * one is what made the old sentence ("Visible to you and LabOS admins") read as
 * a disclosure notice rather than a privacy promise. The pill's job here is to
 * make a private field feel safe to answer honestly; every extra reader in the
 * sentence works against that.
 *
 * The member profile's Relationship card is a different fact. That card is
 * Affinity CRM context — PL's own notes *about* the member, gated on
 * `hasAffinityAccess`, which the member does not have. "Only visible to you" is
 * not merely vaguer there, it is wrong twice over: "you" is a PL staffer, and
 * the member — the person the card is *about* — never sees it at all. So that
 * surface passes
 * `label="PL team only"`, which is what it actually means.
 *
 * Hence a prop rather than two components. The mark, the lock and the geometry
 * stay shared; only the sentence differs, and it differs because the promise
 * does. (The file keeps its old name — every importer already knows it.)
 *
 * SHARED (prototypes/entries/profile-shared/, no registry entry — like
 * nav-shared/ and news-shared/). It started life inside the member-profile
 * entry, on the internal Relationship card; the job-board profile drawer needed
 * the same mark, so it moved here rather than being copied.
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
export function PlTeamOnlyPill({
  className,
  label = 'Only visible to you',
}: {
  className?: string;
  /** Who can see it. Override only when the audience genuinely differs — the
   *  sentence is the one thing this component exists to keep honest. */
  label?: string;
}) {
  return (
    <span className={className ? `${s.pill} ${className}` : s.pill}>
      <LockIcon />
      {label}
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
