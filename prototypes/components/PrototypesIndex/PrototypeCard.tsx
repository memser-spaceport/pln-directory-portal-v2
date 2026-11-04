import Link from 'next/link';
import { Badge, type BadgeProps } from '@/components/common/Badge';
import type { PrototypeListItem, PrototypeStatus } from '@/prototypes/types';
import s from './PrototypesIndex.module.scss';

type Props = {
  entry: PrototypeListItem;
};

export const STATUS_LABELS: Record<PrototypeStatus, string> = {
  ideation: 'Ideation',
  progress: 'In progress',
  dev: 'On dev',
};

// Status carries the colour; the version badge stays the default grey so the two never read as one scale.
const STATUS_VARIANTS: Record<PrototypeStatus, BadgeProps['variant']> = {
  ideation: 'brand',
  progress: 'warning',
  dev: 'success',
};

export function PrototypeCard({ entry }: Props) {
  return (
    <Link href={`/prototypes/${entry.key}`} className={s.card}>
      <span className={s.cardCategory}>{entry.category}</span>
      <h3 className={s.cardTitle}>{entry.title}</h3>
      {(entry.status || entry.version) && (
        <div className={s.cardBadges}>
          {entry.status && <Badge variant={STATUS_VARIANTS[entry.status]}>{STATUS_LABELS[entry.status]}</Badge>}
          {entry.version && <Badge>V{entry.version}</Badge>}
        </div>
      )}
    </Link>
  );
}
