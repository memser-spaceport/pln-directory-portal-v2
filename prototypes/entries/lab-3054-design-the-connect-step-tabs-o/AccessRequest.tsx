'use client';

import { clsx } from 'clsx';

import { ClientLogo, clientKeyFromName } from './ClientLogo';
import { type Agent, SCOPES, type Viewer, getWriteLock, mockRequests, requestUrl } from './mocks';
import { BackendTag } from './shared';
import s from './McpSectionMock.module.scss';

/**
 * Asking for more access, step 1: in the agent. LabOS refused a write, and the
 * agent says so in one line with a link (or, for a feature admins switched off,
 * says it can't). The link opens Settings → MCP connections with that
 * connection's Permissions drawer open and the feature already set to write
 * (2026-10-27: no separate request page). Only the member's Save grants it,
 * so the agent never grants itself anything.
 */
export function AgentRequestReply({
  agents,
  viewer,
  requestId,
  onRequestChange,
  onOpenLink,
}: {
  agents: Agent[];
  viewer: Viewer;
  requestId: string;
  onRequestChange: (id: string) => void;
  /** The link in the agent's reply: opens the drawer again (the member may have closed it). */
  onOpenLink: () => void;
}) {
  const request = mockRequests.find((item) => item.id === requestId)!;
  const agent = agents.find((item) => item.uid === request.agentUid);
  if (!agent) return null;

  const scope = SCOPES.find((item) => item.key === request.scope)!;
  const lock = getWriteLock(request.scope, viewer);

  return (
    <div className={s.requestStack}>
      <div className={s.segmented} role="radiogroup" aria-label="Request">
        {mockRequests.map((item) => {
          const who = agents.find((a) => a.uid === item.agentUid);
          return (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={requestId === item.id}
              className={clsx(s.segment, { [s.segmentActive]: requestId === item.id })}
              onClick={() => onRequestChange(item.id)}
            >
              {who?.clientName}: {SCOPES.find((sc) => sc.key === item.scope)?.name}
            </button>
          );
        })}
      </div>

      <div className={s.agentReply}>
        <div className={s.agentReplyHead}>
          {/* A white tile, so OpenAI's black mark reads on the dark terminal. */}
          <span className={s.agentReplyMark} aria-hidden>
            <ClientLogo client={clientKeyFromName(agent.clientName)} size={14} />
          </span>
          <span>In {agent.clientName}</span>
          <BackendTag>Needs a “needs write” error with a settings link from the MCP server</BackendTag>
        </div>
        {lock ? (
          <p className={s.agentReplyText}>
            I can’t {request.ask} in LabOS. {lock.reason}
            {lock.by === 'admin' ? ' LabOS admins have turned it off.' : ''}
          </p>
        ) : (
          <p className={s.agentReplyText}>
            I couldn’t do that: {agent.clientName} can only read the {scope.name} in LabOS. To let me {request.ask},
            allow it here:{' '}
            <button type="button" className={s.agentReplyLink} onClick={onOpenLink}>
              {requestUrl(request.id)}
            </button>
          </p>
        )}
      </div>

      {lock ? (
        <p className={s.requestNone}>
          No link: a feature that is switched off has nothing to allow. The agent can still point to Settings → MCP
          connections, which has its own address (labos.plnetwork.io/settings/mcp).
        </p>
      ) : (
        <p className={s.requestNone}>
          The link opens Settings → MCP connections (its own address, /settings/mcp) with this connection’s permissions
          open. Click it to open them again.
        </p>
      )}
    </div>
  );
}
