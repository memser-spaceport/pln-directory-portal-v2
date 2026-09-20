'use client';

import { clsx } from 'clsx';

import { useAiAppTags } from '@/services/ai-apps/hooks/useAiAppTags';

import s from './AiAppTagChips.module.scss';

interface Props {
  tags: string[] | undefined;
  className?: string;
}

/** Read-only tag labels for an app; renders nothing for untagged apps. */
export function AiAppTagChips({ tags, className }: Props) {
  const { getLabel } = useAiAppTags();

  if (!tags?.length) return null;

  return (
    <ul className={clsx(s.root, className)} aria-label="Tags">
      {tags.map((tag) => (
        <li key={tag} className={s.chip}>
          {getLabel(tag)}
        </li>
      ))}
    </ul>
  );
}
