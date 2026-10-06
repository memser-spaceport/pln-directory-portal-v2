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
import { COMMENTS_DRAWER_WIDTH, CommentsDrawer } from './threads/CommentsDrawer';
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
  /** Comment mode on/off, so the shell can make room for the drawer. */
  onCommentingChange?: (on: boolean) => void;
  /** Called on every send, so the card's activity count moves. */
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
    onCommentingChange,
  } = props;

  const hasOnePager = !!app.onePager;

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [frameGeneration, setFrameGeneration] = useState(0);
  const store = useThreads(app.uid, viewer);
  // Comments are public, as production made them (its CommentCard: "Everyone
  // who can open this app can see it"). Feedback stays private.
  const visible = store.threads;

  // Comment mode: on, the app takes comments instead of clicks, and the panel is open.
  const [commenting, setCommenting] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [focusTick, setFocusTick] = useState(0);
  // The comment card's Feedback tab: bumped here, the button opens its dialog.
  // Switching viewer puts the page back to rest.
  useEffect(() => {
    setCommenting(false);
    setOpenId(null);
  }, [viewer.uid]);

  useEffect(() => {
    onCommentingChange?.(commenting);
  }, [commenting, onCommentingChange]);

  // Production's button and comment card sit beside the comments panel through this variable.
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--ai-app-comments-inset', commenting ? `${COMMENTS_DRAWER_WIDTH}px` : '0px');
    return () => {
      root.style.removeProperty('--ai-app-comments-inset');
    };
  }, [commenting]);

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
            onExit={exitComments}
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

      {/* The list, in a drawer on the right, for as long as comment mode is on. */}
      <CommentsDrawer isOpen={commenting}>
        <CommentsPanel
          threads={visible}
          canManage={canManage}
          openId={openId}
          isOnPage={isOnPage}
          onSelect={(id) => {
            setOpenId((cur) => (cur === id ? null : id));
            setFocusTick((n) => n + 1);
          }}
          onHover={setHoverId}
          onClose={exitComments}
        />
      </CommentsDrawer>

      {/* Production's floating door with comments switched on. It draws comment
          mode's card too ("Commenting", Back to feedback). */}
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
          feedbackRequest: 0,
        }}
      />
    </div>
  );
}
