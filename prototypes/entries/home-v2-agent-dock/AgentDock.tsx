'use client';

import { Menu } from '@base-ui-components/react/menu';
import { Briefcase, House, Plus, User, UsersThree, X } from '@phosphor-icons/react';
import { useEffect, useMemo, useRef, useState } from 'react';

import menu from '@/components/page/home/TeamNews/components/NewsShareMenu/NewsShareMenu.module.scss';

import { AgentPanel } from '../home-v2-b/AgentPanel';
import type { AgentPrompt, AgentReply } from '../home-v2-b/agentScript';
import { PageFeedbackDrawer, usePageFeedback } from '../labos-feedback-button/feedback/PageFeedback';

import { AgentCorner, AgentHistoryMenu, SlotTabs, type SlotTab } from './AgentCorner';
import {
  agentHistory,
  agentIntro,
  agentPlaceholder,
  agentPrompts,
  createAgentV0Script,
  type AgentChat,
  type AgentViewer,
} from './AgentV0';
import agentV0 from './AgentV0.module.scss';
import s from './AgentCorner.module.scss';

/** A LabOS page the agent can read. `label` is how the chip and the steps name it. */
export type AgentPage = {
  id: string;
  kind: 'home' | 'profile' | 'team' | 'jobs';
  label: string;
  /** The feedback drawer's "About this page" name. */
  name: string;
  path: string;
};

const KIND_LABEL: Record<AgentPage['kind'], string> = {
  home: 'Page',
  profile: 'Member profile',
  team: 'Team profile',
  jobs: 'Page',
};

function PageIcon({ kind }: { kind: AgentPage['kind'] }) {
  if (kind === 'profile') return <User weight="regular" />;
  if (kind === 'team') return <UsersThree weight="regular" />;
  if (kind === 'jobs') return <Briefcase weight="regular" />;
  return <House weight="regular" />;
}

/** The pages the mocked member has open or saw recently, for "Add page". */
export const AGENT_PAGES: Record<'home' | 'maya' | 'lattice' | 'jobs', AgentPage> = {
  home: { id: 'home', kind: 'home', label: 'Home', name: 'Home', path: '/home' },
  maya: {
    id: 'maya',
    kind: 'profile',
    label: 'Maya Okonkwo',
    name: 'Maya Okonkwo',
    path: '/members/maya-okonkwo',
  },
  lattice: {
    id: 'lattice',
    kind: 'team',
    label: 'Lattice Compute',
    name: 'Lattice Compute',
    path: '/teams/lattice-compute',
  },
  jobs: { id: 'jobs', kind: 'jobs', label: 'Jobs', name: 'Jobs', path: '/jobs' },
};

/**
 * The row above the composer: the pages the agent reads. It opens with the page you're on (as Linear's agent
 * shows the issue it was opened on); ✕ takes one away, "Add page" adds a page you saw recently. The agent's
 * steps then say it read them, so the context is visible in the answer too.
 */
function ContextRow({
  pages,
  available,
  onRemove,
  onAdd,
}: {
  pages: AgentPage[];
  available: AgentPage[];
  onRemove: (id: string) => void;
  onAdd: (page: AgentPage) => void;
}) {
  const addable = available.filter((p) => !pages.some((c) => c.id === p.id));
  return (
    <div className={s.contextRow}>
      {pages.map((p) => (
        <span key={p.id} className={s.contextChip} title={`The agent reads ${p.label}`}>
          <PageIcon kind={p.kind} />
          <span className={s.contextLabel}>{p.label}</span>
          <button
            type="button"
            className={s.contextRemove}
            aria-label={`Stop reading ${p.label}`}
            onClick={() => onRemove(p.id)}
          >
            <X weight="bold" />
          </button>
        </span>
      ))}
      {addable.length > 0 && (
        <Menu.Root modal={false}>
          <Menu.Trigger className={s.contextAdd}>
            <Plus weight="bold" />
            {pages.length === 0 ? 'Add a page' : 'Add page'}
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner className={menu.positioner} side="top" align="start" sideOffset={6}>
              <Menu.Popup className={`${menu.popup} ${s.pagePopup}`}>
                <div className={menu.popupTitle}>Recently viewed</div>
                {addable.map((p) => (
                  <Menu.Item key={p.id} className={`${menu.item} ${s.pageItem}`} onClick={() => onAdd(p)}>
                    <PageIcon kind={p.kind} />
                    <span className={s.pageItemText}>
                      <span>{p.label}</span>
                      <span className={s.pageItemKind}>{KIND_LABEL[p.kind]}</span>
                    </span>
                  </Menu.Item>
                ))}
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      )}
    </div>
  );
}

/**
 * The signed-in right-hand slot of any LabOS page: Agent panel, feedback drawer and the corner that opens
 * them. One slot (manager review 2026-11-11): opening one closes the other, Ctrl/⌘ J and F included, and the
 * open drawer's title is the Agent | Feedback tabs, so the two read as tabs of one drawer.
 *
 * `pageReply` answers the page's own prompts before the V0 script; it gets the pages the agent currently reads,
 * so taking the page away changes the answer.
 */
export function AgentDock({
  page,
  viewer,
  recentPages,
  pagePrompts = [],
  pageReply,
  openOnArrival = false,
}: {
  page: AgentPage;
  viewer: AgentViewer;
  recentPages: AgentPage[];
  pagePrompts?: AgentPrompt[];
  pageReply?: (text: string, reading: AgentPage[]) => AgentReply | null;
  openOnArrival?: boolean;
}) {
  const feedback = usePageFeedback();
  const [agentOpen, setAgentOpen] = useState(openOnArrival);
  const [reading, setReading] = useState<AgentPage[]>([page]);
  /* The panel calls `reply` when you send; a ref so it sees the chips as they are then. */
  const readingRef = useRef(reading);
  useEffect(() => {
    readingRef.current = reading;
  }, [reading]);
  const agentOpenRef = useRef(agentOpen);
  useEffect(() => {
    agentOpenRef.current = agentOpen;
  }, [agentOpen]);

  const base = useMemo(() => createAgentV0Script(viewer), [viewer]);
  const reply = useMemo(
    () =>
      (text: string): AgentReply => {
        const r = pageReply?.(text, readingRef.current) ?? base(text);
        /* Name the other pages it read, so a page you added shows in the answer as well as the chip. */
        const extra = readingRef.current.filter((p) => p.kind !== 'home' && !r.steps.some((st) => st.includes(p.label)));
        return { ...r, steps: [...extra.map((p) => `Read ${p.label}`), ...r.steps] };
      },
    [base, pageReply],
  );

  /* The past chat the panel is showing. Replayed here, in the click, so the script runs once and an open
     question in that chat can still be answered. */
  const [pastChat, setPastChat] = useState<{ chat: AgentChat; reply: AgentReply } | null>(null);

  const openAgent = () => {
    feedback.close();
    setAgentOpen(true);
  };
  const openFeedback = () => {
    setAgentOpen(false);
    feedback.open();
  };
  const selectTab = (tab: SlotTab) => (tab === 'agent' ? openAgent() : openFeedback());
  const openPastChat = (chat: AgentChat) => {
    setPastChat({ chat, reply: reply(chat.prompt) });
    openAgent();
  };

  /* F opens the feedback drawer from inside the hook: the Agent panel gives up the slot. */
  useEffect(() => {
    if (feedback.isOpen) setAgentOpen(false);
  }, [feedback.isOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        if (!agentOpenRef.current) feedback.close();
        setAgentOpen(!agentOpenRef.current);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedback.close]);

  const prompts = [...pagePrompts, ...agentPrompts(viewer)].slice(0, 4);

  return (
    <>
      {/* Keyed by viewer and past chat: switching either starts from that conversation. */}
      <AgentPanel
        key={`${viewer.key}-${pastChat?.chat.id ?? 'new'}`}
        initialThread={pastChat ? [{ text: pastChat.chat.prompt, reply: pastChat.reply }] : undefined}
        headTitle={<SlotTabs active="agent" onSelect={selectTab} />}
        headExtra={<AgentHistoryMenu chats={agentHistory(viewer)} onOpenChat={openPastChat} />}
        contextSlot={
          <ContextRow
            pages={reading}
            available={[page, ...recentPages]}
            onRemove={(id) => setReading((r) => r.filter((p) => p.id !== id))}
            onAdd={(p) => setReading((r) => [...r, p])}
          />
        }
        open={agentOpen}
        onClose={() => setAgentOpen(false)}
        reply={reply}
        greeting={`Hi ${viewer.firstName}, what can I do for you?`}
        intro={agentIntro(viewer)}
        prompts={prompts}
        placeholder={agentPlaceholder(viewer)}
        className={agentV0.panelOnHome}
      />
      <AgentCorner
        slotOpen={agentOpen || feedback.isOpen}
        onOpenAgent={openAgent}
        onOpenFeedback={openFeedback}
      />
      <PageFeedbackDrawer
        isOpen={feedback.isOpen}
        onClose={feedback.close}
        page={{ name: page.name, path: page.path }}
        viewer={{ uid: `viewer-${viewer.key}`, name: viewer.name, email: viewer.email }}
        headerTabs={<SlotTabs active="feedback" onSelect={selectTab} />}
        instant
      />
    </>
  );
}
