import { RecipientOption } from '../types';

/** "Ana Ruiz", "Ana Ruiz and jobs@ff.org", "Ana Ruiz, Wei Chen, jobs@ff.org and 2 others".
 *  Names are cheaper to read than a count, so it only collapses past three. */
export function getRecipientSummary(recipients: RecipientOption[]): string {
  const labels = recipients.map((r) => r.label);
  if (labels.length === 0) return '';
  if (labels.length === 1) return labels[0];
  if (labels.length <= 3) return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
  return `${labels.slice(0, 3).join(', ')} and ${labels.length - 3} others`;
}
