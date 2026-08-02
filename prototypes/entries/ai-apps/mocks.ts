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

// Infra targets the LabOS runner can deploy to. The provider shows up in the
// deployment logs so troubleshooting reads like the real pipeline output.
export type DeployProvider = 'vultr' | 'hetzner' | 'gcp' | 'aws';

// Presentational metadata per provider — the header chip in the logs modal.
export const providerMeta: Record<DeployProvider, { label: string; sub: string }> = {
  vultr: { label: 'Vultr', sub: 'Cloud Compute' },
  hetzner: { label: 'Hetzner', sub: 'Cloud' },
  gcp: { label: 'Google Cloud', sub: 'Cloud Run' },
  aws: { label: 'AWS', sub: 'App Runner' },
};

export type LogLevel = 'info' | 'success' | 'warn' | 'error';

/**
 * The two log sources. They are not one list with a category column — they have
 * different lifecycles, so the UI gives each its own tab and controls.
 *  - `build`: finite, one per deploy attempt, ends with an exit code.
 *  - `runtime`: continuous stream from the running container; empty when the
 *    build never shipped.
 * Deploy orchestration (provision / secrets / release) is assumed to ride the
 * build stream — it belongs to the same finite attempt. Worth confirming with
 * the devs, since it could be a third source.
 */
export type LogStream = 'build' | 'runtime';

// Pipeline phase a log line belongs to — the table's first column, and what
// you scan by when a deploy fails ("everything through Build was fine").
export type DeployStage =
  // build stream
  | 'Queue'
  | 'Build'
  | 'Provision'
  | 'Secrets'
  | 'Release'
  // runtime stream
  | 'Boot'
  | 'Health'
  | 'App'
  | 'Crash';

/**
 * One row of deploy output. `date`/`time` are display strings — the prototype
 * hardcodes them so the log is deterministic across renders. `resource` is the
 * thing the step acted on (image tag, instance, endpoint); `status` is the
 * outcome pair rendered as a muted label + level-colored code.
 */
export interface DeployLogLine {
  date: string;
  time: string;
  stage: DeployStage;
  level: LogLevel;
  message: string;
  resource?: string;
  status?: { label: string; code: string };
}

// The deploy record surfaced by the "Deployment logs" troubleshooting view.
export interface DeploymentInfo {
  provider: DeployProvider;
  region: string;
  instance: string;
  finishedAt: string;
  /** Attempt label for the build stream, e.g. "#12". */
  attempt: string;
  /** Exit code the build attempt ended on — 0 is a clean build. */
  exitCode: number;
  /** Wall-clock duration of the build attempt. */
  buildDuration: string;
  /** How long runtime logs are retained — the runtime tab's time window. */
  retention: string;
  /**
   * What is actually serving traffic right now — the axis that decides how the
   * app presents, independent of whether the last deploy succeeded.
   *  - `latest`   — the current build is live.
   *  - `previous` — the last deploy failed and rolled back, but an older
   *                 revision is still up. The app WORKS; only the creator needs
   *                 to know their change didn't ship.
   *  - `none`     — nothing has ever shipped. The app is genuinely unavailable.
   * A failed deploy is not the same as an unavailable app, and conflating them
   * means greying out an app that is serving users perfectly well.
   */
  serving: 'latest' | 'previous' | 'none';
  /**
   * Plain-language cause, shown on the card and in the failed-redeploy state so
   * the creator gets the answer without opening the logs first.
   */
  failureReason?: string;
  /**
   * Which stream actually holds the failure — a build error lives in `build`,
   * an OOM kill in `runtime`. "See logs" opens straight to it, so the creator
   * doesn't land on a clean build log and conclude nothing is wrong.
   */
  failureStream?: LogStream;
  /** Finite, chronological (oldest first) — you replay a build top-to-bottom. */
  buildLogs: DeployLogLine[];
  /** Continuous, newest first (a tail). Empty when the build never shipped. */
  runtimeLogs: DeployLogLine[];
}

export type AiAppWithDoc = AiApp & { onePager?: OnePager; deployment?: DeploymentInfo };

// Terse row builder so the seeded pipelines below stay readable. `date` is
// bound per-app via `pipeline()` since every deploy runs inside one day.
function row(
  time: string,
  stage: DeployStage,
  level: LogLevel,
  message: string,
  resource?: string,
  status?: { label: string; code: string },
): Omit<DeployLogLine, 'date'> {
  return { time, stage, level, message, resource, status };
}

/** Stamps every row of a deploy with the day it ran. */
function pipeline(date: string, rows: Omit<DeployLogLine, 'date'>[]): DeployLogLine[] {
  return rows.map((r) => ({ ...r, date }));
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Runtime is a continuous stream, so the seeded apps need real volume for the
 * table to page through. Deterministic by construction — index-driven, no
 * randomness — because the prototype route server-renders and random rows
 * would desync on hydration. Returns newest-first, the way you read a tail.
 */
function runtimeStream(
  date: string,
  startHour: number,
  count: number,
  templates: Omit<DeployLogLine, 'date' | 'time'>[],
): DeployLogLine[] {
  const rows = Array.from({ length: count }, (_, i) => {
    // ~37s apart so the timestamps march forward believably.
    const total = startHour * 3600 + i * 37;
    const time = `${pad(Math.floor(total / 3600) % 24)}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
    return { ...templates[i % templates.length], date, time };
  });
  return rows.reverse();
}

/** Request/probe chatter shared by the healthy seeded apps. */
function healthyTraffic(routes: [string, string][]): Omit<DeployLogLine, 'date' | 'time'>[] {
  return [
    row('', 'Health', 'info', 'Health probe', 'GET /healthz', { label: 'HTTP', code: '200' }),
    ...routes.map(([label, path]) =>
      row('', 'App', 'info', label, path, { label: 'HTTP', code: '200' }),
    ),
    row('', 'App', 'warn', 'Slow response — upstream latency', routes[0][1], { label: 'TOOK', code: '1.4s' }),
    row('', 'Health', 'info', 'Health probe', 'GET /healthz', { label: 'HTTP', code: '200' }),
  ].map(({ time: _t, ...rest }) => rest);
}

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
    status: 'READY',
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
    deployment: {
      provider: 'vultr',
      region: 'ewr (New Jersey)',
      instance: 'vc2-1c-1gb',
      finishedAt: 'Jun 18, 2026 · 10:33',
      attempt: '#12',
      exitCode: 0,
      buildDuration: '1m 23s',
      retention: 'Last 24 hours',
      serving: 'latest',
      buildLogs: pipeline('JUN 18', [
        row('10:32:01', 'Queue', 'info', 'Deploy queued on runner labos-ci', 'dep-1'),
        row('10:32:03', 'Build', 'info', 'Building image from source', 'intro-matcher:sha-4f9c2a1'),
        row('10:32:47', 'Build', 'success', 'Image built and pushed to registry.labos.pln', 'intro-matcher:sha-4f9c2a1', {
          label: 'SIZE',
          code: '182 MB',
        }),
        row('10:32:49', 'Provision', 'info', 'Provisioning Vultr Cloud Compute in ewr', 'vc2-1c-1gb'),
        row('10:33:12', 'Provision', 'success', 'Instance ready and reachable', '45.76.x.x', {
          label: 'TOOK',
          code: '23s',
        }),
        row('10:33:13', 'Secrets', 'info', 'Injecting 1 secret into the sandbox', 'OPENAI_API_KEY'),
        row('10:33:23', 'Release', 'info', 'Routing labs.pln to intro-matcher', 'labs.pln'),
        row('10:33:24', 'Release', 'success', 'Deploy live', 'intro-matcher.labs.pln', { label: 'EXIT', code: '0' }),
      ]),
      runtimeLogs: [
        ...runtimeStream(
          'JUN 18',
          11,
          63,
          healthyTraffic([
            ['Rendered landing page', 'GET /'],
            ['Matched intro paths', 'POST /api/match'],
            ['Fetched member graph', 'GET /api/graph'],
            ['Drafted intro request', 'POST /api/draft'],
          ]),
        ),
        ...pipeline('JUN 18', [
          row('10:33:14', 'Boot', 'info', 'Container started', ':8080', { label: 'PID', code: '1' }),
        ]),
      ],
    },
  },
  {
    uid: 'app-2',
    memberUid: 'm-2',
    appId: 'founder-digest',
    name: 'Founder Digest',
    description: 'Weekly summary of new founders in the directory, ranked by alignment with PL Infra focus areas.',
    status: 'READY',
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
    deployment: {
      provider: 'hetzner',
      region: 'nbg1 (Nuremberg)',
      instance: 'cx22',
      finishedAt: 'Jun 12, 2026 · 09:16',
      attempt: '#7',
      exitCode: 0,
      buildDuration: '1m 36s',
      retention: 'Last 24 hours',
      serving: 'latest',
      buildLogs: pipeline('JUN 12', [
        row('09:14:40', 'Queue', 'info', 'Deploy queued on runner labos-ci', 'dep-2'),
        row('09:14:42', 'Build', 'info', 'Building image from source', 'founder-digest:sha-7b1e903'),
        row('09:15:20', 'Build', 'warn', 'No lockfile found — resolved deps from package.json', 'package.json'),
        row('09:15:38', 'Build', 'success', 'Image built and pushed to registry.labos.pln', 'founder-digest:sha-7b1e903', {
          label: 'SIZE',
          code: '146 MB',
        }),
        row('09:15:40', 'Provision', 'info', 'Provisioning Hetzner Cloud in nbg1', 'cx22'),
        row('09:16:05', 'Provision', 'success', 'Server ready and reachable', '5.75.x.x', {
          label: 'TOOK',
          code: '25s',
        }),
        row('09:16:06', 'Secrets', 'info', 'No secrets required for this app'),
        row('09:16:16', 'Release', 'success', 'Deploy live', 'founder-digest.labs.pln', { label: 'EXIT', code: '0' }),
      ]),
      runtimeLogs: [
        ...runtimeStream(
          'JUN 12',
          10,
          47,
          healthyTraffic([
            ['Rendered digest index', 'GET /'],
            ['Ranked new founders', 'POST /api/rank'],
            ['Sent weekly digest', 'POST /api/send'],
          ]),
        ),
        ...pipeline('JUN 12', [
          row('09:16:07', 'Boot', 'info', 'Container started', ':8080', { label: 'PID', code: '1' }),
        ]),
      ],
    },
  },
  {
    uid: 'app-3',
    memberUid: 'm-3',
    appId: 'event-scout',
    name: 'Event Scout',
    description: 'Finds upcoming IRL events relevant to a team and flags which network members are already attending.',
    status: 'READY',
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
    deployment: {
      provider: 'gcp',
      region: 'us-central1',
      instance: '1 vCPU / 512 MB',
      finishedAt: 'Jun 5, 2026 · 11:03',
      attempt: '#4',
      exitCode: 0,
      buildDuration: '1m 29s',
      retention: 'Last 24 hours',
      serving: 'latest',
      buildLogs: pipeline('JUN 05', [
        row('11:02:10', 'Queue', 'info', 'Deploy queued on runner labos-ci', 'dep-3'),
        row('11:02:12', 'Build', 'info', 'Building image from source', 'event-scout:sha-2c9df10'),
        row('11:02:55', 'Build', 'success', 'Image built and pushed to Artifact Registry', 'event-scout:sha-2c9df10', {
          label: 'SIZE',
          code: '168 MB',
        }),
        row('11:02:57', 'Provision', 'info', 'Deploying to Google Cloud Run in us-central1', 'project labos-prod'),
        row('11:03:20', 'Release', 'info', 'Creating revision', 'event-scout-00007-abc'),
        row('11:03:39', 'Release', 'success', 'Deploy live', 'event-scout.labs.pln', { label: 'EXIT', code: '0' }),
      ]),
      runtimeLogs: [
        ...runtimeStream(
          'JUN 05',
          12,
          38,
          healthyTraffic([
            ['Rendered event list', 'GET /'],
            ['Searched upcoming events', 'POST /api/search'],
            ['Resolved attendee overlap', 'GET /api/attendees'],
          ]),
        ),
        ...pipeline('JUN 05', [
          row('11:03:34', 'Boot', 'warn', 'Cold start latency high — consider min-instances=1', 'event-scout-00007-abc', {
            label: 'TOOK',
            code: '4.2s',
          }),
          row('11:03:21', 'Boot', 'info', 'Container started', ':8080', { label: 'PID', code: '1' }),
        ]),
      ],
    },
  },
  {
    uid: 'app-4',
    memberUid: 'm-4',
    appId: 'deal-notes',
    name: 'Deal Notes Assistant',
    description: 'Turns raw call notes into a structured deal memo and syncs it to the team Notion workspace.',
    // Last deploy failed — the app still serves its previous revision, but the
    // creator needs the logs to see why the new one never went live.
    status: 'ERROR',
    notes: null,
    url: '',
    httpUrl: '',
    host: 'labs.pln',
    port: 443,
    deploymentId: 'dep-4',
    requiredEnvVars: ['ANTHROPIC_API_KEY', 'NOTION_TOKEN'],
    providedEnvVars: ['ANTHROPIC_API_KEY', 'NOTION_TOKEN'],
    createdAt: '2026-06-24T16:45:00.000Z',
    updatedAt: '2026-06-24T16:47:00.000Z',
    member: { uid: 'm-4', name: 'Arjun Patel', image: null },
    deployment: {
      provider: 'aws',
      region: 'us-east-1',
      instance: '0.25 vCPU / 0.5 GB',
      finishedAt: 'Jun 24, 2026 · 16:47',
      attempt: '#12',
      exitCode: 1,
      buildDuration: '2m 29s',
      retention: 'Last 24 hours',
      // Rolled back cleanly — users are still being served the older revision.
      serving: 'previous',
      failureReason: 'The container ran out of memory and was killed (exit 137) before it could pass a health check.',
      failureStream: 'runtime',
      // The build stream is clean all the way through — nothing here explains
      // the failure. The cause is in the runtime stream.
      buildLogs: pipeline('JUN 24', [
        row('16:45:02', 'Queue', 'info', 'Deploy queued on runner labos-ci', 'dep-4'),
        row('16:45:04', 'Build', 'info', 'Building image from source', 'deal-notes:sha-9a0f42b'),
        row('16:45:52', 'Build', 'success', 'Image built and pushed to Amazon ECR', 'deal-notes:sha-9a0f42b', {
          label: 'SIZE',
          code: '204 MB',
        }),
        row('16:45:54', 'Provision', 'info', 'Deploying to AWS App Runner in us-east-1', 'service deal-notes'),
        row('16:46:30', 'Provision', 'success', 'Task provisioned', '0.25 vCPU / 0.5 GB', {
          label: 'TOOK',
          code: '36s',
        }),
        row('16:46:31', 'Secrets', 'info', 'Injecting 2 secrets into the sandbox', 'ANTHROPIC_API_KEY, NOTION_TOKEN'),
        row('16:47:25', 'Release', 'error', 'New revision never became healthy — rolling back', 'deal-notes-00012', {
          label: 'EXIT',
          code: '1',
        }),
        row('16:47:31', 'Release', 'info', 'Rolled back — previous revision still serving traffic', 'deal-notes-00011', {
          label: 'EXIT',
          code: '0',
        }),
      ]),
      // Newest first, the way you read a tail. The OOM kill is the root cause.
      runtimeLogs: pipeline('JUN 24', [
        row('16:47:24', 'Crash', 'error', 'Health check attempt 3 of 3 failed — no healthy target', 'GET /healthz', {
          label: 'HTTP',
          code: '503',
        }),
        row('16:47:12', 'Crash', 'error', 'Container exited — OOMKilled: memory limit 0.5 GB exceeded', '0.25 vCPU / 0.5 GB', {
          label: 'EXIT',
          code: '137',
        }),
        row('16:47:09', 'Health', 'warn', 'Health check attempt 2 of 3 failed — connection reset', 'GET /healthz', {
          label: 'HTTP',
          code: '502',
        }),
        row('16:47:05', 'App', 'warn', 'Heap usage 94% of limit', '0.25 vCPU / 0.5 GB', {
          label: 'HEAP',
          code: '478 MB',
        }),
        row('16:46:54', 'Health', 'warn', 'Health check attempt 1 of 3 failed', 'GET /healthz', {
          label: 'HTTP',
          code: '502',
        }),
        row('16:46:47', 'App', 'info', 'Loading model context for memo draft', 'POST /api/memo', {
          label: 'HTTP',
          code: '200',
        }),
        row('16:46:33', 'Boot', 'info', 'Container started', ':8080', { label: 'PID', code: '1' }),
      ]),
    },
  },
  {
    uid: 'app-5',
    memberUid: 'm-5',
    appId: 'grant-tracker',
    name: 'Grant Tracker',
    description: 'Tracks open grant programs across the network and nudges teams before application deadlines.',
    // First deploy never built, so this app has never run — the runtime stream
    // is genuinely empty, not just quiet.
    status: 'ERROR',
    notes: null,
    url: '',
    httpUrl: '',
    host: 'labs.pln',
    port: 443,
    deploymentId: 'dep-5',
    requiredEnvVars: ['DIRECTORY_API_TOKEN'],
    providedEnvVars: ['DIRECTORY_API_TOKEN'],
    createdAt: '2026-07-02T08:12:00.000Z',
    updatedAt: '2026-07-02T08:13:00.000Z',
    member: { uid: 'm-5', name: 'Nina Chen', image: null },
    deployment: {
      provider: 'gcp',
      region: 'us-central1',
      instance: '1 vCPU / 512 MB',
      finishedAt: 'Jul 2, 2026 · 08:13',
      attempt: '#1',
      exitCode: 2,
      buildDuration: '1m 11s',
      retention: 'Last 24 hours',
      // First deploy never built — there is no earlier revision to fall back to.
      serving: 'none',
      failureReason: 'The build hit a type error in src/lib/grants.ts:42, so no image was ever produced.',
      failureStream: 'build',
      buildLogs: pipeline('JUL 02', [
        row('08:12:04', 'Queue', 'info', 'Deploy queued on runner labos-ci', 'dep-5'),
        row('08:12:06', 'Build', 'info', 'Building image from source', 'grant-tracker:sha-5e77c31'),
        row('08:12:31', 'Build', 'info', 'Installing dependencies', 'package.json', { label: 'TOOK', code: '25s' }),
        row('08:12:58', 'Build', 'warn', 'Peer dependency mismatch — react@18 expected', 'node_modules'),
        row('08:13:14', 'Build', 'error', 'Type error: property "amount" does not exist on type "Grant"', 'src/lib/grants.ts:42', {
          label: 'EXIT',
          code: '2',
        }),
        row('08:13:15', 'Build', 'error', 'Build failed — no image produced', 'grant-tracker:sha-5e77c31', {
          label: 'EXIT',
          code: '1',
        }),
        row('08:13:15', 'Release', 'error', 'Deploy aborted — app was never started', 'grant-tracker', {
          label: 'EXIT',
          code: '1',
        }),
      ]),
      runtimeLogs: [],
    },
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
  // Last deploy failed, but the previous revision is still serving traffic — so
  // the preview shows the older (working) version.
  'app-4': demoSrcDoc(
    'Deal Notes Assistant',
    '#c2410c',
    `<div class="card"><h2>Acme Corp — Series B</h2><p>Structured memo drafted from 42 min of call notes.</p>
       <a class="btn" href="#">Sync to Notion -&gt;</a></div>
     <div class="row">
       <div class="stat"><b>6</b><span>action items</span></div>
       <div class="stat"><b>3</b><span>risks flagged</span></div>
       <div class="stat"><b>42m</b><span>call length</span></div>
     </div>`,
  ),
  // Never built, so there is nothing to preview — the frame says so rather than
  // rendering blank.
  'app-5': demoSrcDoc(
    'Grant Tracker',
    '#8897ae',
    `<div class="card"><h2>Not deployed</h2><p>This app has never been built successfully, so there is no running
       version to preview. Open Deployment logs to see why the build failed.</p></div>`,
  ),
};

export const mockPageCopy = {
  title: 'AI Apps',
  description: 'A sandbox to deploy your AI apps on LabOS infra and explore what PL Infra team members are building.',
};

// Create-modal copy (prototype-local; mirrors production CreateAiAppModal constants).
export const createModalIntro =
  'The starter kit works whether you are building a new app or bringing one you have already built into LabOS infrastructure.';

export const createModalWhatsNewSections = [
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

export const createModalSteps = [
  {
    title: 'Download the starter kit',
    description: 'Click the button below to get Starter Kit v1.5 — a ready-to-use workspace for your AI coding tool.',
  },
  {
    title: 'Open it in your AI tool',
    description:
      'Unzip the folder and open it in Claude Code, Cursor, or similar. For an existing app, copy your project into the app folder so the agent can work with the included deploy instructions.',
  },
  {
    title: 'Describe what to build',
    description:
      'Tell your agent what you want. Frontend and backend are both supported - a UI-only page, or an app that talks to data and services (ChatGPT, email, a database, etc.). Your app can also use PL member context (name, photo, teams, and more) to personalize for the signed-in user. Your agent handles the technical setup.',
  },
  {
    title: 'Deploy',
    description:
      'Say "deploy this app", then: (1) Your agent suggests a name and short description — approve them (or ask for changes) before it continues. (2) Open the LabOS link your agent gives you, sign in, and click Approve. (3) Optional — if the backend needs access to data or external services, your agent will send a second LabOS link. Enter your secrets (API keys / passwords) there and click Deploy. Never paste keys in chat. When done, open the app from the AI Apps dashboard.',
  },
];

export const createModalSecurityNote =
  'This download is tied to your LabOS account and acts on your behalf. Do not share it with others - anyone with it could deploy apps under your name.';

export const mockStarterKitVersion = '1.5';
