'use client';
import Link from 'next/link';

import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { AiApp } from '@/services/ai-apps/ai-apps.service';

import s from './AiAppCard.module.scss';

interface Props {
  app: AiApp;
  onSelect?: () => void;
}

export function AiAppCard(props: Props) {
  const { app, onSelect } = props;

  const content = (
    <>
      <div className={s.top}>
        <h3 className={s.name}>{app.name}</h3>
        <p className={s.description}>{app.description}</p>
      </div>
      <div className={s.meta}>
        <div className={s.creator}>
          <img className={s.avatar} src={getDefaultAvatar(app.member.name)} alt="" width={20} height={20} />
          <span className={s.creatorTitle}>by</span>
          <Link
            href={`/members/${app.member.uid}`}
            className={s.creatorLink}
            onClick={(e) => e.stopPropagation()}
          >
            {app.member.name}
          </Link>
        </div>
        <p className={s.deployed}>Deployed {new Date(app.createdAt).toLocaleDateString()}</p>
      </div>
    </>
  );

  if (onSelect) {
    return (
      <button type="button" className={s.root} onClick={onSelect}>
        {content}
      </button>
    );
  }

  return (
    <Link href={`/pl-infra/ai-apps/${app.uid}`} className={s.root}>
      {content}
    </Link>
  );
}
