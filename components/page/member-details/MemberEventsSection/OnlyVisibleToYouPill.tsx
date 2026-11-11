import s from './OwnerControls.module.scss';

/**
 * "Only visible to you", on an event the owner hid from their profile (LAB-3218). The prototype's lock pill
 * (`prototypes/entries/profile-shared/PlTeamOnlyPill.tsx`), ported: the words carry the audience, the lock only
 * decorates them.
 */
export function OnlyVisibleToYouPill() {
  return (
    <span className={s.pill}>
      <LockIcon />
      Only visible to you
    </span>
  );
}

/* `@/components/icons` has no lock; the prototype's, with `currentColor` so the pill's tint drives it. */
const LockIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path
      d="M12 6.667h-.667V5.333a3.333 3.333 0 0 0-6.666 0v1.334H4c-.736 0-1.333.597-1.333 1.333v5.333c0 .736.597 1.334 1.333 1.334h8c.736 0 1.333-.598 1.333-1.334V8c0-.736-.597-1.333-1.333-1.333Zm-6-1.334a2 2 0 0 1 4 0v1.334H6V5.333Zm2.667 6.334v1a.667.667 0 0 1-1.334 0v-1a1 1 0 1 1 1.334 0Z"
      fill="currentColor"
    />
  </svg>
);
