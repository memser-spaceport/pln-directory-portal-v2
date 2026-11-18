'use client';

/**
 * The signed-in right-hand slot for the "agent" entry: Agent and Feedback as two tabs of one floating button
 * (user, 2026-11-18: "make Feedback and Agent 2 tabs of one floating button"; this undoes the 2026-11-17
 * single Agent door). The corner and the tabs are home-v2-agent-dock's AgentCorner + SlotTabs, imported:
 *
 *   - Closed: one pill holding the two tabs; it arrives with both labels, settles to the two glyphs, and a
 *     hovered tab says its name. Feedback keeps dev's brand fill.
 *   - Open: the drawer's title is the same Agent | Feedback pair; switching swaps the Agent panel and the
 *     LabOS feedback drawer in place (same 480px, no slide). Ctrl/⌘ J and Alt F switch too.
 *   - Feedback is the tab again, so the agent no longer offers it as a prompt. Typed feedback ("X is broken")
 *     still gets the agent's feedback card, for whoever tells the agent first.
 *   - The context row starts with the page you're on; ✕ drops it, + or "@" adds pages, news, teams, members,
 *     events and forum threads.
 *   - "Ask AI" on a news card opens a new chat already reading that story, with questions about it.
 */

import { useEffect, useMemo, useRef, useState } from 'react';

import type { AgentReply } from '../home-v2-b/agentScript';
import { AgentCorner, AgentHistoryMenu, SlotTabs, type SlotTab } from '../home-v2-agent-dock/AgentCorner';
import agentV0 from '../home-v2-agent-dock/AgentV0.module.scss';
import { PageFeedbackDrawer, usePageFeedback } from '../labos-feedback-button/feedback/PageFeedback';

import { AgentChat } from './AgentChat';
import type { AgentItem } from './items';
import {
  createScript,
  history,
  intro,
  itemPrompts,
  placeholder,
  rolePrompts,
  type Chat,
  type Prompt,
  type Viewer,
} from './script';

/** A request from the page to open the agent on something ("Ask AI" on a card). `seq` makes repeats count. */
export type AskRequest = { seq: number; item: AgentItem };

/** A request the page sends for the member (profile-agent-actions' menu): a new chat that opens already asked. */
export type SendRequest = { seq: number; text: string };

export function AgentDrawer({
  page,
  viewer,
  recentPages,
  catalog,
  pagePrompts = [],
  pageReply,
  ask,
  send,
  openOnArrival = false,
}: {
  page: AgentItem;
  viewer: Viewer;
  recentPages: AgentItem[];
  catalog: AgentItem[];
  /** Questions about the page itself, offered first while it's in context. */
  pagePrompts?: Prompt[];
  /** Answers the page's own questions before the script; gets what the agent reads now. */
  pageReply?: (text: string, reading: AgentItem[]) => AgentReply | null;
  ask?: AskRequest | null;
  send?: SendRequest | null;
  openOnArrival?: boolean;
}) {
  const feedback = usePageFeedback();
  const [open, setOpen] = useState(openOnArrival);
  /* One slot: the agent opening closes the feedback drawer, and the other way round (Alt F included). */
  const openAgent = () => {
    feedback.close();
    setOpen(true);
  };
  const openFeedback = () => {
    setOpen(false);
    feedback.open();
  };
  const selectTab = (tab: SlotTab) => (tab === 'agent' ? openAgent() : openFeedback());
  useEffect(() => {
    if (feedback.isOpen) setOpen(false);
  }, [feedback.isOpen]);
  const [reading, setReading] = useState<AgentItem[]>([page]);
  const readingRef = useRef(reading);
  useEffect(() => {
    readingRef.current = reading;
  }, [reading]);
  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  /* A new script per chat: its open questions belong to that conversation. */
  const [chatSeq, setChatSeq] = useState(0);
  const base = useMemo(
    () => createScript(viewer, () => ({ page, reading: readingRef.current })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [viewer, page, chatSeq],
  );
  const reply = useMemo(
    () =>
      (text: string): AgentReply => {
        const r = pageReply?.(text, readingRef.current) ?? base(text);
        /* Name what else it read, so a chip shows in the answer too (Home is implied, not repeated). */
        const extra = readingRef.current.filter(
          (i) => i.id !== 'page-home' && r.steps.length > 0 && !r.steps.some((st) => st.includes(i.label)),
        );
        return { ...r, steps: [...extra.map((i) => `Read ${i.label}`), ...r.steps] };
      },
    [base, pageReply],
  );

  const [pastChat, setPastChat] = useState<{ chat: Chat; reply: AgentReply } | null>(null);
  const openPastChat = (chat: Chat) => {
    setSent(null);
    setPastChat({ chat, reply: reply(chat.prompt) });
    openAgent();
  };

  /* A request sent from the page: a fresh chat reading the page, with the request as its first message. */
  const [sent, setSent] = useState<SendRequest | null>(null);
  useEffect(() => {
    if (!send) return;
    setPastChat(null);
    setReading([page]);
    setSent(send);
    setChatSeq((n) => n + 1);
    openAgent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [send?.seq]);

  /* Ask AI: a fresh chat reading this page and the story. */
  useEffect(() => {
    if (!ask) return;
    setPastChat(null);
    setSent(null);
    setReading([page, ask.item]);
    setChatSeq((n) => n + 1);
    openAgent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ask?.seq]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        if (!openRef.current) feedback.close();
        setOpen(!openRef.current);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedback.close]);

  /* What the empty state offers: questions about the newest thing in context, else the role's actions.
     No feedback prompt: Feedback is its own tab beside Agent. */
  const item = [...reading].reverse().find((r) => r.kind !== 'page');
  const prompts: Prompt[] = item
    ? itemPrompts(item)
    : [...(reading.some((r) => r.id === page.id) ? pagePrompts : []), ...rolePrompts(viewer)].slice(0, 5);

  return (
    <>
      <AgentChat
        key={`${viewer.key}-${chatSeq}-${pastChat?.chat.id ?? (sent ? `sent-${sent.seq}` : 'new')}`}
        open={open}
        onClose={() => setOpen(false)}
        reply={reply}
        greeting={
          item
            ? `Ask about this ${item.kind === 'news' ? 'story' : item.kind}`
            : `Hi ${viewer.firstName}, what can I do for you?`
        }
        intro={item ? `I’m reading “${item.label}”. Ask me about it, or take it out below.` : intro(viewer)}
        prompts={prompts}
        placeholder={placeholder(viewer)}
        headTitle={<SlotTabs active="agent" onSelect={selectTab} />}
        headExtra={<AgentHistoryMenu chats={history(viewer)} onOpenChat={openPastChat} />}
        reading={reading}
        catalog={catalog}
        suggested={[page, ...recentPages]}
        onAdd={(i) => setReading((r) => (r.some((x) => x.id === i.id) ? r : [...r, i]))}
        onRemove={(id) => setReading((r) => r.filter((x) => x.id !== id))}
        initialThread={pastChat ? [{ text: pastChat.chat.prompt, reply: pastChat.reply }] : undefined}
        initialSend={pastChat ? undefined : sent?.text}
        /* panelOnHome's 73px header, so the Agent | Feedback tabs sit where the feedback drawer's do. */
        className={agentV0.panelOnHome}
      />

      {/* Closed: Agent | Feedback on one floating pill. Hidden (not unmounted) while either is open. */}
      <AgentCorner slotOpen={open || feedback.isOpen} onOpenAgent={openAgent} onOpenFeedback={openFeedback} />

      <PageFeedbackDrawer
        isOpen={feedback.isOpen}
        onClose={feedback.close}
        page={{ name: page.label, path: page.path ?? '/' }}
        viewer={{ uid: `viewer-${viewer.key}`, name: viewer.name, email: viewer.email }}
        headerTabs={<SlotTabs active="feedback" onSelect={selectTab} />}
        instant
      />
    </>
  );
}
