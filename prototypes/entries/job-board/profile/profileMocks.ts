/**
 * The lists the drawer's project select and the Repositories card read from.
 *
 * Neither has an equivalent on the board — the board knows about hiring teams,
 * not projects or repos — so both are mocked here with PL-shaped names, because
 * a prototype that shows plausible answers is read as the product and one that
 * shows "Project A" is read as a wireframe.
 *
 * (Teams are not here: the drawer's Teams card is gone, and its select used to
 * read `MOCK_JOB_GROUPS` from the board's own `mocks.ts` so that "teams I belong
 * to" and "teams hiring here" were the same organisations.)
 */

/** Production fills this select from `useMemberFormOptions().projects`. */
export const MOCK_PROJECTS: string[] = ['IPFS', 'libp2p', 'Filecoin', 'drand', 'Bacalhau', 'IPLD', 'Kubo', 'Lotus'];

export interface MockRepository {
  name: string;
  description: string;
  url: string;
}

/**
 * Production derives these from the GitHub API for the saved handle, which is why
 * its list has no editor. Here the handle is real input and the repositories are
 * the derived half — mocked, but keyed to whatever handle was typed, so the rows
 * and the profile link point at one account instead of two.
 */
export function mockRepositories(handle: string): MockRepository[] {
  const owner = handle.trim() || 'octocat';
  const repos = [
    { name: 'go-libp2p-relay', description: 'Circuit relay v2 transport, with connection reuse and metrics.' },
    { name: 'ipld-explorer', description: 'A small CLI for walking IPLD DAGs and diffing two roots.' },
    { name: 'dotfiles', description: 'Shell, editor and git configuration. Mostly zsh and neovim.' },
  ];
  return repos.map((r) => ({ ...r, url: `https://github.com/${owner}/${r.name}` }));
}
