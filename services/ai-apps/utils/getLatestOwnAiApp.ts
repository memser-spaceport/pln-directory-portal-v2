import type { AiApp } from '../ai-apps.service';

/**
 * The member's own most recently updated app (LAB-3136), or null when they created none. Apps by other members that
 * the list shows them do not count: only the creator (`memberUid`) can redeploy an app from their agent.
 */
export function getLatestOwnAiApp(apps: AiApp[], memberUid: string | null | undefined): AiApp | null {
  if (!memberUid) return null;
  // A missing or malformed date sorts last instead of poisoning every comparison (NaN).
  const time = (app: AiApp) => Date.parse(app.updatedAt) || 0;
  let latest: AiApp | null = null;
  for (const app of apps) {
    if (app.memberUid !== memberUid) continue;
    if (!latest || time(app) > time(latest)) latest = app;
  }
  return latest;
}
