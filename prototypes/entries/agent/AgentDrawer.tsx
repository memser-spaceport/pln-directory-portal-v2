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

import clsx from 'clsx';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';


import dw from '../labos-feedback-button/feedback/FeedbackDrawer.module.scss';

import type { AgentReply } from '../home-v2-b/agentScript';
import { AgentCorner, SlotTabs, type SlotTab } from '../home-v2-agent-dock/AgentCorner';
import agentV0 from '../home-v2-agent-dock/AgentV0.module.scss';
import { PageFeedbackDrawer, usePageFeedback } from '../labos-feedback-button/feedback/PageFeedback';

import { AgentChat } from './AgentChat';
import { AgentHistory } from './AgentHistory';
import s from './Agent.module.scss';
import type { AgentItem } from './items';
import {
  createScript,
  history,
  intro,
  itemPrompts,
  placeholder,
  rolePrompts,
  VIEWERS,
  type Chat,
  type ViewerKey,
  type Prompt,
  type Viewer,
} from './script';

/** A request from the page to open the agent on something ("Ask AI" on a card). `seq` makes repeats count. */
export type AskRequest = { seq: number; item: AgentItem };

/** A request the page sends for the member (profile-agent-actions' menu): a new chat that opens already asked. */
export type SendRequest = { seq: number; text: string };

/* ---------- Panel width (LAB-3389) ---------- */

/** Opens wider than the feedback drawer's 480 (user 2026-11-25: "make it wider by default"). Double-clicking the edge comes back here. */
export const AGENT_W_DEFAULT = 600;
/** The narrowest the slot's two headers fit: at 400 the Feedback tab's Shortcuts · Wide · ✕ ran off the edge. */
export const AGENT_W_MIN = 440;
/** Past this a side panel is doing a page's job, and the page is one press away ("Open in AI Search"). */
export const AGENT_W_MAX = 720;
/** The page keeps at least this much beside the panel, so it stays usable (ticket scenario 4). */
const PAGE_KEEP = 480;
const STORAGE_KEY = 'pln-proto-agent-width';

const clampWidth = (w: number) => {
  const max = Math.max(AGENT_W_MIN, Math.min(AGENT_W_MAX, window.innerWidth - PAGE_KEEP));
  return Math.round(Math.min(max, Math.max(AGENT_W_MIN, w)));
};

const readStoredWidth = () => {
  try {
    const v = Number(window.localStorage.getItem(STORAGE_KEY));
    return Number.isFinite(v) && v > 0 ? v : AGENT_W_DEFAULT;
  } catch {
    return AGENT_W_DEFAULT;
  }
};

const storeWidth = (w: number) => {
  try {
    if (w === AGENT_W_DEFAULT) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, String(w));
  } catch {
    /* Private window or blocked storage: the width lasts this visit only. */
  }
};

/**
 * The member's panel width, kept across reloads, clamped to the window as it resizes. Written to <html> as
 * --agent-w so the Agent panel, the Feedback tab (same slot) and the edge handle all read one number.
 */
function useAgentWidth() {
  /* The drawer mounts only after the prototype's mount gate, so the window is there to read. */
  const [width, setWidth] = useState(() =>
    typeof window === 'undefined' ? AGENT_W_DEFAULT : clampWidth(readStoredWidth()),
  );
  useEffect(() => {
    const onResize = () => setWidth((w) => clampWidth(w));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  useEffect(() => {
    document.documentElement.style.setProperty('--agent-w', `${width}px`);
  }, [width]);
  useEffect(
    () => () => {
      document.documentElement.style.removeProperty('--agent-w');
    },
    [],
  );
  return [width, setWidth] as const;
}

/**
 * The panel's left edge (≥960 only; below that the panel is a full-screen sheet and this isn't rendered by
 * CSS). Drag it; or focus it and use ← → (24px), Home/End for min/max; double-click resets to the default (600).
 */
function ResizeHandle({ width, onWidth }: { width: number; onWidth: (w: number, commit: boolean) => void }) {
  const [dragging, setDragging] = useState(false);
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    document.documentElement.classList.add(s.dragging);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragging) onWidth(clampWidth(window.innerWidth - e.clientX), false);
  };
  const end = () => {
    if (!dragging) return;
    setDragging(false);
    document.documentElement.classList.remove(s.dragging);
    onWidth(width, true);
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 96 : 24;
    const next =
      e.key === 'ArrowLeft'
        ? width + step
        : e.key === 'ArrowRight'
          ? width - step
          : e.key === 'Home'
            ? AGENT_W_MIN
            : e.key === 'End'
              ? AGENT_W_MAX
              : null;
    if (next == null) return;
    e.preventDefault();
    onWidth(clampWidth(next), true);
  };
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize the agent panel"
      aria-valuemin={AGENT_W_MIN}
      aria-valuemax={AGENT_W_MAX}
      aria-valuenow={width}
      tabIndex={0}
      title="Drag to resize · double-click to reset"
      className={s.resizeHandle}
      data-dragging={dragging ? '' : undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={end}
      onPointerCancel={end}
      onDoubleClick={() => onWidth(clampWidth(AGENT_W_DEFAULT), true)}
      onKeyDown={onKeyDown}
    />
  );
}

/** The ai-search-page prototype's address for a chat handed over from the agent (see its arrival effect). */
export function aiSearchUrl(questions: string[], scopeParams?: Record<string, string>): string {
  const params = new URLSearchParams(scopeParams);
  questions.forEach((q) => params.append('q', q));
  params.set('answered', '1');
  return `/prototypes/ai-search-page?${params.toString()}`;
}

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
  openSeq = 0,
  pageReadable = true,
  aiSearchScope,
  handoffFailsOnce = false,
}: {
  /** False: a page the agent may not read. The slot says "Can't read this page" and the agent starts empty. */
  pageReadable?: boolean;
  /** How AI Search names this page as a scope (`{ about: 'member' }`); none = the whole network (Home). */
  aiSearchScope?: Record<string, string>;
  /** Review switch: the first "Open in AI Search" fails (ticket scenario 3), Retry works. */
  handoffFailsOnce?: boolean;
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
  /** Bumped by the host page to open the agent (AI agent chat's "Open the agent", Undo). */
  openSeq?: number;
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
  const startReading = pageReadable ? [page] : [];
  const [reading, setReading] = useState<AgentItem[]>(startReading);

  const [width, setWidth] = useAgentWidth();
  const onWidth = useCallback(
    (w: number, commit: boolean) => {
      setWidth(w);
      if (commit) storeWidth(w);
    },
    [setWidth],
  );

  /* Open in AI Search: the questions, plus this page as AI Search's scope while the agent is reading it. */
  const failedOnce = useRef(false);
  const openInAiSearch = (questions: string[]) => {
    if (handoffFailsOnce && !failedOnce.current) {
      failedOnce.current = true;
      return false;
    }
    const scoped = aiSearchScope && readingRef.current.some((r) => r.id === page.id);
    /* The member's role travels too, so AI agent chat knows which of these were actions the agent took
       (they arrive as the agent's finished cards, never run again). */
    const role = (Object.keys(VIEWERS) as ViewerKey[]).find((k) => VIEWERS[k] === viewer);
    const extra: Record<string, string> = { ...(scoped ? aiSearchScope : {}), ...(role && role !== 'founder' ? { role } : {}) };
    window.open(aiSearchUrl(questions, Object.keys(extra).length ? extra : undefined), '_blank', 'noopener');
    return true;
  };
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
        const r = (pageReadable ? pageReply?.(text, readingRef.current) : null) ?? base(text);
        /* Name what else it read, so a chip shows in the answer too (Home is implied, not repeated). */
        const extra = readingRef.current.filter(
          (i) => i.id !== 'page-home' && r.steps.length > 0 && !r.steps.some((st) => st.includes(i.label)),
        );
        return { ...r, steps: [...extra.map((i) => `Read ${i.label}`), ...r.steps] };
      },
    [base, pageReply, pageReadable],
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
    setReading(startReading);
    setSent(send);
    setChatSeq((n) => n + 1);
    openAgent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [send?.seq]);

  /* The host page asked for the agent. */
  useEffect(() => {
    if (openSeq > 0) openAgent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openSeq]);

  /* Ask AI: a fresh chat reading this page and the story. */
  useEffect(() => {
    if (!ask) return;
    setPastChat(null);
    setSent(null);
    setReading([...startReading, ask.item]);
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
        headExtra={<AgentHistory chats={history(viewer)} onOpenChat={openPastChat} />}
        reading={reading}
        page={page}
        pageReadable={pageReadable}
        onOpenInAiSearch={openInAiSearch}
        catalog={catalog}
        suggested={pageReadable ? [page, ...recentPages] : recentPages}
        onAdd={(i) => setReading((r) => (r.some((x) => x.id === i.id) ? r : [...r, i]))}
        onRemove={(id) => setReading((r) => r.filter((x) => x.id !== id))}
        initialThread={pastChat ? [{ text: pastChat.chat.prompt, reply: pastChat.reply }] : undefined}
        initialSend={pastChat ? undefined : sent?.text}
        /* panelOnHome's 73px header, so the Agent | Feedback tabs sit where the feedback drawer's do. */
        className={clsx(agentV0.panelOnHome, s.resizable)}
      />

      {/* One edge for the slot: it resizes whichever tab is open, and the Feedback tab wears the same width
          (FeedbackDrawer's .panelNarrow is 480px and takes no prop, so its class is restated here). */}
      {(open || feedback.isOpen) && <ResizeHandle width={width} onWidth={onWidth} />}
      <style>{`@media (min-width: 960px) { .${dw.panelNarrow}.${dw.panelNarrow}.${dw.panelNarrow} { width: var(--agent-w, 600px); } }`}</style>

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
