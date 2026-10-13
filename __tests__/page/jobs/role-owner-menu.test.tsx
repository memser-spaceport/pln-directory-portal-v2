import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

/**
 * A team's own role row: three controls collapse into one ⋯.
 *
 * The row is shared with the job board, where an applicant needs Refer, Share
 * and the way in at a glance — so "off unless the viewer owns the listing" is
 * the contract, and the negative cases are the ones that matter.
 */

const analytics = {
  onJobClicked: jest.fn(),
  onJobReferClicked: jest.fn(),
  onJobReferShared: jest.fn(),
  onJobReferShareMenuOpened: jest.fn(),
};
jest.mock('@/analytics/jobs.analytics', () => ({ useJobsAnalytics: () => analytics }));

jest.mock('@/prototypes/entries/job-board/components/ReferModal/ReferModal', () => ({
  ReferModal: ({ open }: { open: boolean }) => (open ? <div data-testid="refer-modal" /> : null),
}));

jest.mock('@/services/jobs/hooks/useJobApplications', () => ({
  useRoleApplication: () => null,
}));

import { ReferRoleRow } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow';
import { describeListingOrigin } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/components/RoleOwnerMenu/RoleOwnerMenu';
import type { IJobRole } from '@/types/jobs.types';
import type { IUserInfo } from '@/types/shared.types';

const ROLE: IJobRole = {
  uid: 'role-1',
  roleTitle: 'Community Manager',
  roleCategory: 'GTM/Marketing',
  seniority: null,
  location: [],
  workMode: null,
  applyUrl: 'https://acme.example/jobs/1',
  lastUpdated: '2026-05-01T00:00:00.000Z',
  postedDate: '2026-05-01T00:00:00.000Z',
  detectionDate: null,
};

const MEMBER = { uid: 'm1', name: 'Polina', email: 'p@example.com' } as unknown as IUserInfo;
const TEAM = { uid: 'team-1', name: 'Acme', logoUrl: null, focusAreas: [], subFocusAreas: [], jobReferEmail: null };

const renderRow = (ownsListing?: boolean) =>
  render(
    <ReferRoleRow
      role={ROLE}
      teamId="team-1"
      teamName="Acme"
      team={TEAM}
      currentUser={MEMBER}
      source="team-profile"
      ownsListing={ownsListing}
    />,
  );

const trigger = () => screen.queryByRole('button', { name: /Actions for Community Manager/ });

beforeEach(() => jest.clearAllMocks());

describe('a role row the viewer does not own', () => {
  it('keeps its controls where an applicant expects them', () => {
    renderRow(false);

    expect(screen.getByRole('button', { name: 'Refer' })).toBeInTheDocument();
    expect(trigger()).not.toBeInTheDocument();
  });

  /* The default matters as much as the flag: the board renders this row for
     every visitor and passes nothing. */
  it('is the default, with the prop absent', () => {
    renderRow(undefined);

    expect(screen.getByRole('button', { name: 'Refer' })).toBeInTheDocument();
    expect(trigger()).not.toBeInTheDocument();
  });
});

/**
 * The team profile drops the button; the board keeps it.
 *
 * With the in-app description on, the title and **View job** open the same
 * drawer — "one door with two handles", as the row's own note puts it. On a
 * team's own page every row belongs to the team being read, so the handle
 * repeats an offer the titles already make; on the board it is the one action a
 * scanner has.
 */
describe('the View job button', () => {
  it('is there by default', () => {
    render(
      <ReferRoleRow
        role={ROLE}
        teamId="team-1"
        teamName="Acme"
        team={TEAM}
        currentUser={MEMBER}
        source="job-board"
        apply={{ onApply: jest.fn(), onViewJob: jest.fn(), memberUid: 'm1' }}
      />,
    );

    expect(screen.getByRole('button', { name: 'View job' })).toBeInTheDocument();
  });

  it('is dropped where the host asks', () => {
    render(
      <ReferRoleRow
        role={ROLE}
        teamId="team-1"
        teamName="Acme"
        team={TEAM}
        currentUser={MEMBER}
        source="team-profile"
        apply={{ onApply: jest.fn(), onViewJob: jest.fn(), memberUid: 'm1' }}
        hideViewJob
      />,
    );

    expect(screen.queryByRole('button', { name: 'View job' })).not.toBeInTheDocument();
    /* The row keeps its other presses — this drops one button, not the slot. */
    expect(screen.getByRole('button', { name: 'Refer' })).toBeInTheDocument();
  });

  /**
   * The title is the door that remains, and it has to still open the drawer —
   * dropping the button must not quietly turn the row into a dead end.
   *
   * It is a `<a href="/jobs/openings/…">` rather than a button now: a permalink
   * crawlers and open-in-new-tab can reach, whose unmodified click is
   * intercepted into the in-app reading. So the assertion is that a plain click
   * still lands in the drawer, not that the element is a button.
   */
  it('leaves the title opening the same drawer', async () => {
    const onViewJob = jest.fn();
    render(
      <ReferRoleRow
        role={ROLE}
        teamId="team-1"
        teamName="Acme"
        team={TEAM}
        currentUser={MEMBER}
        source="team-profile"
        apply={{ onApply: jest.fn(), onViewJob, memberUid: 'm1' }}
        hideViewJob
      />,
    );

    await userEvent.click(screen.getByRole('link', { name: ROLE.roleTitle }));

    expect(onViewJob).toHaveBeenCalled();
  });
});

describe('a role row the viewer owns', () => {
  it('shows one ⋯ and none of the three controls', () => {
    renderRow(true);

    expect(trigger()).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Refer' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /View job/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Apply to Community Manager/ })).not.toBeInTheDocument();

    /* The share icon too, which nothing named can catch: `ReferMenu`'s trigger
       is an unlabelled span. Asserted as "the ⋯ is the row's only popup
       trigger", which is the actual rule — one cluster, not two. */
    const popupTriggers = [...document.querySelectorAll('[aria-haspopup="menu"]')];
    expect(popupTriggers).toHaveLength(1);
    expect(popupTriggers[0]).toBe(trigger());
  });

  it('holds the posting, Refer and Share behind it', async () => {
    renderRow(true);

    await userEvent.click(trigger()!);
    const popup = await screen.findByRole('menu');

    expect(within(popup).getByRole('menuitem', { name: /View posting/ })).toHaveAttribute(
      'href',
      expect.stringContaining('acme.example'),
    );
    expect(within(popup).getByRole('menuitem', { name: 'Refer' })).toBeInTheDocument();
    expect(within(popup).getByRole('menuitem', { name: /Share/ })).toBeInTheDocument();
  });

  /* The row owns the Refer modal; the menu only asks for it. */
  it('opens the row’s Refer modal from the menu', async () => {
    renderRow(true);

    await userEvent.click(trigger()!);
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Refer' }));

    expect(await screen.findByTestId('refer-modal')).toBeInTheDocument();
    expect(analytics.onJobReferClicked).toHaveBeenCalled();
  });

  it('heads the menu with where the listing came from', async () => {
    renderRow(true);

    await userEvent.click(trigger()!);

    expect(await screen.findByText('From acme.example')).toBeInTheDocument();
  });

  /**
   * The design also draws `Mark inactive` / `Bring back` and `Delete`. Neither
   * is here: `IJobRole` has no status field and the API has no team-side write
   * for a listing, so either item would be a claim about what the public board
   * shows that nothing behind it can keep. Pinned so they cannot arrive as
   * decoration before the endpoints do.
   */
  it('offers nothing it cannot actually do', async () => {
    renderRow(true);

    await userEvent.click(trigger()!);
    const popup = await screen.findByRole('menu');

    expect(within(popup).queryByText(/Mark inactive|Bring back|Delete/)).not.toBeInTheDocument();
  });
});

/**
 * The heading is read off the posting URL, because that IS the origin —
 * production has no `ListingOrigin` model, and "Submitted by you" would name a
 * route (a team posting a job in-app) that does not exist.
 */
describe('describeListingOrigin', () => {
  it('names the host the posting came from', () => {
    expect(describeListingOrigin('https://boards.greenhouse.io/acme/jobs/1')).toBe('From boards.greenhouse.io');
  });

  /* `www.` is noise on a heading this small. */
  it('drops a www', () => {
    expect(describeListingOrigin('https://www.fil.org/careers')).toBe('From fil.org');
  });

  /* Host only: every ATS this ingests from puts a slug or an id in the first
     path segment, and a heading that wraps is worse than one fact less. */
  it('says nothing about the path', () => {
    expect(describeListingOrigin('https://acme.example/careers/engineering/123')).toBe('From acme.example');
  });

  /**
   * Both real states. The ingest carries roles whose source link it could not
   * resolve, and it stores whatever the source gave it — so a missing URL and a
   * value that is not a URL both have to end in no heading rather than a heading
   * that says nothing or a render that throws.
   */
  it('has no heading without a usable URL', () => {
    expect(describeListingOrigin(null)).toBeNull();
    expect(describeListingOrigin(undefined)).toBeNull();
    expect(describeListingOrigin('')).toBeNull();
    expect(describeListingOrigin('not a url')).toBeNull();
  });
});
