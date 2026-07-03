import Link from 'next/link';
import type { PrototypeEntry } from '@/prototypes/types';
import s from './PrototypesIndex.module.scss';

type Props = {
  entry: PrototypeEntry;
};

export function PrototypeCard({ entry }: Props) {
  const isDraft = entry.category === 'Ideation';
  return (
    <Link href={`/prototypes/${entry.key}`} className={`${s.card} ${isDraft ? s.cardDraft : ''}`}>
      <span className={s.cardCategory}>
        {entry.category}
        {isDraft && <span className={s.draftBadge}>Draft</span>}
      </span>
      <h3 className={s.cardTitle}>{entry.title}</h3>
      <p className={s.cardDescription}>{entry.description}</p>
    </Link>
  );
}
