'use client';

import { useRef, useState } from 'react';

import { Button } from '@/components/common/Button';
import { DocumentIcon } from '@/components/icons';
// Reuse the Forum post's Back button styling (chevron + "Back") verbatim.
import bb from '@/components/ui/BackButton/BackButton.module.scss';
// Dev's own top-bar action class, so this bar's controls measure like the
// real detail page's.
import dev from '@/components/page/ai-apps/AiAppDetailPage/AiAppDetailPage.module.scss';

import { FeedbackFab } from './FeedbackFab';
import { currentUser, type AiAppWithDoc } from './mocks';
import { AppActionsMenu } from './AppActionsMenu';
import { CommentLayer } from '../feedback-shared/comments/CommentLayer';
import { useAppComments } from '../feedback-shared/comments/useAppComments';

import s from './AiAppDetail.module.scss';

interface Props {
  app: AiAppWithDoc;
  previewSrcDoc?: string;
  onBack: () => void;
  /** Creator-only: mounts the same ⋯ menu the grid card shows. */
  canManage: boolean;
  onEdit: () => void;
  onDeployment: () => void;
  onLogs: () => void;
  onDelete: () => void;
  /** Opens the 1-pager viewer — same action as the card's "App Details" button. */
  onViewOnePager: () => void;
  /** Called when a pinned comment is posted, so the card's activity count moves. */
  onSubmitFeedback: (appUid: string, appName: string, text: string) => void;
}

export function AiAppDetail(props: Props) {
  const { app, previewSrcDoc, onBack, canManage, onEdit, onDeployment, onLogs, onDelete, onViewOnePager, onSubmitFeedback } =
    props;

  const hasOnePager = !!app.onePager;

  // Comment mode (see comments/CommentLayer). The fab toggles it; the layer
  // needs the frame's element and to know when its document has loaded.
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [frameGeneration, setFrameGeneration] = useState(0);
  const [commenting, setCommenting] = useState(false);
  const store = useAppComments(app.uid, currentUser);
  const visibleCount = canManage
    ? store.comments.length
    : store.comments.filter((c) => c.authorUid === currentUser.uid).length;

  return (
    <div className={s.page}>
      {/* Full-width header bar pinned to the top of the app page. */}
      <header className={s.topBar}>
        <button type="button" className={bb.backBtn} onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M11 14L5 8L11 2"
              stroke="#5E718D"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

          </svg>
          Back
        </button>

        {/* Utility actions only: the 1-pager, then the creator's ⋯ manage menu.
            Giving feedback left this strip for the floating pill in the corner
            — you write it while using the app, not from a bar you scroll past —
            and one surface keeps one door, so it isn't in both places. */}
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

      {/* App identity (name / description / author) intentionally omitted here —
          the embedded preview carries its own title bar, so repeating it above
          only duplicates. */}
      <div className={s.root}>
        {/* The stage is what comment mode draws on: the frame keeps its clipped,
            bordered box and the pins and their popovers hang off the stage, so
            a thread can reach past the frame's edge. */}
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
          <CommentLayer
            iframeRef={iframeRef}
            frameGeneration={frameGeneration}
            active={commenting}
            onExit={() => setCommenting(false)}
            viewer={currentUser}
            canManage={canManage}
            store={store}
            audienceNote="Visible to the app's author and LabOS admins"
            subject={app.name}
            onPosted={() => onSubmitFeedback(app.uid, app.name, '')}
          />
        </div>
      </div>

      {/* Pinned bottom-right, over the app: it says its name on arrival and
          then settles to a glyph, because what it covers is the app. A press
          switches comment mode on; the pin then says which app, so nobody has
          to pick one. */}
      <FeedbackFab active={commenting} onToggle={() => setCommenting((v) => !v)} count={visibleCount} />
    </div>
  );
}
