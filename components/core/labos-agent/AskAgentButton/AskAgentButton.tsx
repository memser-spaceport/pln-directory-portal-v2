'use client';

import clsx from 'clsx';

import { AiSearchIcon } from '@/components/icons/AiSearchIcon';
import { useLabosAgentAnalytics } from '@/analytics/labos-agent.analytics';
import { useLabosAgentAccess } from '@/services/labos-agent/hooks/useLabosAgentAccess';
import { useOpenAgent } from '@/services/labos-agent/store';
import type { LabosAgentOpenContext } from '@/types/labos-agent.types';

import s from './AskAgentButton.module.scss';

interface AskAgentButtonProps {
  context: LabosAgentOpenContext;
  label?: string;
  /** Runs after the panel opens, for example to close the modal the button sits in. */
  onOpened?: () => void;
  className?: string;
}

/** Opens the agent on a context. Absent (not greyed) for visitors outside the gate. */
export function AskAgentButton({ context, label = 'Ask a follow-up', onOpened, className }: AskAgentButtonProps) {
  const enabled = useLabosAgentAccess();
  const openAgent = useOpenAgent();
  const { onAgentOpened } = useLabosAgentAnalytics();

  if (!enabled) return null;

  return (
    <button
      type="button"
      className={clsx(s.root, className)}
      onClick={() => {
        openAgent({ context });
        onAgentOpened({ page: context.page, entryPoint: 'news-follow-up' });
        onOpened?.();
      }}
    >
      <AiSearchIcon size={16} />
      {label}
    </button>
  );
}
