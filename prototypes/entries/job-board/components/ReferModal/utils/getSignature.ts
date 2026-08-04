import { Referrer } from '../types';

/** The note's sign-off: "— Ana Ruiz, Staff Engineer at Filecoin Foundation", degrading
 *  through "— Ana Ruiz, Filecoin Foundation" and "— Ana Ruiz" as the directory runs out
 *  of facts about the referrer. Signed out, there's nothing to sign with — the note
 *  ends on its last sentence instead of on a stray dash. */
export function getSignature(referrer: Referrer | null): string {
  if (!referrer?.name) return '';

  const where = [referrer.title, referrer.team].filter(Boolean).join(' at ');

  return where ? `— ${referrer.name}, ${where}` : `— ${referrer.name}`;
}
