// Mock data mirroring the production `AiApp` shape from
// services/ai-apps/ai-apps.service.ts — no API calls in the prototype.
import type { AiApp } from '@/services/ai-apps/ai-apps.service';

// A tiny self-contained HTML "app" rendered via iframe srcDoc so the detail
// view shows a real, framable preview without depending on an external host
// (avoids X-Frame-Options issues for a throwaway prototype).
function demoSrcDoc(title: string, accent: string, body: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"/>
  <style>
    :root{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
    *{box-sizing:border-box}
    body{margin:0;background:#f6f8fb;color:#0a0c11}
    .bar{display:flex;align-items:center;gap:10px;padding:14px 20px;background:${accent};color:#fff}
    .dot{width:10px;height:10px;border-radius:50%;background:rgba(255,255,255,.7)}
    .bar h1{margin:0;font-size:15px;font-weight:600}
    .wrap{padding:28px 24px}
    .card{background:#fff;border:1px solid rgba(27,56,96,.1);border-radius:12px;padding:20px;margin-bottom:16px;box-shadow:0 1px 2px rgba(14,15,17,.05)}
    .card h2{margin:0 0 8px;font-size:16px}
    .card p{margin:0;color:#455468;font-size:14px;line-height:1.5}
    .btn{display:inline-block;margin-top:14px;padding:8px 16px;border-radius:8px;background:${accent};color:#fff;font-size:13px;font-weight:600;text-decoration:none}
    .row{display:flex;gap:16px;flex-wrap:wrap}
    .stat{flex:1;min-width:120px;background:#fff;border:1px solid rgba(27,56,96,.1);border-radius:12px;padding:16px}
    .stat b{display:block;font-size:24px}
    .stat span{font-size:12px;color:#8897ae}
  </style></head>
  <body>
    <div class="bar"><span class="dot"></span><h1>${title}</h1></div>
    <div class="wrap">${body}</div>
  </body></html>`;
}

export const mockAiApps: AiApp[] = [
  {
    uid: 'app-1',
    memberUid: 'm-1',
    appId: 'intro-matcher',
    name: 'Warm Intro Matcher',
    description: 'Suggests the strongest mutual connection for a target investor and drafts the intro request.',
    status: 'deployed',
    notes: null,
    url: '',
    httpUrl: '',
    host: 'labs.pln',
    port: 443,
    deploymentId: 'dep-1',
    requiredEnvVars: [],
    providedEnvVars: [],
    createdAt: '2026-06-18T10:00:00.000Z',
    updatedAt: '2026-06-18T10:00:00.000Z',
    member: { uid: 'm-1', name: 'Polina Bublii' },
  },
  {
    uid: 'app-2',
    memberUid: 'm-2',
    appId: 'founder-digest',
    name: 'Founder Digest',
    description: 'Weekly summary of new founders in the directory, ranked by alignment with PL Infra focus areas.',
    status: 'deployed',
    notes: null,
    url: '',
    httpUrl: '',
    host: 'labs.pln',
    port: 443,
    deploymentId: 'dep-2',
    requiredEnvVars: [],
    providedEnvVars: [],
    createdAt: '2026-06-12T14:30:00.000Z',
    updatedAt: '2026-06-12T14:30:00.000Z',
    member: { uid: 'm-2', name: 'Daniel Singer' },
  },
  {
    uid: 'app-3',
    memberUid: 'm-3',
    appId: 'event-scout',
    name: 'Event Scout',
    description: 'Finds upcoming IRL events relevant to a team and flags which network members are already attending.',
    status: 'deployed',
    notes: null,
    url: '',
    httpUrl: '',
    host: 'labs.pln',
    port: 443,
    deploymentId: 'dep-3',
    requiredEnvVars: [],
    providedEnvVars: [],
    createdAt: '2026-06-05T09:15:00.000Z',
    updatedAt: '2026-06-05T09:15:00.000Z',
    member: { uid: 'm-3', name: 'Maria Lopez' },
  },
];

// Map of uid -> iframe srcDoc for the detail preview.
export const mockAppPreviews: Record<string, string> = {
  'app-1': demoSrcDoc(
    'Warm Intro Matcher',
    '#1b4dff',
    `<div class="card"><h2>Target: Sequoia Capital</h2><p>3 mutual connections found in your network.</p>
       <a class="btn" href="#">Draft intro via Roneil Rumburg →</a></div>
     <div class="row">
       <div class="stat"><b>3</b><span>warm paths</span></div>
       <div class="stat"><b>1-hop</b><span>shortest path</span></div>
       <div class="stat"><b>92%</b><span>match score</span></div>
     </div>`,
  ),
  'app-2': demoSrcDoc(
    'Founder Digest',
    '#0a9952',
    `<div class="card"><h2>This week · 14 new founders</h2><p>Ranked by alignment with PL Infra focus areas.</p>
       <a class="btn" href="#">View full digest →</a></div>
     <div class="row">
       <div class="stat"><b>14</b><span>new founders</span></div>
       <div class="stat"><b>5</b><span>strong fit</span></div>
       <div class="stat"><b>2</b><span>flagged</span></div>
     </div>`,
  ),
  'app-3': demoSrcDoc(
    'Event Scout',
    '#7c3aed',
    `<div class="card"><h2>FIL Dev Summit · Lisbon</h2><p>8 network members already attending.</p>
       <a class="btn" href="#">See attendees →</a></div>
     <div class="row">
       <div class="stat"><b>12</b><span>relevant events</span></div>
       <div class="stat"><b>8</b><span>members going</span></div>
       <div class="stat"><b>3</b><span>this month</span></div>
     </div>`,
  ),
};

export const mockPageCopy = {
  title: 'AI Apps',
  description: 'A sandbox to deploy your AI apps on LabOS infra and explore what PL Infra team members are building.',
};

// Create-modal copy (prototype-local; overrides the production STEPS constant).
export const createModalIntro =
  'The starter kit works whether you are building a new app or bringing one you have already built into LabOS infrastructure.';

export const createModalSteps = [
  {
    title: 'Download the starter kit',
    description: 'Click the button below to get Starter Kit v1.4 — a ready-to-use workspace for your AI coding tool.',
  },
  {
    title: 'Open it in your AI tool',
    description:
      'Unzip the folder and open it in Claude Code, Cursor, or similar. For an existing app, copy your project into the app folder so the agent can work with the included deploy instructions.',
  },
  {
    title: 'Describe what to build',
    description:
      'Tell your agent what you want. Frontend and backend are both supported — a UI-only page, or an app that talks to data and services (ChatGPT, email, a database, etc.). Your agent handles the technical setup.',
  },
  {
    title: 'Deploy',
    description:
      'Say "deploy this app", then: (1) Open the LabOS link your agent gives you, sign in, and click Approve. (2) Optional — if the backend needs access to data or external services, your agent will send a second LabOS link. Enter your secrets (API keys / passwords) there and click Deploy. Never paste keys in chat. When done, open the app from the AI Apps dashboard.',
  },
];

export const createModalSecurityNote =
  'This download is tied to your LabOS account and acts on your behalf. Do not share it with others — anyone with it could deploy apps under your name.';
