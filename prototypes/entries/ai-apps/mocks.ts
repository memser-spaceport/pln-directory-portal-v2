// Mock data mirroring the production `AiApp` shape from
// services/ai-apps/ai-apps.service.ts. No API calls in the prototype.
import type { AiApp } from '@/services/ai-apps/ai-apps.service';

// Prototype-local extension of the production `AiApp` shape. Production has no
// 1-pager/document field yet; we model it here without touching the real type.
// `fileUrl` is a blob URL for a freshly-uploaded HTML/Markdown file (viewable
// in the modal); `previewDataUrl` is an optional thumbnail (seeded placeholder
// for the demo). A seeded doc may have only a preview.
export interface OnePager {
  fileName: string;
  fileSize: number;
  previewDataUrl?: string;
  fileUrl?: string;
}

export type AiAppWithDoc = AiApp & { onePager?: OnePager };

// A small portrait "PRD page" thumbnail as an inline SVG data-URI, so the
// seeded 1-pager renders a realistic preview without shipping a binary file.
function onePagerPlaceholder(title: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="320" viewBox="0 0 240 320">
    <rect width="240" height="320" fill="#ffffff"/>
    <rect x="0.5" y="0.5" width="239" height="319" fill="none" stroke="rgba(27,56,96,0.12)"/>
    <text x="20" y="42" font-family="-apple-system,Segoe UI,Roboto,sans-serif" font-size="11" font-weight="700" letter-spacing="1" fill="#1b4dff">PRD - 1-PAGER</text>
    <text x="20" y="70" font-family="-apple-system,Segoe UI,Roboto,sans-serif" font-size="15" font-weight="700" fill="#0a0c11">${title}</text>
    <rect x="20" y="92" width="200" height="7" rx="3.5" fill="rgba(27,56,96,0.16)"/>
    <rect x="20" y="108" width="200" height="7" rx="3.5" fill="rgba(27,56,96,0.10)"/>
    <rect x="20" y="124" width="150" height="7" rx="3.5" fill="rgba(27,56,96,0.10)"/>
    <rect x="20" y="152" width="90" height="7" rx="3.5" fill="rgba(27,56,96,0.16)"/>
    <rect x="20" y="168" width="200" height="7" rx="3.5" fill="rgba(27,56,96,0.10)"/>
    <rect x="20" y="184" width="200" height="7" rx="3.5" fill="rgba(27,56,96,0.10)"/>
    <rect x="20" y="200" width="170" height="7" rx="3.5" fill="rgba(27,56,96,0.10)"/>
    <rect x="20" y="228" width="90" height="7" rx="3.5" fill="rgba(27,56,96,0.16)"/>
    <rect x="20" y="244" width="200" height="7" rx="3.5" fill="rgba(27,56,96,0.10)"/>
    <rect x="20" y="260" width="130" height="7" rx="3.5" fill="rgba(27,56,96,0.10)"/>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

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

export const mockAiApps: AiAppWithDoc[] = [
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
    // One stored + one still-needed secret, so "Deployment settings" shows the
    // full update-secrets-and-redeploy flow out of the box.
    requiredEnvVars: ['OPENAI_API_KEY', 'DIRECTORY_API_TOKEN'],
    providedEnvVars: ['OPENAI_API_KEY'],
    createdAt: '2026-06-18T10:00:00.000Z',
    updatedAt: '2026-06-18T10:00:00.000Z',
    member: { uid: 'm-1', name: 'Polina Bublii', image: null },
    // Seeded 1-pager (preview only) so the "anyone can view" state is visible
    // out of the box. Uploaded files additionally get a real `fileUrl`.
    onePager: {
      fileName: 'Warm Intro Matcher - PRD.md',
      fileSize: 12_480,
      previewDataUrl: onePagerPlaceholder('Warm Intro Matcher'),
    },
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
    member: { uid: 'm-2', name: 'Daniel Singer', image: null },
    onePager: {
      fileName: 'Founder Digest - Overview.html',
      fileSize: 18_240,
      previewDataUrl: onePagerPlaceholder('Founder Digest'),
    },
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
    member: { uid: 'm-3', name: 'Maria Lopez', image: null },
  },
];

// Map of uid -> iframe srcDoc for the detail preview.
export const mockAppPreviews: Record<string, string> = {
  'app-1': demoSrcDoc(
    'Warm Intro Matcher',
    '#1b4dff',
    `<div class="card"><h2>Target: Sequoia Capital</h2><p>3 mutual connections found in your network.</p>
       <a class="btn" href="#">Draft intro via Roneil Rumburg -&gt;</a></div>
     <div class="row">
       <div class="stat"><b>3</b><span>warm paths</span></div>
       <div class="stat"><b>1-hop</b><span>shortest path</span></div>
       <div class="stat"><b>92%</b><span>match score</span></div>
     </div>`,
  ),
  'app-2': demoSrcDoc(
    'Founder Digest',
    '#0a9952',
    `<div class="card"><h2>This week - 14 new founders</h2><p>Ranked by alignment with PL Infra focus areas.</p>
       <a class="btn" href="#">View full digest -&gt;</a></div>
     <div class="row">
       <div class="stat"><b>14</b><span>new founders</span></div>
       <div class="stat"><b>5</b><span>strong fit</span></div>
       <div class="stat"><b>2</b><span>flagged</span></div>
     </div>`,
  ),
  'app-3': demoSrcDoc(
    'Event Scout',
    '#7c3aed',
    `<div class="card"><h2>FIL Dev Summit - Lisbon</h2><p>8 network members already attending.</p>
       <a class="btn" href="#">See attendees -&gt;</a></div>
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
      'Tell your agent what you want. Frontend and backend are both supported - a UI-only page, or an app that talks to data and services (ChatGPT, email, a database, etc.). Your agent handles the technical setup.',
  },
  {
    title: 'Deploy',
    description:
      'Say "deploy this app", then: (1) Open the LabOS link your agent gives you, sign in, and click Approve. (2) Optional - if the backend needs access to data or external services, your agent will send a second LabOS link. Enter your secrets (API keys / passwords) there and click Deploy. Never paste keys in chat. When done, open the app from the AI Apps dashboard.',
  },
];

export const createModalSecurityNote =
  'This download is tied to your LabOS account and acts on your behalf. Do not share it with others - anyone with it could deploy apps under your name.';

export const mockStarterKitVersion = '1.3';
