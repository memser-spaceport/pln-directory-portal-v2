import clsx from 'clsx';

import type { SuggestionLabel } from '@/schema/suggested-candidates';

import s from './SuggestionBadge.module.scss';

/**
 * The band's tone. Both bands are recommendations, so neither takes amber or
 * red; Strong is the brighter of the two.
 */
const SUGGESTION_BAND_TONE: Record<SuggestionLabel, 'strong' | 'good'> = {
  'Strong match': 'strong',
  'Good match': 'good',
};

/**
 * The match band as a gradient pill (LAB-2853): Strong is a green → blue →
 * indigo sweep, Good a quieter teal-green, with white text on both. It looks
 * the same as the badge in the suggested-candidates email, so a lead who comes
 * from the email sees the same mark on the page.
 *
 * A span, not the DS `Badge`. This overrides the fill, the border and the text
 * colour, so a `Badge` underneath would only add styles to beat. One component
 * so the row and the pane never disagree.
 */
export function SuggestionBadge({ label }: { label: SuggestionLabel }) {
  return <span className={clsx(s.root, s[SUGGESTION_BAND_TONE[label]])}>{label}</span>;
}
