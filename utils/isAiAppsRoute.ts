/**
 * The AI Apps surfaces (`/pl-infra/ai-apps` and below). They draw their own
 * floating feedback button, so the LabOS-wide one stays off them (LAB-2879).
 */
export function isAiAppsRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname === '/pl-infra/ai-apps' || pathname.startsWith('/pl-infra/ai-apps/');
}
