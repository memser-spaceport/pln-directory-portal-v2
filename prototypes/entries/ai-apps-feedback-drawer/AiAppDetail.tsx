'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/common/Button';
import { DocumentIcon } from '@/components/icons';
// Reuse the Forum post's Back button styling (chevron + "Back") verbatim.
import bb from '@/components/ui/BackButton/BackButton.module.scss';
// Dev's own top-bar action class, so this bar's controls measure like the
// real detail page's.
import dev from '@/components/page/ai-apps/AiAppDetailPage/AiAppDetailPage.module.scss';

import { FloatingFeedbackButton } from './prod/FeedbackButton';
import type { SubmittedFeedback } from './prod/FeedbackDialog';
import { type AiAppWithDoc } from './mocks';
import { AppActionsMenu } from './AppActionsMenu';
import { CommentsPanel } from './threads/CommentsPanel';
import { ThreadsLayer } from './threads/ThreadsLayer';
import { captureFrame } from './threads/nativeCapture';
import { useThreads, type Thread, type Viewer } from './threads/useThreads';

import s from './AiAppDetail.module.scss';

interface Props {
  app: AiAppWithDoc;
  apps: AiAppWithDoc[];
  previewSrcDoc?: string;
  onBack: () => void;
  /** Creator-only: mounts the same ⋯ menu the grid card shows. */
  canManage: boolean;
  /** Who is looking: the creator, or a visitor (View as). */
  viewer: Viewer;
  onEdit: () => void;
  onDeployment: () => void;
  onLogs: () => void;
  onDelete: () => void;
  onViewOnePager: () => void;
  /** Called on every send, so the card's activity count moves and the Feedback page's Given tab gets it. */
  onSubmitFeedback: (feedback: SubmittedFeedback) => void;
}

export function AiAppDetail(props: Props) {
  const {
    app,
    apps,
    previewSrcDoc,
    onBack,
    canManage,
    viewer,
    onEdit,
    onDeployment,
    onLogs,
    onDelete,
    onViewOnePager,
    onSubmitFeedback,
  } = props;

  const hasOnePager = !!app.onePager;

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [frameGeneration, setFrameGeneration] = useState(0);
  const store = useThreads(app.uid, viewer);
  // Comments are public, as production made them (its CommentCard: "Everyone
  // who can open this app can see it"). Feedback stays private.
  const visible = store.threads;

  // Comment mode: on, the app takes comments instead of clicks; it is the feedback drawer's Comments tab.
  const [commenting, setCommenting] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [focusTick, setFocusTick] = useState(0);
  // Switching viewer puts the page back to rest.
  useEffect(() => {
    setCommenting(false);
    setOpenId(null);
  }, [viewer.uid]);

  const capture = useCallback(() => captureFrame(iframeRef.current), []);

  const isOnPage = useCallback(
    (t: Thread) => !!iframeRef.current?.contentDocument?.querySelector(t.anchor),
    // frameGeneration: re-ask once the app's document has (re)loaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [frameGeneration],
  );

  const exitComments = useCallback(() => {
    setCommenting(false);
    setOpenId(null);
  }, []);

  // Esc in comment mode with no composer or thread open: the whole drawer closes, as Esc does on the form.
  const [closeRequest, setCloseRequest] = useState(0);
  const closeDrawer = useCallback(() => {
    exitComments();
    setCloseRequest((n) => n + 1);
  }, [exitComments]);

  return (
    <div className={s.page}>
      <header className={s.topBar}>
        <button type="button" className={bb.backBtn} onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11 14L5 8L11 2" stroke="#5E718D" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>

        <div className={s.topBarActions}>
          {hasOnePager && (
            <Button
              style="border"
              variant="neutral"
              size="xxs"
              className={dev.topBarBtn}
              onClick={onViewOnePager}
              aria-label={`App details for ${app.name}`}
            >
              <DocumentIcon aria-hidden />
              App Details
            </Button>
          )}
          {canManage && (
            <AppActionsMenu
              appName={app.name}
              onEdit={onEdit}
              onDeployment={onDeployment}
              onLogs={onLogs}
              onDelete={onDelete}
            />
          )}
        </div>
      </header>

      <div className={s.root}>
        <div className={s.previewStage}>
          <div className={s.previewWrap}>
            <iframe
              ref={iframeRef}
              className={s.iframe}
              srcDoc={previewSrcDoc}
              title={app.name}
              allow="fullscreen"
              onLoad={() => setFrameGeneration((g) => g + 1)}
            />
          </div>
          <ThreadsLayer
            iframeRef={iframeRef}
            frameGeneration={frameGeneration}
            commenting={commenting}
            onExit={closeDrawer}
            openId={openId}
            onOpen={setOpenId}
            hoverId={hoverId}
            focusTick={focusTick}
            viewer={viewer}
            canManage={canManage}
            store={store}
            threads={visible}
          />
        </div>
      </div>

      {/* Production's floating door, opening the feedback drawer. Its Comments tab is
          comment mode, with this list of threads in it. */}
      <FloatingFeedbackButton
        apps={apps}
        appUid={app.uid}
        appName={app.name}
        viewer={viewer}
        iframeRef={iframeRef}
        capture={capture}
        onSubmit={onSubmitFeedback}
        commentMode={{
          available: true,
          active: commenting,
          count: visible.length,
          onOpen: () => setCommenting(true),
          onClose: exitComments,
          closeRequest,
          body: (
            <CommentsPanel
              embedded
              threads={visible}
              canManage={canManage}
              openId={openId}
              isOnPage={isOnPage}
              onSelect={(id) => {
                setOpenId((cur) => (cur === id ? null : id));
                setFocusTick((n) => n + 1);
              }}
              onHover={setHoverId}
              onClose={closeDrawer}
            />
          ),
        }}
      />
    </div>
  );
}
