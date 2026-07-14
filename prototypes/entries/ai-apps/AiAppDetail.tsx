'use client';

import { useState } from 'react';

import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { Button } from '@/components/common/Button/Button';
import { formatFileSize } from '@/utils/file.utils';

import type { AiAppWithDoc } from './mocks';
import { OnePagerViewer } from './OnePagerViewer';

import s from './AiAppDetail.module.scss';

interface Props {
  app: AiAppWithDoc;
  previewSrcDoc?: string;
  onBack: () => void;
}

export function AiAppDetail(props: Props) {
  const { app, previewSrcDoc, onBack } = props;
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const onePager = app.onePager;

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

      <section className={s.onePagerCard} aria-label="1-pager">
        <div className={s.onePagerHead}>
          <h2 className={s.onePagerTitle}>1-pager</h2>
          <span className={s.onePagerHint}>A PRD or overview visible to everyone with access to this app.</span>
        </div>

        {onePager ? (
          <div className={s.onePagerRow}>
            <div className={s.thumb}>
              {onePager.previewDataUrl ? (
                <img className={s.thumbImg} src={onePager.previewDataUrl} alt="" />
              ) : (
                <span className={s.thumbFallback}>PDF</span>
              )}
            </div>
            <div className={s.fileMeta}>
              <p className={s.fileName}>{onePager.fileName}</p>
              <p className={s.fileSize}>PDF - {formatFileSize(onePager.fileSize)}</p>
            </div>
            <Button
              className={s.fileAction}
              style="fill"
              variant="primary"
              size="s"
              onClick={() => setIsViewerOpen(true)}
            >
              View 1-pager
            </Button>
          </div>
        ) : (
          <p className={s.emptyMuted}>No 1-pager yet.</p>
        )}
      </section>

      <div className={s.previewWrap}>
        <iframe className={s.iframe} srcDoc={previewSrcDoc} title={app.name} allow="fullscreen" />
      </div>

      {onePager && (
        <OnePagerViewer isOpen={isViewerOpen} onePager={onePager} onClose={() => setIsViewerOpen(false)} />
      )}
    </div>
  );
}
