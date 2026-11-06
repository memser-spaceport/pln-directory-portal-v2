import type { AiApp } from '../ai-apps.service';

/**
 * The member's own most recently updated app (LAB-3136), or null when they created none.
 * The list records the creator on `member.uid` — the API replaces `memberUid` with `member` —
 * and the AI Apps page matches that field to the signed-in member's session uid. Apps by
 * other members that the list shows them do not count.
 */
export function getLatestOwnAiApp(apps: AiApp[], sessionUid: string | null | undefined): AiApp | null {
  if (!sessionUid) return null;
  // A missing or malformed date sorts last instead of poisoning every comparison (NaN).
  const time = (app: AiApp) => Date.parse(app.updatedAt) || 0;
  let latest: AiApp | null = null;
  for (const app of apps) {
    if (app.member?.uid !== sessionUid) continue;
    if (!latest || time(app) > time(latest)) latest = app;
  }
  return latest;
}
