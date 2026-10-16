import type { SuggestionLabel } from '@/schema/suggested-candidates';

import s from './SuggestionBadge.module.scss';

/**
 * The match band as a gradient pill (LAB-2853): a green → blue → indigo
 * sweep with white text, the same as the badge in the suggested-candidates
 * email, so a lead who comes from the email sees the same mark on the page.
 *
 * Only Strong match is marked (LAB-2837 feedback). Every suggested person is
 * already a match, so a "Good match" pill on most rows said nothing; the mark
 * is worth its space only where it singles someone out. Good renders nothing.
 *
 * A span, not the DS `Badge`. This overrides the fill, the border and the text
 * colour, so a `Badge` underneath would only add styles to beat. One component
 * so the row and the pane never disagree.
 */
export function SuggestionBadge({ label }: { label: SuggestionLabel }) {
  if (label !== 'Strong match') return null;
  return <span className={s.root}>{label}</span>;
}
