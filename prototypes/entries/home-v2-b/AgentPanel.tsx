'use client';

import clsx from 'clsx';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import type { ITeamNewsItem } from '@/types/team-news.types';
import { AiSearchIcon } from '@/components/icons/AiSearchIcon';
import { CloseIcon } from '@/components/icons/CloseIcon';
import { Button } from '@/components/common/Button';

import Composer from '../ai-mode-results/Composer';
import { HomeIcon } from '../nav-shared/icons';
import { EVENT_TYPE_LABEL } from '../newsfeed-v0/eventMeta';

import { AGENT_PROMPTS, agentReply, blockUnits, replyUnits, type AgentData, type AgentReply } from './agentScript';
import s from './AgentPanel.module.scss';

const STEP_MS = 650;
const TICK_MS = 35;
const WORDS_PER_TICK = 2;

type Turn =
  | { id: number; role: 'user'; text: string }
  | {
      id: number;
      role: 'agent';
      reply: AgentReply;
      /** Steps shown so far while working; then the blocks stream. */
      step: number;
      units: number;
      done: boolean;
      stopped?: boolean;
      startedAt: number;
      endedAt?: number;
    };

/**
 * The member's agent, docked on the right of the signed-in app (home-v2-b, 2026-11-02), as Linear's agent
 * is: opened from the sidebar (or Ctrl/⌘ J), it reads the page it was opened on and can act for the
 * member. It shows the steps it took, streams its answer with the things it found as rows you can open,
 * and proposes changes (follow these teams) that happen only when the member presses them.
 *
 * From 1600px it pushes the page; between 960 and 1600 it overlays the page's right edge; on phones it
 * is a full-screen sheet. Replies are scripted from the page's mocks (agentScript.ts).
 */
export function AgentPanel({
  open,
  onClose,
  data,
  onOpenStory,
  onFollowTeams,
}: {
  open: boolean;
  onClose: () => void;
  data: AgentData;
  onOpenStory: (story: ITeamNewsItem) => void;
  /** Applies (or, with `undo`, reverts) a follow proposal. */
  onFollowTeams: (teamUids: string[], undo?: boolean) => void;
}) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [resolved, setResolved] = useState<Record<number, 'applied' | 'dismissed'>>({});
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState<number | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const nextId = useRef(1);

  const working = turns.find((t): t is Extract<Turn, { role: 'agent' }> => t.role === 'agent' && !t.done);

  /* SidebarNav's fit: the prototype banner pushes the sticky column down until it scrolls away. */
  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel || !open) return;
    const fit = () =>
      panel.style.setProperty(
        '--agent-h',
        `${window.innerHeight - Math.max(0, panel.getBoundingClientRect().top)}px`,
      );
    fit();
    document.addEventListener('scroll', fit, { capture: true, passive: true });
    window.addEventListener('resize', fit);
    return () => {
      document.removeEventListener('scroll', fit, { capture: true });
      window.removeEventListener('resize', fit);
    };
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  /* Esc closes the panel from anywhere inside it. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && panelRef.current?.contains(document.activeElement)) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  /* The working turn: one step at a time, then the answer a couple of words per tick. */
  useEffect(() => {
    if (!working) return;
    const id = working.id;
    const total = replyUnits(working.reply);
    const inSteps = working.step < working.reply.steps.length;
    const timer = window.setTimeout(
      () =>
        setTurns((prev) =>
          prev.map((t) => {
            if (t.id !== id || t.role !== 'agent') return t;
            if (t.step < t.reply.steps.length) return { ...t, step: t.step + 1 };
            const units = Math.min(total, t.units + WORDS_PER_TICK);
            return units >= total ? { ...t, units, done: true, endedAt: Date.now() } : { ...t, units };
          }),
        ),
      inSteps ? STEP_MS : TICK_MS,
    );
    return () => window.clearTimeout(timer);
  }, [working]);

  /* Keep the newest words in view while they arrive. */
  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns]);

  const send = (raw: string) => {
    const text = raw.trim();
    if (!text || working) return;
    const userId = nextId.current++;
    const agentId = nextId.current++;
    setTurns((prev) => [
      ...prev,
      { id: userId, role: 'user', text },
      {
        id: agentId,
        role: 'agent',
        reply: agentReply(text, data),
        step: 0,
        units: 0,
        done: false,
        startedAt: Date.now(),
      },
    ]);
    if (inputRef.current) inputRef.current.value = '';
  };

  const stop = () =>
    setTurns((prev) =>
      prev.map((t) => (t.role === 'agent' && !t.done ? { ...t, done: true, stopped: true, endedAt: Date.now() } : t)),
    );

  const newChat = () => {
    setTurns([]);
    setResolved({});
    setExpanded(new Set());
    inputRef.current?.focus();
  };

  const renderAgent = (t: Extract<Turn, { role: 'agent' }>) => {
    const stepping = t.step < t.reply.steps.length && !t.done;
    const showSteps = stepping || expanded.has(t.id);
    const seconds = Math.max(1, Math.round(((t.endedAt ?? Date.now()) - t.startedAt) / 1000));
    let budget = t.done && !t.stopped ? Infinity : t.units;

    return (
      <div key={t.id} className={s.agentTurn}>
        {stepping ? (
          <div className={s.workingLine}>
            <span className={s.spinner} aria-hidden />
            Working
          </div>
        ) : (
          <button
            type="button"
            className={s.workedToggle}
            aria-expanded={showSteps}
            onClick={() =>
              setExpanded((prev) => {
                const next = new Set(prev);
                if (next.has(t.id)) next.delete(t.id);
                else next.add(t.id);
                return next;
              })
            }
          >
            Worked for {seconds}s · {t.reply.steps.length} {t.reply.steps.length === 1 ? 'step' : 'steps'}
            <svg viewBox="0 0 16 16" fill="none" aria-hidden className={s.caret}>
              <path
                d={showSteps ? 'M4 10l4-4 4 4' : 'M4 6l4 4 4-4'}
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
        {showSteps && (
          <ol className={s.steps}>
            {t.reply.steps.slice(0, t.done ? undefined : t.step + 1).map((label, i) => {
              const active = !t.done && i === t.step;
              return (
                <li key={label} className={clsx(s.step, active && s.stepActive)}>
                  {active ? (
                    <span className={s.stepSpinner} aria-hidden />
                  ) : (
                    <svg viewBox="0 0 16 16" fill="none" aria-hidden className={s.stepCheck}>
                      <path
                        d="M3.5 8.5l3 3 6-7"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                  {label}
                </li>
              );
            })}
          </ol>
        )}

        {!stepping &&
          t.reply.blocks.map((b, i) => {
            if (budget <= 0) return null;
            const cost = blockUnits(b);
            const shown = Math.min(cost, budget);
            budget -= cost;
            const key = `${t.id}-${i}`;

            switch (b.kind) {
              case 'text':
                return (
                  <p key={key} className={s.text}>
                    {b.text.split(' ').slice(0, shown).join(' ')}
                  </p>
                );
              case 'stories':
                return (
                  <ul key={key} className={s.refs}>
                    {b.items.map((n) => (
                      <li key={n.uid}>
                        <button type="button" className={s.ref} onClick={() => onOpenStory(n)}>
                          {n.teamLogoUrl ? (
                            <img src={n.teamLogoUrl} alt="" className={s.refLogo} />
                          ) : (
                            <span className={s.refLogo} />
                          )}
                          <span className={s.refText}>
                            <span className={s.refTitle}>{n.title}</span>
                            <span className={s.refMeta}>
                              {n.teamName} · {EVENT_TYPE_LABEL[n.eventType]} · {data.likeCount(n.uid)} likes
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                );
              case 'teams':
                return (
                  <ul key={key} className={s.refs}>
                    {b.items.map((team) => (
                      <li key={team.uid}>
                        <a href={`/teams/${team.uid}`} className={s.ref}>
                          {team.logo ? <img src={team.logo} alt="" className={s.refLogo} /> : <span className={s.refLogo} />}
                          <span className={s.refText}>
                            <span className={s.refTitle}>{team.name}</span>
                            <span className={s.refMeta}>
                              {data.followed.has(team.uid) ? 'Following' : team.reason}
                            </span>
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                );
              case 'roles':
                return (
                  <div key={key}>
                    <ul className={s.refs}>
                      {b.items.map((job) => (
                        <li key={`${job.teamUid}-${job.title}`}>
                          <a href="/prototypes/job-board" className={s.ref}>
                            {job.teamLogoUrl ? (
                              <img src={job.teamLogoUrl} alt="" className={s.refLogo} />
                            ) : (
                              <span className={s.refLogo} />
                            )}
                            <span className={s.refText}>
                              <span className={s.refTitle}>{job.title}</span>
                              <span className={s.refMeta}>
                                {job.teamName} · {job.location}
                              </span>
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                    <a href="/prototypes/job-board" className={s.moreLink}>
                      See all {b.total} open roles
                    </a>
                  </div>
                );
              case 'draft':
                return (
                  <div key={key} className={s.draft}>
                    <div className={s.draftBody}>
                      <strong className={s.draftTitle}>{b.title}</strong>
                      <p className={s.draftText}>{b.body}</p>
                    </div>
                    <div className={s.actions}>
                      <Button size="xs" style="fill" variant="primary" onClick={() => window.open('/forum', '_blank')}>
                        Open in forum
                      </Button>
                      <Button
                        size="xs"
                        style="border"
                        variant="neutral"
                        onClick={() => {
                          void navigator.clipboard?.writeText(`${b.title}\n\n${b.body}`);
                          setCopied(t.id);
                        }}
                      >
                        {copied === t.id ? 'Copied' : 'Copy'}
                      </Button>
                    </div>
                  </div>
                );
              case 'proposal': {
                const state = resolved[t.id];
                if (state === 'dismissed') return null;
                if (state === 'applied')
                  return (
                    <div key={key} className={s.receipt}>
                      <svg viewBox="0 0 16 16" fill="none" aria-hidden className={s.stepCheck}>
                        <path
                          d="M3.5 8.5l3 3 6-7"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span>Followed. For You now includes their updates.</span>
                      <button
                        type="button"
                        className={s.undo}
                        onClick={() => {
                          onFollowTeams(b.teamUids, true);
                          setResolved((r) => {
                            const next = { ...r };
                            delete next[t.id];
                            return next;
                          });
                        }}
                      >
                        Undo
                      </button>
                    </div>
                  );
                return (
                  <div key={key} className={s.proposal}>
                    <span className={s.proposalTitle}>{b.title}</span>
                    <div className={s.actions}>
                      <Button
                        size="xs"
                        style="fill"
                        variant="primary"
                        onClick={() => {
                          onFollowTeams(b.teamUids);
                          setResolved((r) => ({ ...r, [t.id]: 'applied' }));
                        }}
                      >
                        {b.confirmLabel}
                      </Button>
                      <Button
                        size="xs"
                        style="border"
                        variant="neutral"
                        onClick={() => setResolved((r) => ({ ...r, [t.id]: 'dismissed' }))}
                      >
                        Not now
                      </Button>
                    </div>
                  </div>
                );
              }
              case 'suggest':
                return (
                  <div key={key} className={s.followUps}>
                    {b.prompts.map((p) => (
                      <button key={p} type="button" className={s.followUp} onClick={() => send(p)}>
                        {p}
                      </button>
                    ))}
                  </div>
                );
            }
          })}
        {t.stopped && <p className={s.stopped}>Stopped</p>}
      </div>
    );
  };

  if (!open) return null;

  return (
    <aside ref={panelRef} className={s.panel} aria-label="Agent">
      <header className={s.head}>
        <span className={s.headTitle}>
          <AiSearchIcon size={18} />
          Agent
        </span>
        <span className={s.headActions}>
          {turns.length > 0 && (
            <button type="button" className={s.iconBtn} onClick={newChat} aria-label="New chat" title="New chat">
              <svg viewBox="0 0 16 16" fill="none" aria-hidden>
                <path
                  d="M8 3H4a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V8M11.5 2.5l2 2L8 10H6V8l5.5-5.5Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </button>
          )}
          <button type="button" className={s.iconBtn} onClick={onClose} aria-label="Close agent" title="Close (Esc)">
            <CloseIcon />
          </button>
        </span>
      </header>

      <div ref={threadRef} className={s.thread}>
        {turns.length === 0 ? (
          <div className={s.empty}>
            <h2 className={s.hello}>Hi Polina, what can I do for you?</h2>
            <p className={s.helloSub}>I read the Directory with you and can act on it. I ask before changing anything.</p>
            <ul className={s.prompts}>
              {AGENT_PROMPTS.map((p) => (
                <li key={p}>
                  <button type="button" className={s.prompt} onClick={() => send(p)}>
                    {p}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          turns.map((t) =>
            t.role === 'user' ? (
              <div key={t.id} className={s.userTurn}>
                {t.text}
              </div>
            ) : (
              renderAgent(t)
            ),
          )
        )}
      </div>

      <div className={s.foot}>
        <span className={s.context} title="The agent reads the page you opened it on">
          <HomeIcon size={14} />
          Home
        </span>
        <Composer
          ref={inputRef}
          className={s.composer}
          rows={1}
          placeholder="Ask the agent or tell it what to do"
          aria-label="Message the agent"
          onTextSubmit={() => send(inputRef.current?.value ?? '')}
          onStopStreaming={stop}
          isLoadingObject={!!working}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send(e.currentTarget.value);
            }
          }}
        />
      </div>
    </aside>
  );
}
