'use client';

import type { GantryItem } from '@/services/gantry/types';
import { GantryItemAuthor } from '../shared/GantryItemAuthor';
import { StageBadge } from '../shared/StageBadge';
import { UpvoteButton } from '../shared/UpvoteButton';
import { useGantryCardNavigate } from '../shared/useGantryCardNavigate';
import s from './Ideas.module.scss';

interface Props {
  readonly item: GantryItem;
  readonly canUpvote: boolean;
  readonly onUpvoteToggle: (uid: string, nextHasUpvoted: boolean) => void;
}

export function IdeaListItem({ item, canUpvote, onUpvoteToggle }: Props) {
  const cardNavigate = useGantryCardNavigate(item.uid);

  return (
    <article className={s.item} {...cardNavigate}>
      <div className={s.itemHead}>
        <h3 className={s.itemTitle}>{item.title}</h3>
        <UpvoteButton
          count={item.upvoteCount}
          hasUpvoted={item.viewerHasUpvoted}
          disabled={!canUpvote}
          onToggle={(next) => onUpvoteToggle(item.uid, next)}
        />
      </div>
      <div className={s.meta}>
        <StageBadge stage={item.stage} />
        <span>{item.focusArea?.title ?? 'No focus area'}</span>
        <GantryItemAuthor author={item.createdBy} backTo={`/gantry/${item.uid}`} />
      </div>
    </article>
  );
}
