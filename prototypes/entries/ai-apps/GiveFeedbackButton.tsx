'use client';

import { useState } from 'react';
import clsx from 'clsx';

import { Button, type ButtonProps } from '@/components/common/Button';
import { CommentIcon } from '@/components/icons';
// Production stylesheet: `.button` is just the icon/label row. `.floating` and
// `.alignToContent` are deliberately unused — see the note below.
import fb from '@/components/page/ai-apps/components/FloatingFeedbackButton/FloatingFeedbackButton.module.scss';

import { GiveFeedbackDialog } from './GiveFeedbackDialog';
import type { AiAppWithDoc } from './mocks';

interface Props {
  apps: AiAppWithDoc[];
  /** Preselects this app in the dialog's picker (the detail page passes one). */
  appUid?: string;
  appName?: string;
  onSubmit: (appUid: string, appName: string, text: string) => void;
  /**
   * Geometry follows the host: `xxs` in the detail page's compact top bar (dev's
   * own value there), `s` in the all-apps page masthead, where a 24px control
   * beside a 28px title reads as an afterthought. Tone — bordered/neutral, the
   * comment glyph, the label — is identical on both, which is what makes them
   * the same control.
   */
  size?: ButtonProps['size'];
  className?: string;
}

/**
 * COPY-SIMPLIFY of production `FloatingFeedbackButton`, with the floating
 * placement dropped.
 *
 * Dev renders this two ways: pinned bottom-right on the all-apps grid, and
 * in-flow in the detail page's top bar. Once the all-apps page gets its own
 * button on top, the FAB is a second door into the same dialog on the same
 * screen — so this prototype has one door per surface, both at the top, and the
 * `floating` / `alignToContent` variants are gone rather than left switchable.
 *
 * The rbac gate (`canViewAiApps`) and analytics are dropped; anyone who can see
 * the prototype can open the dialog.
 */
export function GiveFeedbackButton({ apps, appUid, appName, onSubmit, size = 's', className }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        size={size}
        style="border"
        variant="neutral"
        className={clsx(fb.button, className)}
        onClick={() => setIsOpen(true)}
      >
        <CommentIcon />
        Give feedback
      </Button>
      <GiveFeedbackDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        apps={apps}
        appUid={appUid}
        appName={appName}
        onSubmit={onSubmit}
      />
    </>
  );
}
