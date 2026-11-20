'use client';

/**
 * LAB-3272: the LabOS agent's script and cards for one job application (v0).
 *
 * The panel, steps, streaming and composer are home-v2-b's AgentPanel (imported). The card frames, fields,
 * receipts and old → new rows are AgentV0's styles (imported). This file only holds the script and the four
 * cards the flow acts through: the offer, the draft, the profile gaps and the profile changes.
 *
 * Mocked: replies are scripted, no model and no network. "Profile tools" stand for the MCP profile tools;
 * Apply only flips the card to its receipt.
 */

import clsx from 'clsx';
import Link from 'next/link';
import { useState, useSyncExternalStore, type ReactNode } from 'react';

import { Button } from '@/components/common/Button';
import { Checkbox } from '@/components/common/Checkbox';
import btn from '@/components/common/Button/Button.module.scss';

import type { AgentBlock, AgentBlockContext, AgentPrompt, AgentReply } from '../home-v2-b/agentScript';
import agentCss from '../home-v2-b/AgentPanel.module.scss';
import v0 from '../home-v2-agent-dock/AgentV0.module.scss';

import {
  MOCK_MEMBER,
  MOCK_RESUME_FILE,
  PROFILE_GAPS,
  RESUME_CHANGES,
  firstDraft,
  gapFilledDraft,
  shorterDraft,
  type ApplyRole,
} from './mocks';
import s from './LabAgentJobApply.module.scss';

/* ---------- Which draft is current ---------- */

/** One number per panel: the newest draft. An older card in the thread folds to a read-only quote. */
function createLatestStore() {
  let latest = 0;
  const subs = new Set<() => void>();
  return {
    get: () => latest,
    set: (n: number) => {
      latest = n;
      subs.forEach((f) => f());
    },
    subscribe: (f: () => void) => {
      subs.add(f);
      return () => subs.delete(f);
    },
  };
}
type LatestStore = ReturnType<typeof createLatestStore>;

/* ---------- Script ---------- */

export type DraftStatus = 'draft' | 'sent' | 'copied';

export type ApplyHooks = {
  /** The application left LabOS. The page then shows Applied. */
  onSent: () => void;
  /** The member leaves the agent for the existing apply flow. */
  onWriteMyself: () => void;
};

export const EDIT_PROMPT = 'Make it shorter and mention my Rust work';
export const DRAFT_PROMPT = 'Draft my application';
export const GAP_PROMPT = `Fill the gaps from ${MOCK_RESUME_FILE}`;
const UPDATE_PROMPT = 'Update the draft with my new profile';
const FORMAL_PROMPT = 'Make it more formal';

export const applyPrompt = (a: ApplyRole) => `Apply to ${a.role.roleTitle} at ${a.team.name}`;

const custom = (render: (ctx: AgentBlockContext) => ReactNode): AgentBlock => ({ kind: 'custom', render });
const suggest = (texts: string[]): AgentBlock => ({
  kind: 'suggest',
  prompts: texts.map((text): AgentPrompt => ({ text, topic: 'job' })),
});

/**
 * The script for one application. `settled` marks a seeded turn that a later turn already answered, so its
 * card shows what was chosen rather than live buttons. `lastStatus` seeds the newest draft (sent or copied).
 */
export function createApplyScript(a: ApplyRole, hooks: ApplyHooks) {
  const latest = createLatestStore();
  let version = 0;
  let hasDraft = false;

  const draftReply = (lead: string, body: string, steps: string[], status: DraftStatus, extra: AgentBlock[] = []) => {
    version += 1;
    const v = version;
    latest.set(v);
    hasDraft = true;
    return {
      steps,
      blocks: [
        { kind: 'text', text: lead },
        custom(() => <DraftCard a={a} version={v} body={body} latest={latest} initialStatus={status} hooks={hooks} />),
        ...extra,
      ],
    } satisfies AgentReply;
  };

  function reply(
    raw: string,
    opts: { settled?: boolean; gapUploaded?: boolean; lastStatus?: DraftStatus } = {},
  ): AgentReply {
    const text = raw.trim();
    const settled = !!opts.settled;
    const status = opts.lastStatus ?? 'draft';

    if (/^apply to/i.test(text)) {
      return {
        steps: ['Read the job post', 'Read your profile'],
        blocks: [custom((ctx) => <OfferCard a={a} ctx={ctx} settled={settled} onWriteMyself={hooks.onWriteMyself} />)],
      };
    }

    if (/draft my application/i.test(text)) {
      return draftReply(
        'Here’s a draft. Edit it in the card, or tell me what to change.',
        firstDraft(a),
        ['Read the job post', 'Read your profile', 'Compared the post with your profile', 'Wrote the draft'],
        status,
        [custom((ctx) => <GapCard ctx={ctx} settled={!!opts.gapUploaded} />), suggest([EDIT_PROMPT, FORMAL_PROMPT])],
      );
    }

    if (/fill the gaps|resume/i.test(text)) {
      return {
        steps: [`Read ${MOCK_RESUME_FILE}`, 'Read your profile', 'Compared them field by field'],
        blocks: [
          { kind: 'text', text: `Your resume can fill ${RESUME_CHANGES.length} fields on your profile:` },
          custom(() => <ProfileChangesCard />),
          suggest([UPDATE_PROMPT]),
        ],
      };
    }

    if (/update the draft|new profile/i.test(text)) {
      return draftReply(
        'The draft now names Northwind Labs and links your GitHub:',
        gapFilledDraft(a),
        ['Read your updated profile', 'Rewrote the draft'],
        status,
      );
    }

    if (hasDraft && /formal/i.test(text)) {
      return draftReply(
        'A more formal version:',
        firstDraft(a)
          .replace(`Hi ${a.team.name} team,`, `Dear ${a.team.name} hiring team,`)
          .replace('Sam Rivera', 'Kind regards,\nSam Rivera'),
        ['Rewrote the draft'],
        status,
      );
    }

    if (hasDraft && text.length > 0) {
      return draftReply(
        'Shorter, with your Rust work in the second paragraph:',
        shorterDraft(a),
        ['Read your Rust project on your profile', 'Rewrote the draft'],
        status,
      );
    }

    return {
      steps: ['Read your request'],
      blocks: [{ kind: 'text', text: 'I can draft this application with you. Try:' }, suggest([DRAFT_PROMPT])],
    };
  }

  return reply;
}

/* ---------- Cards ---------- */

function Check() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden className={agentCss.stepCheck}>
      <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** The offer that answers Apply. One primary: the draft. The way out is the existing apply flow. */
function OfferCard({
  a,
  ctx,
  settled,
  onWriteMyself,
}: {
  a: ApplyRole;
  ctx: AgentBlockContext;
  settled: boolean;
  onWriteMyself: () => void;
}) {
  const [chosen, setChosen] = useState(settled);
  return (
    <div className={v0.card}>
      <div className={v0.cardHead}>
        <span className={v0.recipient}>Draft your application?</span>
        <span className={v0.source}>
          {a.role.roleTitle} · {a.team.name}
        </span>
      </div>
      <p className={v0.note}>I’ll write it from the job post and your profile. Nothing is sent until you send it.</p>
      {!chosen && (
        <div className={clsx(agentCss.actions, s.cardActions)}>
          <Button
            size="xs"
            style="fill"
            variant="primary"
            disabled={ctx.busy}
            onClick={() => {
              setChosen(true);
              ctx.send(DRAFT_PROMPT);
            }}
          >
            Draft my application
          </Button>
          <Button size="xs" style="border" variant="neutral" onClick={onWriteMyself}>
            Write it myself
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * The application. Editable in place; the composer below edits it by asking. The newest draft is live; an
 * older one folds to a quote, so the thread keeps the history without two Send buttons.
 */
function DraftCard({
  a,
  version,
  body,
  latest,
  initialStatus,
  hooks,
}: {
  a: ApplyRole;
  version: number;
  body: string;
  latest: LatestStore;
  initialStatus: DraftStatus;
  hooks: ApplyHooks;
}) {
  const current = useSyncExternalStore(latest.subscribe, latest.get, latest.get);
  const [text, setText] = useState(body);
  const [status, setStatus] = useState<DraftStatus>(current === version ? initialStatus : 'draft');
  const external = a.route === 'external';
  const postingHref = a.role.applyUrl ?? '#';

  if (status === 'sent')
    return (
      <div className={v0.card}>
        <p className={v0.receiptTitle}>
          <Check />
          Sent to {a.team.name}
        </p>
        <blockquote className={v0.quote}>{text}</blockquote>
        <p className={v0.note}>
          Sent with your profile. {a.team.name} will reply to {MOCK_MEMBER.email}. It is under Applied on the job board.
        </p>
      </div>
    );

  if (status === 'copied')
    return (
      <div className={v0.card}>
        <p className={v0.receiptTitle}>
          <Check />
          Copied. Paste it into {a.team.name}’s form.
        </p>
        <blockquote className={clsx(v0.quote, s.clamp)}>{text}</blockquote>
        <div className={clsx(agentCss.actions, s.cardActions)}>
          <a
            className={clsx(btn.root, btn.xs, btn.fill, btn.primary, s.linkLike)}
            href={postingHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open {a.team.name}’s site
          </a>
          <Button size="xs" style="border" variant="neutral" onClick={() => setStatus('draft')}>
            Edit again
          </Button>
        </div>
      </div>
    );

  if (current !== version)
    return (
      <div className={clsx(v0.card, s.oldDraft)}>
        <span className={v0.label}>Earlier draft</span>
        <blockquote className={clsx(v0.quote, s.clamp)}>{text}</blockquote>
      </div>
    );

  const copy = () => void navigator.clipboard?.writeText(text).catch(() => undefined);

  return (
    <div className={v0.card}>
      <div className={v0.cardHead}>
        <span className={v0.label}>{external ? 'For' : 'To'}</span>
        <span className={v0.recipient}>{external ? `${a.team.name}’s site` : a.team.name}</span>
        <span className={v0.source}>{a.role.roleTitle}</span>
      </div>
      <textarea
        className={v0.field}
        value={text}
        rows={10}
        aria-label="Your application"
        onChange={(e) => setText(e.target.value)}
      />
      <p className={v0.note}>
        {external
          ? `${a.team.name} takes applications on its own site only.`
          : `Sent with your profile. ${a.team.name} will reply to ${MOCK_MEMBER.email}.`}
      </p>
      <div className={clsx(agentCss.actions, s.cardActions)}>
        {external ? (
          <Button
            size="xs"
            style="fill"
            variant="primary"
            disabled={!text.trim()}
            onClick={() => {
              copy();
              setStatus('copied');
            }}
          >
            Copy and open their site
          </Button>
        ) : (
          <Button
            size="xs"
            style="fill"
            variant="primary"
            disabled={!text.trim()}
            onClick={() => {
              setStatus('sent');
              hooks.onSent();
            }}
          >
            Send application
          </Button>
        )}
        <Button size="xs" style="border" variant="neutral" onClick={copy}>
          Copy
        </Button>
      </div>
    </div>
  );
}

/**
 * The gaps the post asks about, as an offer (lesson 31: a plain card, the headline is the outcome, the rows
 * preview what changes). Upload hands the file to the agent, which reads it and proposes the changes.
 */
function GapCard({ ctx, settled }: { ctx: AgentBlockContext; settled: boolean }) {
  const [state, setState] = useState<'open' | 'uploaded' | 'dismissed'>(settled ? 'uploaded' : 'open');
  if (state === 'dismissed') return <p className={v0.muted}>Profile not changed.</p>;
  if (state === 'uploaded') return <p className={v0.muted}>You added {MOCK_RESUME_FILE}.</p>;
  return (
    <div className={v0.card}>
      <div className={v0.cardHead}>
        <span className={v0.recipient}>Add your resume and GitHub to your profile</span>
        <span className={v0.source}>The post asks for both, and your profile has neither.</span>
      </div>
      <ul className={v0.changes}>
        {PROFILE_GAPS.map((g) => (
          <li key={g.field} className={clsx(v0.change, s.gapRow)}>
            <span className={v0.label}>{g.field}</span>
            <span className={s.gapValue}>Not added</span>
          </li>
        ))}
      </ul>
      <div className={clsx(agentCss.actions, s.cardActions)}>
        <Button
          size="xs"
          style="fill"
          variant="primary"
          disabled={ctx.busy}
          onClick={() => {
            setState('uploaded');
            ctx.send(GAP_PROMPT);
          }}
        >
          Upload resume
        </Button>
        <Button size="xs" style="border" variant="neutral" onClick={() => setState('dismissed')}>
          Not now
        </Button>
      </div>
    </div>
  );
}

/** AgentV0's ChangesCard pattern (not exported there): each field ticked, old → new, nothing changes until Apply. */
function ProfileChangesCard() {
  const [picked, setPicked] = useState<Set<number>>(() => new Set(RESUME_CHANGES.map((_, i) => i)));
  const [state, setState] = useState<'draft' | 'applied' | 'dismissed'>('draft');
  const n = picked.size;

  if (state === 'dismissed') return <p className={v0.muted}>Profile not changed.</p>;
  if (state === 'applied')
    return (
      <div className={agentCss.receipt}>
        <Check />
        <span>
          Updated your profile.{' '}
          <Link href="/prototypes/member-profile" className={v0.inlineLink}>
            View profile
          </Link>
        </span>
        <button type="button" className={agentCss.undo} onClick={() => setState('draft')}>
          Undo
        </button>
      </div>
    );

  return (
    <div className={v0.card}>
      <div className={v0.cardHead}>
        <span className={v0.recipient}>{MOCK_MEMBER.name} · your profile</span>
        <span className={v0.source}>From {MOCK_RESUME_FILE}</span>
      </div>
      <ul className={v0.changes}>
        {RESUME_CHANGES.map((c, i) => {
          const id = `resume-change-${i}`;
          return (
            <li key={c.field} className={clsx(v0.change, !picked.has(i) && v0.changeOff)}>
              <Checkbox
                checked={picked.has(i)}
                aria-labelledby={id}
                onChange={(on) =>
                  setPicked((prev) => {
                    const next = new Set(prev);
                    if (on) next.add(i);
                    else next.delete(i);
                    return next;
                  })
                }
              />
              <div className={v0.changeText}>
                <span id={id} className={v0.label}>
                  {c.field}
                </span>
                <span className={v0.from}>{c.from}</span>
                <span className={v0.to}>{c.to}</span>
              </div>
            </li>
          );
        })}
      </ul>
      <div className={clsx(agentCss.actions, s.cardActions)}>
        <Button size="xs" style="fill" variant="primary" disabled={n === 0} onClick={() => setState('applied')}>
          {n === RESUME_CHANGES.length && n > 1 ? `Apply all ${n}` : `Apply ${n} ${n === 1 ? 'change' : 'changes'}`}
        </Button>
        <Button size="xs" style="border" variant="neutral" onClick={() => setState('dismissed')}>
          Not now
        </Button>
      </div>
    </div>
  );
}
