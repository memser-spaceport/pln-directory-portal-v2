import { RecipientOption } from '../types';

/** "Ana Ruiz", "Ana Ruiz and jobs@ff.org", "Ana Ruiz, Wei Chen, jobs@ff.org and 2 others".
 *  Names are cheaper to read than a count, so it only collapses past three. */
export function getRecipientSummary(recipients: RecipientOption[]): string {
  /* The team row's label is a noun phrase, not a name — "Filecoin hiring team"
     needs its article to sit in the receipt's sentence ("on its way to the
     Filecoin hiring team"), and the chip is the one place it must not have one. */
  const labels = recipients.map((r) => (r.isTeam ? `the ${r.label}` : r.label));
  if (labels.length === 0) return '';
  if (labels.length === 1) return labels[0];
  if (labels.length <= 3) return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;

  // Real teams put four names in this line routinely, where the mocked two never did —
  // so the tail has to read as English at one as well as at nine.
  const rest = labels.length - 3;
  return `${labels.slice(0, 3).join(', ')} and ${rest} ${rest === 1 ? 'other' : 'others'}`;
}
