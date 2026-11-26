import type {
  LabosAgentCardState,
  LabosAgentDraft,
  LabosAgentDraftCardState,
  LabosAgentProposal,
  LabosAgentStoredDraft,
  LabosAgentStoredProposal,
  LabosAgentThread,
  LabosAgentThreadTurn,
  LabosAgentTurn,
} from '@/types/labos-agent.types';

/*
 * LAB-3457: a saved thread (T2) as chat turns, so the panel's turn and cards draw it. A turn arrives finished: no
 * stream, no duration. Cards that are still open keep their buttons (an `open` draft goes to C5, an `open` proposal
 * goes to C2 until `expiresAt`); finished cards show their result with no buttons. An old AI search turn has no
 * steps and no cards.
 */

/** Before any `Date.now()`: an `expired` proposal is past its `expiresAt` whatever the clock says. */
const LONG_AGO = '1970-01-01T00:00:00.000Z';

export const SAVED_CHANGE_FAILED_MESSAGE = 'This change was not saved.';

function toProposal({ status, summary: _summary, ...proposal }: LabosAgentStoredProposal): LabosAgentProposal {
  return status === 'expired' ? { ...proposal, expiresAt: LONG_AGO } : proposal;
}

function toCard({ status, summary }: LabosAgentStoredProposal): LabosAgentCardState | null {
  switch (status) {
    case 'done':
      return { status: 'done', ...(summary ? { summary } : {}) };
    case 'cancelled':
      return { status: 'cancelled' };
    case 'failed':
      return { status: 'error', message: SAVED_CHANGE_FAILED_MESSAGE, canRetry: false };
    default:
      // `open`: Confirm and Cancel, until `expiresAt`. `expired`: the card's own expired text.
      return null;
  }
}

function toDraft({ status: _s, introRequestUid: _i, sentAt: _t, ...draft }: LabosAgentStoredDraft): LabosAgentDraft {
  return draft;
}

function toDraftCard({ status, text }: LabosAgentStoredDraft): LabosAgentDraftCardState | null {
  return status === 'open' ? null : { status, text };
}

const time = (iso: string | null) => {
  const at = iso ? Date.parse(iso) : NaN;
  return Number.isFinite(at) ? at : 0;
};

export function toChatTurn(turn: LabosAgentThreadTurn, threadId: string): LabosAgentTurn {
  const base: LabosAgentTurn = {
    id: turn.chatId,
    message: turn.question,
    status: 'done',
    steps: [],
    content: turn.content,
    sources: turn.sources,
    sourceRefs: turn.sourceRefs,
    followUpQuestions: turn.followUpQuestions,
    proposals: [],
    cards: {},
    drafts: [],
    draftCards: {},
    savedIn: threadId,
    restored: true,
    startedAt: time(turn.createdAt),
  };
  if (turn.kind !== 'agent') return base;
  const cards: Record<string, LabosAgentCardState> = {};
  turn.proposals.forEach((p) => {
    const card = toCard(p);
    if (card) cards[p.proposalId] = card;
  });
  const draftCards: Record<string, LabosAgentDraftCardState> = {};
  turn.drafts.forEach((d) => {
    const card = toDraftCard(d);
    if (card) draftCards[d.draftId] = card;
  });
  return {
    ...base,
    steps: turn.steps,
    proposals: turn.proposals.map(toProposal),
    cards,
    drafts: turn.drafts.map(toDraft),
    draftCards,
  };
}

export const toChatTurns = (thread: LabosAgentThread): LabosAgentTurn[] =>
  thread.turns.map((turn) => toChatTurn(turn, thread.threadId));

/** The intro drafts of the thread that went out: their targets count as requested in this page visit. */
export const sentDrafts = (thread: LabosAgentThread): LabosAgentStoredDraft[] =>
  thread.turns.flatMap((turn) => (turn.kind === 'agent' ? turn.drafts.filter((d) => d.status === 'sent') : []));
