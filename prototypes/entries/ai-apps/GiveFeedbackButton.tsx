'use client';

import { useState } from 'react';

import { Button } from '@/components/common/Button';
import { CommentIcon } from '@/components/icons';
// Production stylesheet: `.button` is just the icon/label row.
import fb from '@/components/page/ai-apps/components/FloatingFeedbackButton/FloatingFeedbackButton.module.scss';

import { GiveFeedbackDialog } from './GiveFeedbackDialog';
import type { AiAppWithDoc } from './mocks';

interface Props {
  apps: AiAppWithDoc[];
  onSubmit: (appUid: string, appName: string, text: string) => void;
}

/**
 * COPY-SIMPLIFY of production `FloatingFeedbackButton` for the **all-apps
 * grid**, where it sits in the masthead's action row.
 *
 * The grid is a page you scan, and it has a masthead with a row of page
 * actions to join — so a control pinned to the viewport corner here would be
 * the only thing on the page that isn't part of the page. The detail view has
 * neither (it is an app you use, under a utility bar), so there the door floats
 * and settles into a glyph: see `FeedbackFab`. One door per surface either way;
 * both mount the same `GiveFeedbackDialog`.
 *
 * `s` rather than the detail bar's `xxs`: a 24px control beside a 28px title
 * reads as an afterthought.
 *
 * The rbac gate (`canViewAiApps`) and analytics are dropped; anyone who can see
 * the prototype can open the dialog.
 */
export function GiveFeedbackButton({ apps, onSubmit }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button size="s" style="border" variant="neutral" className={fb.button} onClick={() => setIsOpen(true)}>
        <CommentIcon />
        Give feedback
      </Button>
      <GiveFeedbackDialog isOpen={isOpen} onClose={() => setIsOpen(false)} apps={apps} onSubmit={onSubmit} />
    </>
  );
}
