/**
 * The "Submit an event" link. It goes through the event portal's LabOS sign-in start route, so a member
 * signed in to LabOS reaches the submit form without a second login. `IRL_SUBMIT_FORM_URL` is the portal's
 * events URL (for example `https://irl.os.pl.xyz/events`); only its origin is used.
 */
export function getSubmitEventUrl(base: string | undefined = process.env.IRL_SUBMIT_FORM_URL): string {
  try {
    const url = new URL('/auth/labos', new URL(base ?? '').origin);
    url.searchParams.set('returnUrl', '/events/add');
    return url.toString();
  } catch {
    return `${base ?? ''}/add`;
  }
}
