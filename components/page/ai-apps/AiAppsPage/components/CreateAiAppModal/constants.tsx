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
        app that talks to data and services (ChatGPT, email, a database, etc.). Your app can also use{' '}
        <strong>PL member context</strong> (name, photo, teams, and more) to personalize for the signed-in user. Your
        agent handles the technical setup.
      </>
    ),
  },
  {
    title: 'Deploy',
    description: (
      <>
        Say &quot;deploy this app&quot;, then:
        <ol>
          <li>
            Your agent suggests a <strong>name and short description</strong> — approve them (or ask for changes) before
            it continues.
          </li>
          <li>Open the LabOS link your agent gives you, sign in, and click Approve.</li>
          <li>
            <em>Optional</em> — if the backend needs a database, your agent will ask whether to let PL provision one
            automatically or connect one you already have. If it needs access to other data or external services, your
            agent will send a second LabOS link. Enter your{' '}
            <strong>secrets (API keys / passwords / your own database)</strong> there and click Deploy. Never paste keys
            in chat.
          </li>
        </ol>
        When done, open the app from the AI Apps dashboard.
      </>
    ),
  },
];

export const MODAL_INTRO =
  'The starter kit works whether you are building a new app or bringing one you have already built into LabOS infrastructure.';

export const MODAL_WHATS_NEW_SECTIONS: { version: string; items: string[] }[] = [
  {
    version: '1.17',
    items: [
      'Your agent now tells you when a newer kit is out, at the start of a chat, and asks whether to apply it. Nothing changes until you say yes',
      'An update changes only kit files (agent instructions, skills, design system, styles), never your app code',
      'If you edited a kit file yourself, your agent names it and asks again before overwriting it',
      'Say no and your agent won’t ask about that version again. You can still ask it to “update the kit” anytime',
      'Kits downloaded before this version don’t check for updates. Download this kit once; after that, your agent offers new versions itself',
    ],
  },
  {
    version: '1.16',
    items: [
      'Ask your agent for Preview testing users — it creates them and gives you 24-hour session tokens for a load test. Tokens work on Preview only, not Production',
      'Ask your agent to add the new LabOS feedback script to every page of your app — the kit tells it how. It lets people attach a picture of your app to their feedback without sharing their screen',
      'Feedback pictures of your app never show what people typed. Ask your agent to hide anything else private, and LabOS greys it out in every picture',
    ],
  },
  {
    version: '1.15',
    items: [
      'Deploys no longer time out. Your agent gets an answer right away and then follows the build until it is live or has failed, so it no longer reports a failure for a deploy that actually worked',
      'If a deploy fails, your agent sees why — whether the build or the running app failed — and goes straight to the right logs',
      'Kits downloaded before this version report "deployed" as soon as the upload is accepted, while the build is still running. The app page always shows the real status. Download this kit so your agent waits for the result',
      'Your agent can read the feedback people leave on your app, including screenshots, and work through it with you',
      'When your agent starts on an item it marks it Viewed. Once the fix is deployed it marks it Implemented. You see the same status on the app page',
      'Agents never move an item back to New. That, and any other status change, is still yours to make from LabOS',
    ],
  },
  {
    version: '1.14',
    items: [
      'Preview is for testing, QA, and development. It sits next to Production and does not change the live app',
      'Preview is private by default. Share it with a few people from Manage access. Switch between Production and Preview on the app page',
      '(Via UI) In Deployment settings, create a deployment key and give it to your agent or GitHub Actions. It deploys the app to this environment (Production or Preview), so you do not approve a new LabOS link each time. The full key is shown once. Revoke it anytime',
      'Your app now learns who is signed in from its own address — there is no LabOS token for your code to read or pass around',
      'The sign-in your app receives works for your app only, not for LabOS or other apps',
      'Apps built with earlier kits keep working as they are — no redeploy needed. Download this kit so your agent also knows how to deploy a Preview and use a deployment key',
    ],
  },
  {
    version: '1.13',
    items: [
      'Choose who can open your app: all PL Infra members (the default) or private to you. Your agent asks before the first deploy',
      '(Via UI) Manage access from your app’s ⋮ menu: make it private and add specific members, or open it to all PL Infra members again. Switch anytime — your list of people is kept',
      'Members you haven’t added don’t see a private app in the catalog, and get a “no access” page if they open its link',
      'Public endpoints: paths that skip LabOS sign-in, so a cron job, a webhook (Stripe, GitHub), an MCP endpoint, or a public page can reach the app. Your agent sets them at deploy, with your approval. LabOS does not check sign-in on these paths, so the app has to (a signature or its own API key)',
      '(Via UI) Add, edit, or remove public endpoints anytime in Deployment settings — changes apply right away, no redeploy',
    ],
  },
  {
    version: '1.12',
    items: [
      '(Via UI) You can now see logs from your previous deploy too — Deployment logs cover everything your app printed in the chosen time window, with a marker where the earlier deployment starts',
      'Your agent now suggests tags for your app alongside its name and description — approve them before the first deploy',
      'Your app’s page address is shared with LabOS only, and only the page path — nothing from a page’s URL parameters (like a sign-in callback) ends up in the LabOS address bar',
    ],
  },
  {
    version: '1.11',
    items: [
      'LabOS moved to os.pl.xyz — the kit now points at the new addresses for deploying, logs, settings and your app’s own URL (https://<appId>.os.pl.xyz)',
      'Kits downloaded before this version still reference the old plnetwork.io addresses and their deploy checks will fail; download this kit and drop it into your project to keep deploying',
    ],
  },
  {
    version: '1.10',
    items: [
      'The page address and browser tab title now follow where you are inside your app, so you can share or bookmark a link to a specific screen — it reopens right there, including after logging in',
      'Apps built with earlier kits still open such links but won’t update the address or title as you navigate; redeploy with the new kit to get that',
    ],
  },
  {
    version: '1.9',
    items: [
      'Every new app now automatically reports basic usage (opened, errors, roughly how long it was used) to help the PL team understand how AI Apps are used — nothing to configure',
      'Ask your agent to track something more specific too (e.g. a particular button); this part stays optional and is never required for a deploy to succeed',
      'There’s no usage dashboard for your own app yet — this data goes to the data warehouse and can be accessed via the usual channel',
    ],
  },
  {
    version: '1.8',
    items: [
      'Already have your own database? Your agent can now migrate it to a PL-managed one for you, carrying over your existing data structure',
      'Your agent tells you plainly if anything about your current database setup (like its own login system) can’t come along automatically',
    ],
  },
  {
    version: '1.7',
    items: [
      'Your agent now knows the CPU/memory budget for building and running your app, and designs within it',
      'If a deploy or build ever hits that limit, your agent recognizes it and fixes the app instead of just retrying',
    ],
  },
  {
    version: '1.6',
    items: [
      'Ask PL to provision a database for your app automatically — no accounts or setup needed',
      'Bringing your own database instead? Connect it the same way as any other secret',
      'UI kit update: higher fidelity to the product, every state inspectable in Storybook, more control over individual components, and a broader component set',
    ],
  },
  {
    version: '1.5',
    items: [
      'Your agent can fetch build and runtime logs to diagnose failed deploys and runtime errors',
      '(Via UI) View build and runtime logs from your app’s actions menu — no agent needed',
    ],
  },
  {
    version: '1.4',
    items: [
      'Use signed-in PL member context in your app (name, photo, teams, and more)',
      "Approve your app's name and description before the first deploy",
      'Optionally add a one-pager/PRD after deploy',
      '(Via UI, not part of the download kit) Rename, edit description, or update the one-pager/PRD anytime through your agent — no redeploy',
    ],
  },
];

export const SECURITY_NOTE =
  'This download is tied to your LabOS account and acts on your behalf. Do not share it with others — anyone with it could deploy apps under your name.';
