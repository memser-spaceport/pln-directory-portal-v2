import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

/**
 * The reading step.
 *
 * The empty state gets more attention here than the populated case, and it still
 * earns it. It used to be because there were almost no descriptions — 11 of 91
 * roles on dev, which is what kept this screen behind a flag. Coverage arrived
 * (83 of 92) and the flag is gone, but the remainder are exactly the roles where
 * this screen has nothing of its own to show, so what it says instead is the
 * part most worth pinning.
 */

jest.mock('@/components/page/jobs/TeamGroupCard/hooks/useGetFocusTags', () => ({
  useGetFocusTags: () => [],
}));

jest.mock('@/components/common/Drawer', () => ({
  Drawer: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
    isOpen ? <div>{children}</div> : null,
}));

import { JobDetailPane } from '@/components/page/jobs/JobDetailPane/JobDetailPane';
import type { IJobRole, IJobTeam } from '@/types/jobs.types';

const team: IJobTeam = {
  uid: 'team-1',
  name: 'Lattice Compute',
  logoUrl: null,
  focusAreas: [],
  subFocusAreas: [],
  jobReferEmail: null,
};

const role = (overrides: Partial<IJobRole> = {}): IJobRole => ({
  uid: 'role-1',
  roleTitle: 'Protocol Engineer',
  roleCategory: 'Engineering',
  seniority: 'senior',
  location: ['Berlin'],
  workMode: 'remote',
  applyUrl: 'https://example.com/apply',
  lastUpdated: '2026-08-01T00:00:00.000Z',
  postedDate: '2026-08-01T00:00:00.000Z',
  detectionDate: null,
  ...overrides,
});

const renderPane = (props: Partial<React.ComponentProps<typeof JobDetailPane>> = {}) =>
  render(<JobDetailPane role={role()} team={team} applied={false} source="job-board" showOriginalPosting {...props} />);

describe('the job detail pane', () => {
  beforeEach(() => jest.clearAllMocks());

  it('leads with the role, under the team that posted it', () => {
    renderPane();

    expect(screen.getByRole('heading', { name: 'Protocol Engineer' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Lattice Compute' })).toBeInTheDocument();
  });

  /** The two facts the row had no room for — work mode, and the full location. */
  it('carries the meta the row could not fit', () => {
    renderPane();

    expect(screen.getByText(/Senior · Engineering · Berlin · Remote/i)).toBeInTheDocument();
  });

  describe('with no description — every job, today', () => {
    /**
     * The honest empty state. It must not apologise, must not look like
     * something failed to load, and must name the one place the description
     * actually is.
     */
    it('says where the description is and links to it', () => {
      renderPane();

      expect(screen.getByText(/Lattice Compute hasn't shared a description here yet/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Read the original posting/i })).toHaveAttribute(
        'href',
        expect.stringContaining('https://example.com/apply'),
      );
    });

    /** No link to offer, so the sentence must not imply one exists. */
    it('does not promise a posting that is not there', () => {
      renderPane({ role: role({ applyUrl: null }) });

      expect(screen.getByText(/there's no posting to link to/i)).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /original posting/i })).not.toBeInTheDocument();
    });
  });

  describe('with a description', () => {
    /* The shape a Gem-scraped posting actually arrives in: <br />-separated
       spans, a <strong> acting as a heading, and a list. */
    const withBody = role({
      descriptionHtml:
        '<strong>About Us:</strong><br /><span>We are hiring a protocol engineer.</span>' +
        '<h3>Responsibilities</h3><ul><li>Own the transport layer</li></ul>',
    });

    it('renders the posting body the ingest carried', () => {
      renderPane({ role: withBody });

      expect(screen.getByText(/We are hiring a protocol engineer/)).toBeInTheDocument();
      expect(screen.queryByText(/hasn't shared a description/i)).not.toBeInTheDocument();
    });

    /** As markup, not as flattened text — the whole point of taking HTML. */
    it("keeps the posting's own structure", () => {
      renderPane({ role: withBody });

      expect(screen.getByRole('heading', { name: 'Responsibilities' })).toBeInTheDocument();
      expect(screen.getByRole('listitem')).toHaveTextContent('Own the transport layer');
    });

    /** With something to read in the panel, the outbound link goes back to being
     *  a stamp in the metadata row rather than the empty state's main event. */
    it('demotes the posting link to a stamp', () => {
      renderPane({ role: withBody });

      expect(screen.getByRole('link', { name: /^Original posting$/i })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /Read the original posting/i })).not.toBeInTheDocument();
    });

    /** The body is third-party markup and the app ships no CSP, so the drawer
     *  must not be the place a scraped script gets to run. */
    it('renders it sanitized', () => {
      const { container } = renderPane({
        role: role({
          descriptionHtml:
            '<p onclick="alert(1)">Real copy</p><script>alert(1)</script>' +
            '<a href="https://jobs.example.com/x">Apply on our site</a>',
        }),
      });

      expect(container.querySelector('script')).toBeNull();
      expect(container.querySelector('[onclick]')).toBeNull();
      // A link it can honour still opens away from the drawer.
      const link = screen.getByRole('link', { name: 'Apply on our site' });
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    /**
     * One ingest — Protocol Labs' own board — ships bodies whose markdown
     * converter half ran. The pane repairs those before sanitizing, so all
     * three defects have to be gone by the time this renders. The unit cases
     * live in `__tests__/utils/normalizeJobDescriptionHtml.test.ts`; this is
     * the one that proves the pane composes the two in the right order.
     */
    it('repairs the artifacts one ingest ships', () => {
      renderPane({
        role: role({
          descriptionHtml:
            '<p>[Protocol Labs](https://protocol.ai/) is an innovation network.</p>' +
            '<p><strong>Ecosystem Growth &amp;amp; Network Effects</strong></p>' +
            '<ul><li>Design growth loops</li></ul><ul><li>Build distribution</li></ul>',
        }),
      });

      // The markdown link became a link, not brackets and a raw URL.
      const link = screen.getByRole('link', { name: 'Protocol Labs' });
      expect(link).toHaveAttribute('href', 'https://protocol.ai/');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');

      // The double-escaped ampersand reads as one character.
      expect(screen.getByText('Ecosystem Growth & Network Effects')).toBeInTheDocument();

      // One list of two, not two lists of one — which is what a screen reader
      // announces, and what the `li` spacing rule is written for.
      expect(screen.getAllByRole('list')).toHaveLength(1);
      expect(screen.getAllByRole('listitem')).toHaveLength(2);
    });

    /**
     * A body that sanitizes down to nothing is not a description. Both of these
     * are truthy strings — the check has to run on the sanitized output, or the
     * panel shows an empty section under a heading instead of saying where the
     * posting is.
     */
    it.each([['   '], ['<a></a>'], ['<img src="https://cdn.test/x.png" />']])(
      'treats %s as no description at all',
      (descriptionHtml) => {
        renderPane({ role: role({ descriptionHtml }) });

        expect(screen.getByText(/hasn't shared a description here yet/i)).toBeInTheDocument();
      },
    );
  });

  /**
   * The footer's sentence changes with what the press will actually do — a
   * footer promising "one press" to someone with no account would be describing
   * a different person's experience of the same button.
   */
  /* (The footer's hint, its Apply button and the Applied report were asserted
      here. They belong to `JobApplyFlowDrawer` now — one bar for all three
      steps — so the assertions moved with them rather than being dropped.
      What is left here is the content, which is what this file is about.) */

  /* The way out to the team's own careers page is withheld from the two people
     who came here to apply through this board — someone with no account, and a
     Job Aspirant. The pane is told, rather than working it out: see
     `canSeeOriginalPosting`. */
  describe('when the viewer is not offered the original posting', () => {
    /* The stamp only ever renders alongside a description, so this needs one. */
    const withBody = role({ descriptionHtml: '<p>We are hiring a protocol engineer.</p>' });

    it('drops the masthead stamp', () => {
      renderPane({ role: withBody, showOriginalPosting: false });

      expect(screen.queryByRole('link', { name: /Original posting/i })).not.toBeInTheDocument();
      // The description is still the point of the screen.
      expect(screen.getByText(/hiring a protocol engineer/i)).toBeInTheDocument();
    });

    it('drops the empty state link', () => {
      renderPane({ showOriginalPosting: false });

      expect(screen.queryByRole('link', { name: /Read the original posting/i })).not.toBeInTheDocument();
    });

    /* The part worth guarding: the empty state's sentence names where the ad
       lives. Saying that and then not linking to it is worse than not raising
       it, so the sentence has to change with the link. */
    it('stops claiming the posting is on the team site', () => {
      renderPane({ showOriginalPosting: false });

      expect(screen.queryByText(/on their own site/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Applying still sends them your profile/i)).toBeInTheDocument();
    });
  });

  describe('once applied', () => {
    /* The stamp, which is this pane's half of the applied state — the "Applied"
       control it used to sit beside is the flow's footer now. */
    it('dates the application in the masthead instead of the posting age', () => {
      renderPane({ applied: true, appliedAt: '2026-08-01T00:00:00.000Z' });

      expect(screen.getByText(/^Applied/)).toBeInTheDocument();
    });

    /** Having applied is no reason to stop being able to reread the job — the
     *  masthead and body are untouched. */
    it('still shows the job', () => {
      renderPane({ applied: true, appliedAt: '2026-08-01T00:00:00.000Z' });

      expect(screen.getByRole('heading', { name: 'Protocol Engineer' })).toBeInTheDocument();
    });
  });
});
