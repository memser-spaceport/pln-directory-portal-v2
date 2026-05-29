'use client';

import { clsx } from 'clsx';
import { Menu } from '@base-ui-components/react/menu';
import type { GantryStage } from '@/services/gantry/types';
import { GANTRY_STAGE_LABELS, getAllowedStageTransitions } from '@/services/gantry/constants';
import { StageBadge } from './StageBadge';
import s from './StageSelector.module.scss';

interface Props {
  readonly stage: GantryStage;
  readonly canChange: boolean;
  readonly isPending?: boolean;
  readonly onStageSelect: (stage: GantryStage) => void;
}

function ChevronIcon() {
  return (
    <svg className={s.chevron} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M4 6L8 10L12 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StageSelector({ stage, canChange, isPending, onStageSelect }: Props) {
  const options = getAllowedStageTransitions(stage);

  if (!canChange || options.length === 0) {
    return <StageBadge stage={stage} />;
  }

  return (
    <Menu.Root modal={false}>
      <Menu.Trigger
        className={clsx(s.trigger, s[`trigger_${stage}`], isPending && s.triggerPending)}
        disabled={isPending}
        aria-label={`Change stage (currently ${GANTRY_STAGE_LABELS[stage]})`}
      >
        <StageBadge stage={stage} />
        <ChevronIcon />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={s.positioner} sideOffset={4} align="start">
          <Menu.Popup className={s.menu}>
            <div className={s.menuHint}>Move to</div>
            {options.map((option) => (
              <Menu.Item key={option} className={s.option} onClick={() => onStageSelect(option)}>
                <StageBadge stage={option} />
              </Menu.Item>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
