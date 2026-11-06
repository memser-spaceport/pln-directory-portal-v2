/**
 * Runs once when the server starts, before any page renders. Next patches `fetch` for its cache only when the first
 * page loads, so the wrapper installed here sits under that cache rather than on top of it.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return;
  }
  const { installFrontendRenderToken } = await import('./utils/frontend-render-token');
  installFrontendRenderToken();
}
