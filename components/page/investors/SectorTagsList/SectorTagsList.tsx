import type { SectorTag } from '@/services/investors/types';
import s from './SectorTagsList.module.scss';

interface Props {
  tags: SectorTag[];
  max?: number;
}

export function SectorTagsList({ tags, max = 3 }: Props) {
  if (!tags || tags.length === 0) return <span className={s.empty}>—</span>;
  const visible = tags.slice(0, max);
  const overflow = tags.length - visible.length;
  return (
    <span className={s.row}>
      {visible.map((t) => (
        <span key={t} className={s.chip}>
          {t}
        </span>
      ))}
      {overflow > 0 && (
        <span className={s.overflow} title={tags.slice(max).join(', ')}>
          +{overflow}
        </span>
      )}
    </span>
  );
}
