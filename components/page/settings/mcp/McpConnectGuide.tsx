'use client';

import { useState } from 'react';
import { clsx } from 'clsx';

import { useMcpAnalytics, type McpSnippetType } from '@/analytics/mcp.analytics';
import { Button } from '@/components/common/Button/Button';
import { Tabs } from '@/components/common/Tabs/Tabs';
import { CloseIcon } from '@/components/icons';
import { CopyButton } from '@/components/ui/CopyButton';
// Production's MCP card rows, labels and code, as in the prototype.
import mcp from '@/components/page/connected-accounts/McpSection.module.scss';

import { ClientLogo, type ClientKey } from './ClientLogo';
import s from './McpConnections.module.scss';

type SetupStep = { text: string; code?: string; link?: { label: string; href: string } };

const CONSENT_STEP = 'Sign in to LabOS and approve. It starts with read-only access.';

/**
 * Per-client setup steps, from the LAB-2948 prototype (`mocks.ts` getSetupSteps) with LAB-3054's Others step: the
 * server URL sits in the step that says to paste it.
 */
function getSetupSteps(client: ClientKey, serverUrl: string): SetupStep[] {
  switch (client) {
    case 'claude-code':
      return [
        { text: 'Run this in your terminal.', code: `claude mcp add --transport http labos ${serverUrl}` },
        { text: 'In Claude Code, run /mcp and choose "labos". Your browser opens LabOS.' },
        { text: CONSENT_STEP },
      ];
    case 'codex':
      return [
        { text: 'Run these in your terminal.', code: `codex mcp add labos --url ${serverUrl}\ncodex mcp login labos` },
        { text: 'Your browser opens LabOS.' },
        { text: CONSENT_STEP },
      ];
    case 'claude-ai':
      return [
        {
          // Claude moved connectors from Settings to Customize (checked 2026-10-28); /settings/connectors now only says so.
          text: 'In Claude, open Customize → Connectors, then Add → Add custom connector.',
          link: { label: 'Open Claude connectors', href: 'https://claude.ai/customize/connectors' },
        },
        { text: 'Name it "LabOS" and paste the LabOS MCP server URL. Select Add, then Connect.', code: serverUrl },
        { text: CONSENT_STEP },
      ];
    default:
      return [
        {
          text: 'Add a remote MCP server in your client (Cursor, ChatGPT and others) and paste the LabOS MCP server URL.',
          code: serverUrl,
        },
        { text: 'Sign in from your client. Your browser opens LabOS.' },
        { text: CONSENT_STEP },
      ];
  }
}

/** Which copy event a step's code belongs to. */
const SNIPPET_TYPE: Record<ClientKey, McpSnippetType> = {
  'claude-ai': 'claude-app',
  'claude-code': 'claude',
  codex: 'codex',
  other: 'server',
};

// LAB-3054: one tab bar for every client, the Claude app first (no terminal needed).
const CLIENTS: { name: string; value: ClientKey }[] = [
  { name: 'Claude app', value: 'claude-ai' },
  { name: 'Claude Code', value: 'claude-code' },
  { name: 'Codex', value: 'codex' },
  { name: 'Others', value: 'other' },
];

// Each tab leads with its client's mark, the same mark the connection cards wear.
const CLIENT_TABS = CLIENTS.map(({ name, value }) => ({
  value,
  label: (
    <span className={s.tabLabel}>
      <ClientLogo client={value} />
      {name}
    </span>
  ),
}));

/**
 * How to connect (LAB-3048, design LAB-3054): one tab per client, the Claude app first. Members did not see that the
 * terminal clients are a different path, so the "For developers" group is gone and each tab holds only its own steps.
 * The server URL sits inside the Claude app and Others steps; the Claude Code and Codex commands already contain it.
 */
export function McpConnectGuide({ connected, onClose }: { connected: boolean; onClose?: () => void }) {
  const analytics = useMcpAnalytics();
  const serverUrl = `${process.env.DIRECTORY_API_URL}/mcp`;
  const [client, setClient] = useState<ClientKey>('claude-ai');

  return (
    <div className={s.connect}>
      <div className={s.blockHead}>
        <span className={s.blockTitle}>{connected ? 'Add another connection' : 'Add a connection'}</span>
        {connected && onClose && (
          <button type="button" className={s.iconBtn} aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        )}
      </div>

      <div className={s.connectGroup}>
        <Tabs
          tabs={CLIENT_TABS}
          value={client}
          onValueChange={(v) => setClient(v as ClientKey)}
          variant="pill"
          classes={{ root: s.tabs }}
        />
        <SetupSteps
          steps={getSetupSteps(client, serverUrl)}
          stepKey={client}
          onCopy={() => analytics.onSetupSnippetCopied({ snippetType: SNIPPET_TYPE[client] })}
        />
        {client === 'claude-ai' && (
          <p className={s.help}>
            After this, LabOS works in Claude on web, desktop and mobile. If you don’t see Add custom connector, ask
            your Claude workspace admin to add LabOS.
          </p>
        )}
      </div>
    </div>
  );
}

function SetupSteps({ steps, stepKey, onCopy }: { steps: SetupStep[]; stepKey: string; onCopy: () => void }) {
  return (
    <ol className={s.steps}>
      {steps.map((step, index) => (
        <li key={`${stepKey}-${index}`} className={s.step}>
          <span className={s.stepNumber}>{index + 1}</span>
          <div className={s.stepBody}>
            <span>{step.text}</span>
            {step.code && (
              <div className={clsx(mcp.row, s.codeRow)}>
                <code className={mcp.code}>{step.code}</code>
                <CopyButton text={step.code} onCopy={onCopy} />
              </div>
            )}
            {step.link && (
              <Button
                size="s"
                variant="secondary"
                style="border"
                className={clsx(s.btn, s.stepLink)}
                onClick={() => window.open(step.link?.href, '_blank', 'noopener')}
              >
                {step.link.label}
              </Button>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
