'use client';

import { useMemo, useState } from 'react';
import clip from 'text-clipper';
import { SafeHtml } from '@/components/ui/SafeHtml';
import { sanitizeHtml } from '@/utils/html';
import styles from './list.module.css';

export default function ExperienceDescription({ description = '' }: { description: string }) {
  const [expanded, setExpanded] = useState(false);

  const { clean, clipped } = useMemo(() => {
    const clean = sanitizeHtml(description);
    return { clean, clipped: clip(clean, 255, { html: true, maxLines: 2 }) };
  }, [description]);

  const isClipped = !expanded && clean.length > clipped.length;

  return (
    <div className={styles.memberDetail__experience__item__detail__description}>
      {clean && (
        <SafeHtml
          as="p"
          html={isClipped ? clipped : clean}
          className={styles.memberDetail__experience__item__detail__description__text}
        />
      )}

      {isClipped && (
        <span
          onClick={() => setExpanded(true)}
          className={styles.memberDetail__experience__item__detail__description__text__more}
        >
          Show more
        </span>
      )}
    </div>
  );
}
