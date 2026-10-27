'use client';

import { useState } from 'react';
import { clsx } from 'clsx';

import { Button } from '@/components/common/Button/Button';
// The settings section frame, reused for the request card (same as the consent screen).
import tabCss from '@/components/page/connected-accounts/ConnectedAccounts.module.scss';

import { ClientLogo, clientKeyFromName } from './ClientLogo';
import {
  type AccessRequest,
  type Agent,
  SCOPES,
  type Viewer,
  agentName,
  getWriteLock,
  mockRequests,
  requestUrl,
} from './mocks';
import { Acknowledge } from './Permissions';
import { BackendTag } from './shared';
import s from './McpSectionMock.module.scss';

/**
 * Asking for more access, in two steps the member sees:
 *
 * 1. In the agent: LabOS refused a write, and the agent says so in one line
 *    with a link (or, for a feature admins switched off, says it can't).
 * 2. In LabOS: a page about that one feature. What write means there, the
 *    same checkbox as the Settings write consent, Allow or Not now.
 *
 * The agent never grants itself anything; approval only happens here, signed in.
 */
export function AccessRequestView({
  agents,
  viewer,
  onAllow,
  onDecline,
}: {
  agents: Agent[];
  viewer: Viewer;
  onAllow: (request: AccessRequest) => void;
  onDecline: () => void;
}) {
  const [requestId, setRequestId] = useState(mockRequests[0].id);
  const request = mockRequests.find((item) => item.id === requestId)!;
  const agent = agents.find((item) => item.uid === request.agentUid);
  if (!agent) return null;

  const scope = SCOPES.find((item) => item.key === request.scope)!;
  const lock = getWriteLock(request.scope, viewer);
  const name = agentName(agent);

  return (
    <div className={s.consentPage}>
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
                onClick={() => setRequestId(item.id)}
              >
                {who?.clientName}: {SCOPES.find((sc) => sc.key === item.scope)?.name}
              </button>
            );
          })}
        </div>

        {/* Step 1: what the agent says, in the agent. */}
        <div className={s.agentReply}>
          <div className={s.agentReplyHead}>
            {/* A white tile, so OpenAI's black mark reads on the dark terminal. */}
            <span className={s.agentReplyMark} aria-hidden>
              <ClientLogo client={clientKeyFromName(agent.clientName)} size={14} />
            </span>
            <span>In {agent.clientName}</span>
            <BackendTag>Needs a “needs write” error with a request link from the MCP server</BackendTag>
          </div>
          {lock ? (
            <p className={s.agentReplyText}>
              I can’t {request.ask} in LabOS. {lock.reason}
              {lock.by === 'admin' ? ' LabOS admins have turned it off.' : ''}
            </p>
          ) : (
            <p className={s.agentReplyText}>
              I couldn’t do that: {agent.clientName} can only read the {scope.name} in LabOS. To let me {request.ask},
              allow it here: <span className={s.agentReplyLink}>{requestUrl(request.id)}</span>
            </p>
          )}
        </div>

        {/* Step 2: the LabOS page the link opens. */}
        {lock ? (
          <p className={s.requestNone}>
            No request page: a feature that is switched off has nothing to approve, so the agent gets no link.
          </p>
        ) : (
          <RequestCard
            key={request.id}
            name={name}
            clientName={agent.clientName}
            tried={request.tried}
            ask={request.ask}
            scopeName={scope.name}
            write={scope.write ?? ''}
            onAllow={() => onAllow(request)}
            onDecline={onDecline}
          />
        )}
      </div>
    </div>
  );
}

function RequestCard({
  name,
  clientName,
  tried,
  ask,
  scopeName,
  write,
  onAllow,
  onDecline,
}: {
  name: string;
  clientName: string;
  tried: string;
  ask: string;
  scopeName: string;
  write: string;
  onAllow: () => void;
  onDecline: () => void;
}) {
  const [checked, setChecked] = useState(false);

  return (
    <div className={clsx(tabCss.card, s.consentCard)}>
      <div className={s.consentHead}>
        {/* Production's one-line wordmark (the digest email logo), not the stacked app logo. */}
        <img
          src="/images/email/digest-logo-protocol-labs.png"
          width={130}
          height={32}
          alt="Protocol Labs"
          className={s.consentLogo}
        />
        <div className={s.consentTitleRow}>
          <span className={s.agentMark} aria-hidden>
            <ClientLogo client={clientKeyFromName(clientName)} size={18} />
          </span>
          <h2 className={s.consentTitle}>
            Let {name} {ask}?
          </h2>
        </div>
      </div>
      <div className={s.consentBody}>
        <div className={s.consentSection}>
          <span className={s.label}>It tried to</span>
          <p className={s.help}>{tried}.</p>
        </div>
        <div className={s.consentSection}>
          <span className={s.label}>{scopeName}: read and write</span>
          <p className={s.help}>
            {name} can {write} Other members will see it as yours. Only {scopeName} changes; everything else stays as it
            is.
          </p>
        </div>
        <div className={s.consentNotice}>
          <Acknowledge checked={checked} onChange={setChecked}>
            I understand {name} can do this as me.
          </Acknowledge>
        </div>
      </div>
      <div className={s.consentFoot}>
        <Button size="m" variant="neutral" style="border" className={s.btn} onClick={onDecline}>
          Not now
        </Button>
        <Button size="m" variant="primary" className={s.btn} disabled={!checked} onClick={onAllow}>
          Allow
        </Button>
      </div>
    </div>
  );
}
