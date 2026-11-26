'use client';

import { clsx } from 'clsx';

import { CloseIcon } from '@/components/icons/CloseIcon';
import type { LabosAgentMentionChip as Chip } from '@/types/labos-agent.types';

import s from './LabosAgentMentionChip.module.scss';

interface LabosAgentMentionChipProps {
  chip: Chip;
  onRemove: (key: string) => void;
  className?: string;
}

/**
 * One @mention chip of the agent's composer (S6, LAB-3318): the item's name and ✕. A chip that C1 could not read is
 * marked (S6-F17). The panel and the AI agent chat page draw the same chip (LAB-3457).
 */
export function LabosAgentMentionChip({ chip, onRemove, className }: LabosAgentMentionChipProps) {
  return (
    <span
      className={clsx(s.root, chip.failed && s.failed, className)}
      data-failed={chip.failed ? 'true' : undefined}
      title={chip.failed ? `The agent cannot read ${chip.label}` : `The agent reads ${chip.label}`}
    >
      <span className={s.context}>
        <span className={s.contextText}>{chip.label}</span>
      </span>
      <button
        type="button"
        className={s.contextRemove}
        aria-label={`Remove ${chip.label}`}
        onClick={() => onRemove(chip.key)}
      >
        <CloseIcon />
      </button>
    </span>
  );
}
