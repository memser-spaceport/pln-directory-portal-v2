'use client';

import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';

import type { AiAppWithDoc } from './mocks';

import s from './AiAppCard.module.scss';

interface Props {
  readonly app: AiAppWithDoc;
  readonly canManage: boolean;
  readonly onSelect: () => void;
  readonly onManage: () => void;
}

export function AiAppCard({ app, canManage, onSelect, onManage }: Props) {
  const isDraft = app.status === 'DRAFT';
  const hasOnePager = !!app.onePager;

  return (
    <article className={s.root}>
      <button type="button" className={s.cardButton} onClick={onSelect}>
        <div className={s.body}>
          <div className={s.nameRow}>
            <h3 className={s.name}>{app.name}</h3>
            {isDraft && <span className={s.draftBadge}>Draft</span>}
            {hasOnePager && <span className={s.docBadge}>1-pager</span>}
          </div>
          <p className={s.description}>{app.description}</p>
        </div>

        <div className={s.footer}>
          <div className={s.author}>
            <img className={s.avatar} src={getDefaultAvatar(app.member.name)} alt="" width={20} height={20} />
            <div className={s.authorText}>
              <p className={s.authorLine}>
                <span className={s.creatorTitle}>by</span> <span className={s.creatorName}>{app.member.name}</span>
              </p>
              <p className={s.deployed}>
                {isDraft ? 'Draft created' : 'Deployed'} {new Date(app.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </button>

      {canManage && (
        <button type="button" className={s.moreButton} onClick={onManage} aria-label={`More actions for ${app.name}`}>
          <span />
          <span />
          <span />
        </button>
      )}
    </article>
  );
}
