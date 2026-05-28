'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import type { GantryMemberSummary } from '@/services/gantry/types';
import s from './GantryItemAuthor.module.scss';

interface Props {
  readonly author: GantryMemberSummary;
  readonly backTo?: string;
  readonly showByPrefix?: boolean;
}

export function GantryItemAuthor({ author, backTo, showByPrefix = true }: Props) {
  const href = backTo
    ? `/members/${author.uid}?backTo=${encodeURIComponent(backTo)}`
    : `/members/${author.uid}`;

  const avatarSrc = useMemo(
    () => author.imageUrl ?? getDefaultAvatar(author.name),
    [author.imageUrl, author.name],
  );

  return (
    <Link href={href} className={s.root} onClick={(e) => e.stopPropagation()}>
      <img src={avatarSrc} alt="" className={s.avatar} width={24} height={24} />
      <span className={s.name}>
        {showByPrefix ? 'By ' : ''}
        {author.name}
      </span>
    </Link>
  );
}
