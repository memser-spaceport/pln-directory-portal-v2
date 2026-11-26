'use client';

import clsx from 'clsx';
import { forwardRef, type ReactNode, useImperativeHandle, useRef } from 'react';

import { LabosAgentMentionChip } from '@/components/core/labos-agent/LabosAgentMentionChip/LabosAgentMentionChip';
import { LabosAgentMentionPicker } from '@/components/core/labos-agent/LabosAgentMentionPicker/LabosAgentMentionPicker';
import { LABOS_AGENT_MESSAGE_MAX, LABOS_AGENT_PAGE_TEXT } from '@/services/labos-agent/constants';
import { useLabosAgentComposer } from '@/services/labos-agent/hooks/useLabosAgentComposer';
import type { LabosAgentMentionChip as Chip, LabosAgentTurn } from '@/types/labos-agent.types';

import { ChatComposer } from '../../../Chat/components/ChatComposer';

import s from './AgentChatComposer.module.scss';

export interface AgentChatComposerHandle {
  /** Puts text in the field the way typing does (a question to edit, a failed message). */
  setText: (text: string) => void;
  focus: () => void;
}

interface Props {
  /** `home`: the new-chat field under the headline (the picker drops below it). `thread`: pinned at the foot. */
  size: 'home' | 'thread';
  placeholder: string;
  busy: boolean;
  send: (text: string, chips: Chip[]) => boolean;
  onStop: () => void;
  lastTurn?: LabosAgentTurn;
  onTextRestored: (turnId: string) => void;
  onMentionsRestored: (turnId: string) => void;
  /** False for a chat scoped to one profile: no @mentions (prototype `ai-search-page` `noMentions`). */
  mentions?: boolean;
  /** Inside the field before the chips: the scope chip of a scoped chat. */
  leading?: ReactNode;
  autoFocus?: boolean;
}

/**
 * The composer of AI agent chat when the chat is the agent (LAB-3457). The agent's own composer logic
 * (`useLabosAgentComposer`), picker (`LabosAgentMentionPicker`) and chips (`LabosAgentMentionChip`), in the page's
 * field (`ChatComposer`). As in the prototype's `MentionComposer`, the chips ride inside the field, above the text.
 * Enter sends, Shift + Enter adds a line, Esc closes the picker. A message holds at most 2000 characters.
 */
export const AgentChatComposer = forwardRef<AgentChatComposerHandle, Props>(function AgentChatComposer(
  {
    size,
    placeholder,
    busy,
    send,
    onStop,
    lastTurn,
    onTextRestored,
    onMentionsRestored,
    mentions = true,
    leading,
    autoFocus,
  },
  ref,
) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const composer = useLabosAgentComposer({
    inputRef,
    send,
    lastTurn,
    onTextRestored,
    onMentionsRestored,
    mentions,
  });

  useImperativeHandle(
    ref,
    () => ({
      setText: (text: string) => {
        const el = inputRef.current;
        if (!el) return;
        composer.setComposerText(el, text);
        el.focus();
      },
      focus: () => inputRef.current?.focus(),
    }),
    [composer],
  );

  const chips = mentions ? composer.chips : [];
  const inField =
    leading || chips.length > 0 ? (
      <span className={s.chips} role="group" aria-label={LABOS_AGENT_PAGE_TEXT.chipsAria}>
        {leading}
        {chips.map((chip) => (
          <LabosAgentMentionChip key={chip.key} chip={chip} onRemove={composer.removeChip} />
        ))}
      </span>
    ) : undefined;

  return (
    <div className={clsx(s.root, size === 'home' && s.home)}>
      {mentions && composer.pickerProps && <LabosAgentMentionPicker {...composer.pickerProps} />}
      <ChatComposer
        ref={inputRef}
        size={size}
        rows={1}
        maxLength={LABOS_AGENT_MESSAGE_MAX}
        placeholder={placeholder}
        aria-label={LABOS_AGENT_PAGE_TEXT.composerAria}
        autoFocus={autoFocus}
        leading={inField}
        {...composer.comboboxProps}
        isLoadingObject={busy}
        onStopStreaming={onStop}
        onTextSubmit={() => composer.submit(inputRef.current?.value ?? '')}
        onChange={(e) => composer.readMention(e.currentTarget)}
        onKeyDown={composer.onComposerKeyDown}
      />
    </div>
  );
});
