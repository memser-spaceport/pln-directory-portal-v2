/** Leaves the digest page for `url` in the same tab. Its own module so tests can stand in for the navigation. */
export function leavePage(url: string) {
  window.location.assign(url);
}
