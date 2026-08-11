import { EyeIcon } from '@/components/icons';
import { formatNumber } from '@/utils/home.utils';

import newsCardStyles from '../NewsCard/NewsCard.module.scss';

interface ViewCountProps {
  count?: number;
  /** Exact (toLocaleString) instead of compact ("1.2k") — detail views only. */
  exact?: boolean;
}

// Read-only, unlike the interactive Like/Comment controls beside it — no
// button, no onClick. Always renders, including "0 Views": matches
// UpvoteButton's own always-show-the-count behavior so the row's shape
// doesn't shift as counts arrive.
export function ViewCount({ count, exact = false }: ViewCountProps) {
  const value = count ?? 0;
  const label = exact ? value.toLocaleString() : formatNumber(value);
  return (
    <span className={newsCardStyles.viewCount}>
      <EyeIcon width={16} height={13} />
      {label} Views
    </span>
  );
}
