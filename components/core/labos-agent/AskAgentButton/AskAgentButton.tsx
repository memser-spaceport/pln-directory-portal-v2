'use client';

import clsx from 'clsx';

import { AiSearchIcon } from '@/components/icons/AiSearchIcon';
import { useLabosAgentAccess } from '@/services/labos-agent/hooks/useLabosAgentAccess';
import { useOpenAgent } from '@/services/labos-agent/store';
import type { LabosAgentEntryPoint, LabosAgentOpenContext } from '@/types/labos-agent.types';

import s from './AskAgentButton.module.scss';

interface AskAgentButtonProps {
  context: LabosAgentOpenContext;
  label?: string;
  /** The first message in the composer (S3). The member can change it before they send. */
  prefill?: string;
  /** For the agent events (LAB-3297). Default: `intro-entry` for an intro context, else `news-story`. */
  entryPoint?: LabosAgentEntryPoint;
  /** Runs after the panel opens, for example to close the modal the button sits in. */
  onOpened?: () => void;
  className?: string;
}

/** Opens the agent on a context. Absent (not greyed) for visitors outside the gate. */
export function AskAgentButton({
  context,
  label = 'Ask a follow-up',
  prefill,
  entryPoint,
  onOpened,
  className,
}: AskAgentButtonProps) {
  const enabled = useLabosAgentAccess();
  const openAgent = useOpenAgent();

  if (!enabled) return null;

  return (
    <button
      type="button"
      className={clsx(s.root, className)}
      onClick={() => {
        openAgent({
          context,
          prefill,
          entryPoint: entryPoint ?? (context.page === 'intro' ? 'intro-entry' : 'news-story'),
        });
        onOpened?.();
      }}
    >
      <AiSearchIcon size={16} />
      {label}
    </button>
  );
}
