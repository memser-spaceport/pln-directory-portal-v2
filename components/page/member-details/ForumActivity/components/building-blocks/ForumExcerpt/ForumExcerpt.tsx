import { ReactNode } from 'react';

import { stripHtml, truncateText } from '@/utils/forum';

import s from './ForumExcerpt.module.scss';

interface Props {
  content: string;
  maxLength?: number;
  readMoreLabel?: ReactNode;
  onReadMoreClick?: () => void;
}

export function ForumExcerpt(props: Props) {
  const { content, maxLength = 150, readMoreLabel = 'Read More', onReadMoreClick } = props;

  const cleanText = stripHtml(content);
  const excerpt = truncateText(cleanText, maxLength);

  if (!excerpt) {
    return null;
  }

  return (
    <p className={s.root}>
      {excerpt}

      <span className={s.readMore} onClick={onReadMoreClick}>
        {' '}
        {readMoreLabel}
      </span>
    </p>
  );
}
