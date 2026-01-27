import { stripHtml, truncateText } from '@/utils/forum';

import s from './ForumExcerpt.module.scss';

interface Props {
  content: string;
  maxLength?: number;
  onReadMoreClick?: () => void;
}

export function ForumExcerpt(props: Props) {
  const { content, maxLength = 150, onReadMoreClick } = props;

  const cleanText = stripHtml(content);
  const excerpt = truncateText(cleanText, maxLength);
  const isTruncated = cleanText.length > maxLength;

  if (!excerpt) {
    return null;
  }

  return (
    <p className={s.root}>
      {excerpt}
      {isTruncated && (
        <span className={s.readMore} onClick={onReadMoreClick}>
          {' '}
          Read more
        </span>
      )}
    </p>
  );
}
