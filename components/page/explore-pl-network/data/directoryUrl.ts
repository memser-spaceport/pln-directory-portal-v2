import type { PortfolioLogo } from './islands';
import { TEAM_INFO } from './teamInfo';

/**
 * The team's directory profile when the snapshot matched the logo to a uid;
 * otherwise a directory search by marketing's name. Relative, so it follows
 * whichever environment serves the page.
 */
export function directoryUrl(logo: PortfolioLogo): string {
  const uid = TEAM_INFO[logo.id]?.uid;
  return uid ? `/teams/${uid}` : `/teams?searchBy=${encodeURIComponent(logo.name)}`;
}

/** The directory's own name where matched; marketing's caps otherwise. */
export function displayNameOf(logo: PortfolioLogo): string {
  return TEAM_INFO[logo.id]?.displayName ?? logo.name;
}
