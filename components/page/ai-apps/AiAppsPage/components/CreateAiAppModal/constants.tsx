import { ReactNode } from 'react';

import { AI_APPS_STARTER_KIT_VERSION } from '@/services/ai-apps/constants';

export const STEPS: { title: string; description: ReactNode }[] = [
  {
    title: 'Download the starter kit',
    description: `Click the button below to get Starter Kit v${AI_APPS_STARTER_KIT_VERSION} — a ready-to-use workspace for your AI coding tool.`,
  },
  {
    title: 'Open it in your AI tool',
    description: (
      <>
        Unzip the folder and open it in Claude Code, Cursor, or similar. For an existing app, copy your project into the{' '}
        <strong>app</strong> folder so the agent can work with the included deploy instructions.
      </>
    ),
  },
  {
    title: 'Describe what to build',
    description: (
      <>
        Tell your agent what you want. <strong>Frontend and backend are both supported</strong> — a UI-only page, or an
        app that talks to data and services (ChatGPT, email, a database, etc.). Your agent handles the technical setup.
      </>
    ),
  },
  {
    title: 'Deploy',
    description: (
      <>
        Say &quot;deploy this app&quot;, then:
        <ol>
          <li>Open the LabOS link your agent gives you, sign in, and click Approve.</li>
          <li>
            <em>Optional</em> — if the backend needs access to data or external services, your agent will send a second
            LabOS link. Enter your <strong>secrets (API keys / passwords)</strong> there and click Deploy. Never paste
            keys in chat.
          </li>
        </ol>
        When done, open the app from the AI Apps dashboard.
      </>
    ),
  },
];

export const MODAL_INTRO =
  'The starter kit works whether you are building a new app or bringing one you have already built into LabOS infrastructure.';

export const SECURITY_NOTE =
  'This download is tied to your LabOS account and acts on your behalf. Do not share it with others — anyone with it could deploy apps under your name.';
