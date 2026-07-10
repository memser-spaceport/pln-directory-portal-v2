// Reuse the production newsfeed "N new" pill 1:1, packaged as a component so it
// can be dropped into any host (button, tab, header) with consistent centering.
import teamNews from '@/components/page/home/TeamNews/TeamNews.module.scss';
import s from './feedback.module.scss';

interface Props {
  /** When provided, renders "{count} new"; otherwise just "new". */
  count?: number;
}

export function NewBadge({ count }: Props) {
  return (
    <span className={`${teamNews.unreadBadge} ${s.newBadge}`}>{count != null ? `${count} new` : 'new'}</span>
  );
}
