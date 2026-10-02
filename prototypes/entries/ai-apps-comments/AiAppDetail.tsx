'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/common/Button';
import { DocumentIcon } from '@/components/icons';
// Reuse the Forum post's Back button styling (chevron + "Back") verbatim.
import bb from '@/components/ui/BackButton/BackButton.module.scss';
// Dev's own top-bar action class, so this bar's controls measure like the
// real detail page's.
import dev from '@/components/page/ai-apps/AiAppDetailPage/AiAppDetailPage.module.scss';

import { FeedbackFab } from './FeedbackFab';
import { type AiAppWithDoc } from './mocks';
import { AppActionsMenu } from './AppActionsMenu';
import { COMMENTS_DRAWER_WIDTH, CommentsDrawer } from './threads/CommentsDrawer';
import { CommentsPanel } from './threads/CommentsPanel';
import { ThreadsLayer } from './threads/ThreadsLayer';
import { useThreads, type Thread, type Viewer } from './threads/useThreads';

import s from './AiAppDetail.module.scss';

export type FeedbackMode = 'production' | 'proposal';

interface Props {
  app: AiAppWithDoc;
  apps: AiAppWithDoc[];
  previewSrcDoc?: string;
  onBack: () => void;
  /** Creator-only: mounts the same ⋯ menu the grid card shows. */
  canManage: boolean;
  /** Who is looking: the creator, or a visitor (View as). */
  viewer: Viewer;
  /**
   * Production: feedback as it ships today. Proposal: two doors — Comments (a
   * mode: click anywhere on the app) and Give feedback
   * (production's screenshot popover, private to the author and admins).
   */
  mode: FeedbackMode;
  onEdit: () => void;
  onDeployment: () => void;
  onLogs: () => void;
  onDelete: () => void;
  onViewOnePager: () => void;
  /** Comment mode on/off, so the shell can make room for the drawer. */
  onCommentingChange?: (on: boolean) => void;
  /** Called on every send, so the card's activity count moves. */
  onSubmitFeedback: (appUid: string) => void;
}

export function AiAppDetail(props: Props) {
  const {
    app,
    apps,
    previewSrcDoc,
    onBack,
    canManage,
    viewer,
    mode,
    onEdit,
    onDeployment,
    onLogs,
    onDelete,
    onViewOnePager,
    onSubmitFeedback,
    onCommentingChange,
  } = props;

  const hasOnePager = !!app.onePager;
  const isProposal = mode === 'proposal';

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [frameGeneration, setFrameGeneration] = useState(0);
  const store = useThreads(app.uid, viewer);
  // Comments are private, like feedback: the app's author (and LabOS admins)
  // read every thread; anyone else reads their own, with the replies to them.
  const visible = canManage ? store.threads : store.threads.filter((t) => t.authorUid === viewer.uid);

  // Comment mode: on, the app takes comments instead of clicks, and the panel is open.
  const [commenting, setCommenting] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [focusTick, setFocusTick] = useState(0);

  // Leaving the proposal (or switching viewer) puts the page back to plain production.
  useEffect(() => {
    setCommenting(false);
    setOpenId(null);
  }, [mode, viewer.uid]);

  useEffect(() => {
    onCommentingChange?.(commenting);
  }, [commenting, onCommentingChange]);

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
          {isProposal && (
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
          )}
        </div>
      </div>

      {/* The list, in a drawer on the right, for as long as comment mode is on. */}
      <CommentsDrawer isOpen={isProposal && commenting}>
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

      {/* The one floating door. Production: the feedback popover. Proposal: it
          also holds comment mode — hover for the menu, click for the form. */}
      <FeedbackFab
        apps={apps}
        appUid={app.uid}
        appName={app.name}
        viewerName={viewer.name}
        rightOffset={isProposal && commenting ? COMMENTS_DRAWER_WIDTH : 0}
        comments={
          isProposal
            ? {
                active: commenting,
                onStart: () => setCommenting(true),
                onStop: exitComments,
                count: visible.length,
              }
            : undefined
        }
        onSubmit={(feedback) => onSubmitFeedback(feedback.appUid)}
      />
    </div>
  );
}
