import { useCallback } from 'react';
import { usePostHog } from 'posthog-js/react';

import { useCurrentUserStore } from '@/services/auth/store';
import { useLabosAgentStore } from '@/services/labos-agent/store';
import type {
  LabosAgentEntryPoint,
  LabosAgentOpenContext,
  LabosAgentProposalTool,
  LabosAgentSession,
} from '@/types/labos-agent.types';
import { LABOS_AGENT_ANALYTICS_EVENTS } from '@/utils/constants';

/**
 * LabOS agent v0 events (LAB-3297, Dana's S0 spec with the v0 addendum). Every property is a length, a count, a
 * boolean or an enum. Never add message text, draft text, names, emails, or IDs of members, teams or news (V0-R5).
 * `loggedInUserUid` comes from the capture helper, as in `intro-requests.analytics.ts`.
 */

export type LabosAgentFlow = 'news' | 'profile' | 'team' | 'intro' | 'job' | 'other';
export type LabosAgentPageType = 'news' | 'member' | 'team' | 'job' | 'profile' | 'other';
/** `job-draft` and `gap-fix` wait for S4 and later slices; v0 sends the other four. */
export type LabosAgentActionType =
  | 'profile-field'
  | 'experience'
  | 'team-field'
  | 'intro-draft'
  | 'job-draft'
  | 'gap-fix';
export type LabosAgentErrorType = 'timeout' | 'model-error' | 'http-4xx' | 'http-5xx' | 'network';
export type LabosAgentSourceType = 'labos' | 'web';

/** The shared properties of every `agent-*` event. */
export interface LabosAgentSharedProps {
  flow: LabosAgentFlow;
  entryPoint: LabosAgentEntryPoint;
  pageType: LabosAgentPageType;
  conversationId: string;
}

/** The flow of a context. Member pages and Home have no v0 flow. */
export function agentFlow(context: LabosAgentOpenContext | null): LabosAgentFlow {
  switch (context?.page) {
    case 'news-story':
      return 'news';
    case 'intro':
      return 'intro';
    case 'team':
      return 'team';
    case 'job':
      return 'job';
    case 'profile':
      return 'profile';
    default:
      return 'other';
  }
}

/** The type of the page under the panel. An intro opens on the page of its target. */
export function agentPageType(context: LabosAgentOpenContext | null): LabosAgentPageType {
  switch (context?.page) {
    case 'news-story':
      return 'news';
    case 'intro':
      return context.introTarget.type;
    case 'member':
    case 'team':
    case 'job':
    case 'profile':
      return context.page;
    default:
      return 'other';
  }
}

const ACTION_TYPES: Record<LabosAgentProposalTool, LabosAgentActionType> = {
  update_my_profile: 'profile-field',
  add_experience: 'experience',
  update_experience: 'experience',
  update_team: 'team-field',
};

/** The `actionType` of an S2 proposal tool. */
export const agentActionType = (tool: LabosAgentProposalTool): LabosAgentActionType => ACTION_TYPES[tool];

/**
 * The `errorType` of a failed answer. A stall is a `timeout`. No HTTP response, or a stream that broke after it
 * started, is `network`. Any other failure with a 2xx status is a `model-error`.
 */
export function agentErrorType(input: { status: number; code?: string; stalled?: boolean }): LabosAgentErrorType {
  if (input.stalled) return 'timeout';
  if (input.status >= 500) return 'http-5xx';
  if (input.status >= 400) return 'http-4xx';
  if (input.status === 0 || input.code === 'STREAM_FAILED') return 'network';
  return 'model-error';
}

/** The shared properties from a session and the context of the chat. No session: an empty `conversationId`. */
export function agentSharedProps(
  session: LabosAgentSession | null,
  context: LabosAgentOpenContext | null,
): LabosAgentSharedProps {
  return {
    flow: agentFlow(context),
    entryPoint: session?.entryPoint ?? 'corner',
    pageType: agentPageType(context),
    conversationId: session?.conversationId ?? '',
  };
}

/** The `conversationId` of the current dock session, for the intro events with `source: 'agent'` (V0-R2). */
export const currentConversationId = () => useLabosAgentStore.getState().session?.conversationId;

export interface AgentMessageSentProps {
  messageLength: number;
  turnIndex: number;
  isRetry: boolean;
  contextAttached: boolean;
  mentionCount: number;
}

export interface AgentAnswerShownProps {
  turnIndex: number;
  latencyMs: number;
  answerLength: number;
  sourceCount: number;
  /** V0-R4: only when C1 sends it. */
  usedWebSearch?: boolean;
  /** V0-R4: only when C1 sends it. */
  toolCount?: number;
}

export interface AgentAnswerFailedProps {
  turnIndex: number;
  errorType: LabosAgentErrorType;
  status: number;
}

export interface AgentSourceClickedProps {
  sourceType: LabosAgentSourceType;
  position: number;
}

export interface AgentActionProposedProps {
  actionType: LabosAgentActionType;
  fieldCount: number;
  draftLength: number;
}

export interface AgentActionConfirmedProps extends AgentActionProposedProps {
  edited: boolean;
}

export interface AgentActionCancelledProps {
  actionType: LabosAgentActionType;
  edited: boolean;
}

export interface AgentActionFailedProps {
  actionType: LabosAgentActionType;
  status: number;
}

export interface AgentDockClosedProps {
  turnCount: number;
  actionCount: number;
  confirmedCount: number;
  openMs: number;
}

/**
 * The agent event handlers. Each handler takes the context of the chat and reads the dock session from the store, so
 * all events of one session carry one `conversationId`. A failed capture logs and never breaks the panel.
 */
export function useLabosAgentAnalytics() {
  const posthog = usePostHog();

  const capture = useCallback(
    (event: string, context: LabosAgentOpenContext | null, properties: object, session?: LabosAgentSession | null) => {
      try {
        if (!posthog?.capture) return;
        const shared = agentSharedProps(session ?? useLabosAgentStore.getState().session, context);
        const userInfo = useCurrentUserStore.getState().currentUser;
        posthog.capture(event, { ...shared, ...properties, loggedInUserUid: userInfo?.uid });
      } catch (error) {
        console.error(error);
      }
    },
    [posthog],
  );

  /** `agent-dock-opened`: the panel shows. The session holds the context of the open. */
  const onDockOpened = useCallback(
    (session: LabosAgentSession) =>
      capture(
        LABOS_AGENT_ANALYTICS_EVENTS.DOCK_OPENED,
        session.context,
        { contextAttached: session.contextAttached },
        session,
      ),
    [capture],
  );

  /** `agent-dock-closed`: the panel closes, or a new context replaces the session. */
  const onDockClosed = useCallback(
    (session: LabosAgentSession, props: AgentDockClosedProps) =>
      capture(LABOS_AGENT_ANALYTICS_EVENTS.DOCK_CLOSED, session.context, { ...props }, session),
    [capture],
  );

  const onMessageSent = useCallback(
    (context: LabosAgentOpenContext | null, props: AgentMessageSentProps) =>
      capture(LABOS_AGENT_ANALYTICS_EVENTS.MESSAGE_SENT, context, { ...props }),
    [capture],
  );

  const onAnswerShown = useCallback(
    (context: LabosAgentOpenContext | null, props: AgentAnswerShownProps) =>
      capture(LABOS_AGENT_ANALYTICS_EVENTS.ANSWER_SHOWN, context, { ...props }),
    [capture],
  );

  const onAnswerFailed = useCallback(
    (context: LabosAgentOpenContext | null, props: AgentAnswerFailedProps) =>
      capture(LABOS_AGENT_ANALYTICS_EVENTS.ANSWER_FAILED, context, { ...props }),
    [capture],
  );

  const onSourceClicked = useCallback(
    (context: LabosAgentOpenContext | null, props: AgentSourceClickedProps) =>
      capture(LABOS_AGENT_ANALYTICS_EVENTS.SOURCE_CLICKED, context, { ...props }),
    [capture],
  );

  const onActionProposed = useCallback(
    (context: LabosAgentOpenContext | null, props: AgentActionProposedProps) =>
      capture(LABOS_AGENT_ANALYTICS_EVENTS.ACTION_PROPOSED, context, { ...props }),
    [capture],
  );

  const onActionConfirmed = useCallback(
    (context: LabosAgentOpenContext | null, props: AgentActionConfirmedProps) =>
      capture(LABOS_AGENT_ANALYTICS_EVENTS.ACTION_CONFIRMED, context, { ...props }),
    [capture],
  );

  const onActionCancelled = useCallback(
    (context: LabosAgentOpenContext | null, props: AgentActionCancelledProps, session?: LabosAgentSession) =>
      capture(LABOS_AGENT_ANALYTICS_EVENTS.ACTION_CANCELLED, context, { ...props }, session),
    [capture],
  );

  const onActionFailed = useCallback(
    (context: LabosAgentOpenContext | null, props: AgentActionFailedProps) =>
      capture(LABOS_AGENT_ANALYTICS_EVENTS.ACTION_FAILED, context, { ...props }),
    [capture],
  );

  return {
    onDockOpened,
    onDockClosed,
    onMessageSent,
    onAnswerShown,
    onAnswerFailed,
    onSourceClicked,
    onActionProposed,
    onActionConfirmed,
    onActionCancelled,
    onActionFailed,
  };
}
