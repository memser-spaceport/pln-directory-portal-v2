/**
 * The team whose Edit Profile Details form is on screen. The four locations are
 * the ones a tester used on the LAB-2830 feature env, so the Current version
 * reproduces the screenshot the feedback came with.
 *
 * Shaped like the slice of `ITeam` the form reads; `locations[0]` is the HQ,
 * which is the data contract the feature ships (`location = locations[0]`).
 */
export type TMockTeam = {
  name: string;
  shortDescription: string;
  dateFounded: string;
  teamSize: string;
  locations: string[];
};

export const mockTeam: TMockTeam = {
  name: 'Black Sea Labs',
  shortDescription: 'Peer-to-peer storage tooling for teams building on Filecoin.',
  dateFounded: '2019',
  teamSize: '11-50',
  locations: ['Burgas', 'Sofia', 'Varna', 'Odessa'],
};

/**
 * The rest of the team page, below the card being edited. Scaffolding: it exists
 * so the page is long enough to scroll the editor away, which is when the save
 * status bar appears. Drawn muted, as every other card is while one is open.
 */
export const mockOtherSections: { title: string; rows: string[] }[] = [
  {
    title: 'Contact Details',
    rows: ['blacksealabs.io', 'hello@blacksealabs.io', 'linkedin.com/company/black-sea-labs'],
  },
  {
    title: 'Members (6)',
    rows: [
      'Elena Petrova · Founder',
      'Dmytro Koval · Engineering lead',
      'Ivan Georgiev · Protocol engineer',
      'Mariya Dimitrova · Product',
      'Oleh Bondar · Infrastructure',
      'Nikolay Stoyanov · Developer relations',
    ],
  },
  {
    title: 'Focus Areas',
    rows: ['Digital Human Rights', 'Public Goods', 'Innovation Network'],
  },
  {
    title: 'Projects (2)',
    rows: ['Anchor — deal storage monitor for Filecoin providers', 'Tidepool — retrieval cache for IPFS gateways'],
  },
];

/** Same cap the feature ships (`MAX_TEAM_LOCATIONS` in EditTeamDetailsForm/helpers.ts). */
export const MAX_TEAM_LOCATIONS = 10;
