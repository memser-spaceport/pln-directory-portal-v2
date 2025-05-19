'use client';

import { useState, useEffect } from 'react';
import clip from 'text-clipper';
import DOMPurify from 'dompurify';
import styles from './list.module.css';

export default function ExperienceDescription({ description = '' }: { description: string }) {
  const [sanitized, setSanitized] = useState('');
  const [isClipped, setIsClipped] = useState(false);

  useEffect(() => {
    if (description && typeof window !== 'undefined') {
      const clean = DOMPurify.sanitize(description,{
        ALLOWED_ATTR: ['href', 'target', 'rel'],
        ADD_ATTR: ['target', 'rel'],
        ADD_TAGS: ['a'], // only if you're limiting tags
      });
      const clipped = clip(clean, 255, { html: true, maxLines: 2 });

      setSanitized(clipped);
      setIsClipped(clean.length > clipped.length);
    }
  }, [description]);

  const handleToggle = () => {
    setIsClipped(!isClipped);
  };

  return (
    <div className={styles.memberDetail__experience__item__detail__description}>
      {sanitized && (
        <p
          dangerouslySetInnerHTML={{ __html: isClipped ? sanitized : DOMPurify.sanitize(description,{
            ALLOWED_ATTR: ['href', 'target', 'rel'],
            ADD_ATTR: ['target', 'rel'],
            ADD_TAGS: ['a']
          }) }}
          className={styles.memberDetail__experience__item__detail__description__text}
        />
      )}

      {isClipped && (
        <span
          onClick={handleToggle}
          className={styles.memberDetail__experience__item__detail__description__text__more}
        >
          Show more
        </span>
      )}
    </div>
  );
}
