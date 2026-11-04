import type { AiApp } from '../ai-apps.service';

/**
 * The member's own most recently updated app (LAB-3136), or null when they created none. Apps by other members that
 * the list shows them do not count: only the creator (`memberUid`) can redeploy an app from their agent.
 */
export function getLatestOwnAiApp(apps: AiApp[], memberUid: string | null | undefined): AiApp | null {
  if (!memberUid) return null;
  let latest: AiApp | null = null;
  for (const app of apps) {
    if (app.memberUid !== memberUid) continue;
    if (!latest || Date.parse(app.updatedAt) > Date.parse(latest.updatedAt)) latest = app;
  }
  return latest;
}
