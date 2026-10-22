'use client';

import { useState } from 'react';
import { clsx } from 'clsx';

import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button/Button';
import { Modal } from '@/components/common/Modal';
import { Tabs } from '@/components/common/Tabs/Tabs';
import { CopyButton } from '@/components/ui/CopyButton';
import { CloseIcon } from '@/components/icons';
// Production's MCP card frame, reused so the section keeps its look.
import mcp from '@/components/page/connected-accounts/McpSection.module.scss';

import {
  type AccessLevel,
  type Agent,
  type ClientKey,
  type PendingAction,
  getSetupSteps,
  mockServerUrl,
} from './mocks';
import s from './McpSectionMock.module.scss';

/** Fixed "now" for the mock, so relative times do not move between renders. */
const NOW = new Date('2026-10-21T20:00:00Z').getTime();

/** Same format as production's `McpSection` `formatDate`. */
function formatDate(value: string | null) {
  if (!value) return 'Never';
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatAgo(value: string) {
  const minutes = Math.round((NOW - new Date(value).getTime()) / 60000);
  if (minutes < 60) return `${Math.max(minutes, 1)} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return formatDate(value);
}

const CLIENT_TABS: { label: string; value: ClientKey }[] = [
  { label: 'Claude Code', value: 'claude-code' },
  { label: 'Codex', value: 'codex' },
  { label: 'Claude.ai', value: 'claude-ai' },
  { label: 'Other clients', value: 'other' },
];

const ACCESS_HELP: Record<AccessLevel, string> = {
  read: 'Can read the Directory as you. Cannot change anything.',
  write: 'Can change your data as you. Intros, messages and posts wait for your confirm.',
};

const RECENT_COUNT = 3;

/** Prototype-only mark for a part that needs backend work that does not exist yet. */
function BackendMark({ show, children }: { show: boolean; children: string }) {
  if (!show) return null;
  return (
    <Badge variant="warning" className={s.backendMark}>
      Needs backend: {children}
    </Badge>
  );
}

interface Props {
  agents: Agent[];
  pending: PendingAction[];
  showMarks: boolean;
  onAccessChange: (uid: string, access: AccessLevel) => void;
  onRevoke: (uid: string) => void;
  onConfirm: (id: string) => void;
  onReject: (id: string) => void;
}

export function McpSectionMock({ agents, pending, showMarks, onAccessChange, onRevoke, onConfirm, onReject }: Props) {
  const [client, setClient] = useState<ClientKey>('claude-code');
  const [connectOpen, setConnectOpen] = useState(false);
  const [historyUid, setHistoryUid] = useState<string | null>(null);

  const connected = agents.length > 0;
  const showConnect = !connected || connectOpen;
  const historyAgent = agents.find((agent) => agent.uid === historyUid);
  const agentName = (uid: string) => agents.find((agent) => agent.uid === uid)?.clientName ?? 'Agent';

  return (
    <section className={mcp.root}>
      <div className={mcp.header}>MCP</div>
      <div className={mcp.content}>
        <p className={mcp.desc}>
          Connect Claude Code, Codex, Claude.ai or any HTTP MCP client to LabOS. The agent acts as you.
        </p>

        {/* One object for everything that waits on the member (lesson 20): a single block, first. */}
        {pending.length > 0 && (
          <div className={s.pending}>
            <div className={s.blockHead}>
              <span className={s.blockTitle}>Waiting for your confirm ({pending.length})</span>
              <BackendMark show={showMarks}>LAB-2903</BackendMark>
            </div>
            <p className={s.hint}>These actions reach other people. Nothing is sent until you confirm.</p>
            <ul className={s.pendingList}>
              {pending.map((item) => (
                <li key={item.id} className={s.pendingItem}>
                  <div className={s.pendingBody}>
                    <div className={s.pendingTop}>
                      <Badge>{item.kind}</Badge>
                      <span className={s.meta}>
                        {agentName(item.agentUid)} · {formatAgo(item.at)}
                      </span>
                    </div>
                    <div className={s.pendingText}>{item.text}</div>
                    <blockquote className={s.preview}>{item.preview}</blockquote>
                  </div>
                  <div className={s.pendingActions}>
                    <Button
                      size="s"
                      variant="neutral"
                      style="border"
                      className={s.btn}
                      onClick={() => onReject(item.id)}
                    >
                      Reject
                    </Button>
                    <Button size="s" variant="primary" className={s.btn} onClick={() => onConfirm(item.id)}>
                      Confirm
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {connected && (
          <ul className={mcp.list}>
            {agents.map((agent) => {
              const recent = agent.actions.slice(0, RECENT_COUNT);
              return (
                <li key={agent.uid} className={clsx(mcp.item, s.agent)}>
                  <div className={s.agentTop}>
                    <div>
                      <div className={mcp.clientName}>{agent.clientName}</div>
                      <div className={mcp.meta}>
                        Connected {formatDate(agent.connectedAt)} · Last used{' '}
                        {agent.lastUsedAt ? formatAgo(agent.lastUsedAt) : 'never'}
                      </div>
                    </div>
                    <Button size="s" variant="error" style="border" onClick={() => onRevoke(agent.uid)}>
                      Revoke
                    </Button>
                  </div>

                  <div className={s.field}>
                    <div className={s.blockHead}>
                      <span className={mcp.label}>Access</span>
                      <BackendMark show={showMarks}>change after consent</BackendMark>
                    </div>
                    <div className={s.segmented} role="radiogroup" aria-label={`Access for ${agent.clientName}`}>
                      {(['read', 'write'] as AccessLevel[]).map((level) => (
                        <button
                          key={level}
                          type="button"
                          role="radio"
                          aria-checked={agent.access === level}
                          className={clsx(s.segment, { [s.segmentActive]: agent.access === level })}
                          onClick={() => onAccessChange(agent.uid, level)}
                        >
                          {level === 'read' ? 'Read-only' : 'Make changes'}
                        </button>
                      ))}
                    </div>
                    <p className={s.hint}>{ACCESS_HELP[agent.access]}</p>
                  </div>

                  <div className={s.field}>
                    <div className={s.blockHead}>
                      <span className={mcp.label}>Last actions as you</span>
                      <BackendMark show={showMarks}>LAB-2901</BackendMark>
                    </div>
                    {recent.length === 0 ? (
                      <p className={s.hint}>No actions yet.</p>
                    ) : (
                      <ul className={s.actions}>
                        {recent.map((action) => (
                          <li key={action.id} className={s.action}>
                            <span className={s.actionText}>
                              {action.text}
                              {action.outward && <span className={s.meta}> · confirmed by you</span>}
                            </span>
                            <span className={s.meta}>{formatAgo(action.at)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {agent.actions.length > RECENT_COUNT && (
                      <Button size="s" style="link" className={s.linkBtn} onClick={() => setHistoryUid(agent.uid)}>
                        See all {agent.actions.length} actions
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {connected && !connectOpen && (
          <Button size="s" variant="secondary" style="border" onClick={() => setConnectOpen(true)}>
            Connect another agent
          </Button>
        )}

        {showConnect && (
          <div className={s.connect}>
            <div className={s.blockHead}>
              <span className={s.blockTitle}>{connected ? 'Connect another agent' : 'Connect an agent'}</span>
              {connected && (
                <button type="button" className={s.iconBtn} aria-label="Close" onClick={() => setConnectOpen(false)}>
                  <CloseIcon />
                </button>
              )}
            </div>
            {!connected && <p className={s.hint}>No agent is connected yet. Choose your client and do the steps.</p>}
            <Tabs
              tabs={CLIENT_TABS}
              value={client}
              onValueChange={(v) => setClient(v as ClientKey)}
              variant="pill"
              classes={{ root: s.tabs }}
            />
            <ol className={s.steps}>
              {getSetupSteps(client, mockServerUrl).map((step, index) => (
                <li key={`${client}-${index}`} className={s.step}>
                  <span className={s.stepNumber}>{index + 1}</span>
                  <div className={s.stepBody}>
                    <span>{step.text}</span>
                    {step.code && (
                      <div className={clsx(mcp.row, s.codeRow)}>
                        <code className={mcp.code}>{step.code}</code>
                        <CopyButton text={step.code} />
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      <Modal
        isOpen={!!historyAgent}
        onClose={() => setHistoryUid(null)}
        className={s.modal}
        ariaLabelledBy="mcp-history-title"
      >
        {historyAgent && (
          <div className={s.modalBody}>
            <div className={s.modalHead}>
              <h3 id="mcp-history-title" className={s.modalTitle}>
                {historyAgent.clientName}: all actions as you
              </h3>
              <button type="button" className={s.iconBtn} aria-label="Close" onClick={() => setHistoryUid(null)}>
                <CloseIcon />
              </button>
            </div>
            <ul className={s.actions}>
              {historyAgent.actions.map((action) => (
                <li key={action.id} className={s.action}>
                  <span className={s.actionText}>
                    {action.text}
                    {action.outward && <span className={s.meta}> · confirmed by you</span>}
                  </span>
                  <span className={s.meta}>{formatAgo(action.at)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Modal>
    </section>
  );
}
