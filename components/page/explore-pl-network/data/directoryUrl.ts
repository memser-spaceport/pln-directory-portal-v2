import type { PortfolioTeam } from './portfolio';

/**
 * The project's directory page for a project entry; the team's directory profile
 * when the portfolio API returned it; otherwise (no uid, or a uid the API left
 * out, such as an inactive team) a directory search by name. Relative, so it
 * follows whichever environment serves the page.
 */
export function directoryUrl(team: PortfolioTeam): string {
  if (team.projectUid) return `/projects/${team.projectUid}`;
  return team.uid && team.source === 'db' ? `/teams/${team.uid}` : `/teams?searchBy=${encodeURIComponent(team.name)}`;
}

/** The directory's name where matched; marketing's otherwise (the merge already picked it). */
export function displayNameOf(team: PortfolioTeam): string {
  return team.name;
}
