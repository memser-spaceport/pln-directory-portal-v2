import React from 'react';
import { Markdown } from '@/components/common/Markdown';
import s from './ArticleBody.module.scss';

interface Props {
  content: string;
}

export function ArticleBody({ content }: Props) {
  return (
    <div className={s.root}>
      <Markdown className={s.markdown}>{content}</Markdown>
    </div>
  );
}
