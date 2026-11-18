'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import clsx from 'clsx';

import {
  useIntroRequestAnalytics,
  type IntroRequestEntryPoint,
  type IntroRequestEventContext,
} from '@/analytics/intro-requests.analytics';
import { Button } from '@/components/common/Button';
import { AskAgentButton } from '@/components/core/labos-agent/AskAgentButton/AskAgentButton';
import { useCanRequestIntro } from '@/services/intro-requests/hooks/useCanRequestIntro';
import type { IntroRequestTargetType } from '@/services/intro-requests/intro-requests.service';
import {
  claimIntroRequestShown,
  introRequestTargetKey,
  isIntroRequestSent,
  markIntroRequestSent,
  retainIntroRequestTarget,
  subscribeIntroRequestTargets,
} from '@/services/intro-requests/intro-request-entry-registry';

import { RequestIntroDialog } from './RequestIntroDialog';

/** The first message for the agent (contract 8.1). The member can change it before they send. */
export const introAgentPrefill = (targetName: string) => `Help me write an intro request to ${targetName}.`;

import s from './RequestIntroEntry.module.scss';

interface Props {
  type: IntroRequestTargetType;
  targetId: string;
  targetName: string;
  className?: string;
  /** Where the control sits. Defaults to the member or team page header. */
  entryPoint?: IntroRequestEntryPoint;
}

export function RequestIntroEntry({ type, targetId, targetName, className, entryPoint }: Props) {
  const canRequest = useCanRequestIntro();
  const [open, setOpen] = useState(false);
  const { onButtonShown, onDialogOpened } = useIntroRequestAnalytics();
  const shownForRef = useRef<string | null>(null);
  const visible = Boolean(canRequest && targetId && targetName);
  const targetKey = introRequestTargetKey(type, targetId);
  const sent = useSyncExternalStore(
    subscribeIntroRequestTargets,
    () => isIntroRequestSent(targetKey),
    () => false,
  );
  const resolvedEntryPoint: IntroRequestEntryPoint =
    entryPoint ?? (type === 'MEMBER' ? 'member-header' : 'team-header');
  const context: IntroRequestEventContext = {
    targetType: type === 'MEMBER' ? 'member' : 'team',
    entryPoint: resolvedEntryPoint,
    source: 'modal',
  };
  const { targetType } = context;

  // Once a page view for each target and entry point, even when the page mounts
  // more than one copy of the control (the team page has a desktop and a mobile copy).
  useEffect(() => {
    if (!visible) return;
    const release = retainIntroRequestTarget(targetKey);
    const instanceKey = `${resolvedEntryPoint}:${targetKey}`;
    if (shownForRef.current !== instanceKey) {
      shownForRef.current = instanceKey;
      if (claimIntroRequestShown(targetKey, resolvedEntryPoint)) {
        onButtonShown({ targetType, entryPoint: resolvedEntryPoint, source: 'modal' });
      }
    } else {
      // A re-run of the effect for this copy (for example React Strict Mode): keep the claim, send nothing.
      claimIntroRequestShown(targetKey, resolvedEntryPoint);
    }
    return release;
  }, [visible, targetKey, targetType, resolvedEntryPoint, onButtonShown]);

  if (!visible) {
    return null;
  }

  const openDialog = () => {
    onDialogOpened(context);
    setOpen(true);
  };

  return (
    <>
      {sent ? (
        <span className={clsx(s.sentSlot, className)}>
          <span className={s.sizer} aria-hidden="true">
            <EnvelopeIcon />
            Request an intro
          </span>
          <span className={s.sent}>
            <span aria-hidden="true">✓</span>
            Intro requested
          </span>
        </span>
      ) : (
        <>
          <Button style="fill" variant="primary" size="xs" className={clsx(s.button, className)} onClick={openDialog}>
            <EnvelopeIcon />
            Request an intro
          </Button>
          {/* LAB-3300: only for a member who can request intros (above) and who is inside the agent gate (in the button). */}
          <AskAgentButton
            className={s.askAgent}
            label="Ask the agent"
            entryPoint={`intro-${resolvedEntryPoint}`}
            context={{
              page: 'intro',
              introTarget: { type: targetType, uid: targetId },
              label: `Intro to ${targetName}`,
              entryPoint: resolvedEntryPoint,
            }}
            prefill={introAgentPrefill(targetName)}
          />
        </>
      )}
      {open && (
        <RequestIntroDialog
          type={type}
          targetId={targetId}
          targetName={targetName}
          entryPoint={resolvedEntryPoint}
          onSent={() => markIntroRequestSent(targetKey)}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function EnvelopeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1.75" y="3.25" width="12.5" height="9.5" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
      <path
        d="M2.25 4.25 8 8.75l5.75-4.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
