import Link from 'next/link';
import s from './InLabOsBadge.module.scss';

/**
 * Clickable “In LabOS” tag linking to the Directory member profile.
 * Used in the investors table and Master Profile modal.
 */
export function InLabOsBadge({ memberUid }: { memberUid: string }) {
  const uid = memberUid.trim();
  if (!uid) return null;
  return (
    <Link
      href={`/members/${encodeURIComponent(uid)}`}
      target="_blank"
      rel="noopener noreferrer"
      className={s.badge}
      title="Open in LabOS"
      aria-label="Open member profile in LabOS"
      onClick={(e) => e.stopPropagation()}
    >
      In LabOS
    </Link>
  );
}
