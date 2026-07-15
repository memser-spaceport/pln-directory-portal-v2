'use client';

import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';

import type { AiAppWithDoc } from './mocks';

import s from './AiAppDetail.module.scss';

interface Props {
  app: AiAppWithDoc;
  previewSrcDoc?: string;
  onBack: () => void;
}

export function AiAppDetail(props: Props) {
  const { app, previewSrcDoc, onBack } = props;

  return (
    <div className={s.root}>
      <div className={s.topBar}>
        <button type="button" className={s.back} onClick={onBack}>
          Back to all apps
        </button>
      </div>

      <div className={s.header}>
        <div className={s.titleBlock}>
          <h1 className={s.title}>{app.name}</h1>
          <p className={s.description}>{app.description}</p>
          <div className={s.author}>
            <img className={s.avatar} src={getDefaultAvatar(app.member.name)} alt="" width={20} height={20} />
            <span className={s.authorText}>
              by <span className={s.authorName}>{app.member.name}</span>
            </span>
          </div>
        </div>
      </div>

      <div className={s.previewWrap}>
        <iframe className={s.iframe} srcDoc={previewSrcDoc} title={app.name} allow="fullscreen" />
      </div>
    </div>
  );
}
