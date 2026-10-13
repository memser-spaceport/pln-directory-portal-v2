import { Badge } from '@/components/common/Badge';
import type { SuggestionLabel } from '@/schema/suggested-candidates';

import s from './SuggestionBadge.module.scss';

/**
 * The band's DS `Badge` tone, as the design has it (LAB-2687): Strong in
 * success green, Good in brand blue. Both bands are recommendations, so neither
 * takes amber or red. One component so the row and the pane never disagree.
 */
const SUGGESTION_BAND_VARIANT: Record<SuggestionLabel, 'success' | 'brand'> = {
  'Strong match': 'success',
  'Good match': 'brand',
};

export function SuggestionBadge({ label }: { label: SuggestionLabel }) {
  return (
    <Badge variant={SUGGESTION_BAND_VARIANT[label]} className={s.root}>
      {label}
    </Badge>
  );
}
