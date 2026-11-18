'use client';

/**
 * The profile header's contact press, as an agent door: one glossy "Make a request" that opens a short list
 * of what the agent can do for you with this member or team. Picking one opens the Agent drawer with that
 * request already sent, and the agent carries it out (requests.tsx); "Something else" opens it on the page.
 *
 * The press is the one it replaces, by class: production's glossy Schedule Meeting (OfficeHoursView
 * `primaryButton`) at the header cluster's size (intro-shared's `.primary`), so the cluster measures the
 * same. The list is the product's menu chrome (NewsShareMenu), as the agent's history menu uses it.
 */

import { Menu } from '@base-ui-components/react/menu';
import clsx from 'clsx';

import { CalendarBlankIcon } from '@/components/icons';

import office from '@/components/page/member-details/OfficeHoursDetails/components/OfficeHoursView/OfficeHoursView.module.scss';
import menu from '@/components/page/home/TeamNews/components/NewsShareMenu/NewsShareMenu.module.scss';

import { AgentGlyph } from '../home-v2-agent-dock/AgentCorner';
import intro from '../intro-shared/RequestIntroButton.module.scss';
import { EnvelopeGlyph } from '../intro-shared/EnvelopeGlyph';

import s from './ProfileAgentActions.module.scss';

export type RequestOption = {
  key: string;
  label: string;
  hint: string;
  icon: 'calendar' | 'intro';
  /** Sent to the agent as the member's message. */
  line: string;
  /** Already done (an intro already requested): shown, not pressable. */
  done?: string;
};

export function AgentRequestMenu({
  options,
  onPick,
  onOpenAgent,
  size,
  className,
}: {
  options: RequestOption[];
  onPick: (line: string) => void;
  onOpenAgent: () => void;
  size: 'xs' | 's';
  className?: string;
}) {
  return (
    <Menu.Root modal={false}>
      <Menu.Trigger
        className={clsx(office.primaryButton, intro.primary, size === 's' && intro.primaryS, s.trigger, className)}
      >
        <span className={s.triggerGlyph}>
          <AgentGlyph />
        </span>
        <span>Make a request</span>
        <CaretGlyph />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={menu.positioner} side="bottom" align="end" sideOffset={6}>
          <Menu.Popup className={clsx(menu.popup, s.popup)}>
            <div className={menu.popupTitle}>Ask the agent to</div>
            {options.map((o) => (
              <Menu.Item
                key={o.key}
                className={clsx(menu.item, s.item)}
                disabled={!!o.done}
                onClick={() => onPick(o.line)}
              >
                <span className={s.itemIcon}>
                  {o.icon === 'calendar' ? (
                    <CalendarBlankIcon className={s.itemSvg} aria-hidden="true" />
                  ) : (
                    <EnvelopeGlyph size={16} />
                  )}
                </span>
                <span className={s.itemText}>
                  <span className={s.itemLabel}>{o.label}</span>
                  <span className={s.itemHint}>{o.done ?? o.hint}</span>
                </span>
              </Menu.Item>
            ))}
            <div className={s.sep} role="separator" />
            <Menu.Item className={clsx(menu.item, s.item)} onClick={onOpenAgent}>
              <span className={s.itemIcon}>
                <AgentGlyph />
              </span>
              <span className={s.itemText}>
                <span className={s.itemLabel}>Something else</span>
                <span className={s.itemHint}>Open the agent on this profile</span>
              </span>
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

function CaretGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden className={s.caret}>
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
