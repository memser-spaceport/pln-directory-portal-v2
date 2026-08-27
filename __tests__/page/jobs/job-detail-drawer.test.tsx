import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

/**
 * The reading step.
 *
 * The panel that matters most here is the one nobody designed for: production
 * carries no job description at all, so until the ingest starts sending a body
 * the empty state IS this drawer. Testing it is testing what actually ships the
 * day `SHOW_JOB_DETAIL` flips — which is why it gets more attention below than
 * the populated case.
 */

jest.mock('@/components/page/jobs/TeamGroupCard/hooks/useGetFocusTags', () => ({
  useGetFocusTags: () => [],
}));

jest.mock('@/components/common/Drawer', () => ({
  Drawer: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
    isOpen ? <div>{children}</div> : null,
}));

import { JobDetailDrawer } from '@/components/page/jobs/JobDetailDrawer/JobDetailDrawer';
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

const onApply = jest.fn();
const onClose = jest.fn();

const renderDrawer = (props: Partial<React.ComponentProps<typeof JobDetailDrawer>> = {}) =>
  render(
    <JobDetailDrawer
      open
      onClose={onClose}
      role={role()}
      team={team}
      onApply={onApply}
      applied={false}
      loggedIn
      source="job-board"
      {...props}
    />,
  );

describe('the job detail drawer', () => {
  beforeEach(() => jest.clearAllMocks());

  it('leads with the role, under the team that posted it', () => {
    renderDrawer();

    expect(screen.getByRole('heading', { name: 'Protocol Engineer' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Lattice Compute' })).toBeInTheDocument();
  });

  /** The two facts the row had no room for — work mode, and the full location. */
  it('carries the meta the row could not fit', () => {
    renderDrawer();

    expect(screen.getByText(/Senior · Engineering · Berlin · Remote/i)).toBeInTheDocument();
  });

  it('hands Apply straight to the flow that owns the gates', () => {
    renderDrawer();

    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(onApply).toHaveBeenCalledTimes(1);
    // Not closed by the drawer: the flow replaces this step with whatever it
    // decides, and a close of our own would land on the step that replaced it.
    expect(onClose).not.toHaveBeenCalled();
  });

  describe('with no description — every job, today', () => {
    /**
     * The honest empty state. It must not apologise, must not look like
     * something failed to load, and must name the one place the description
     * actually is.
     */
    it('says where the description is and links to it', () => {
      renderDrawer();

      expect(screen.getByText(/Lattice Compute hasn't shared a description here yet/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Read the original posting/i })).toHaveAttribute(
        'href',
        expect.stringContaining('https://example.com/apply'),
      );
    });

    /** No link to offer, so the sentence must not imply one exists. */
    it('does not promise a posting that is not there', () => {
      renderDrawer({ role: role({ applyUrl: null }) });

      expect(screen.getByText(/there's no posting to link to/i)).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /original posting/i })).not.toBeInTheDocument();
    });

    /** Applying is still the point — the missing body changes what you can read,
     *  not what you can do. */
    it('still offers Apply', () => {
      renderDrawer({ role: role({ applyUrl: null }) });

      expect(screen.getByRole('button', { name: 'Apply' })).toBeInTheDocument();
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
      renderDrawer({ role: withBody });

      expect(screen.getByText(/We are hiring a protocol engineer/)).toBeInTheDocument();
      expect(screen.queryByText(/hasn't shared a description/i)).not.toBeInTheDocument();
    });

    /** As markup, not as flattened text — the whole point of taking HTML. */
    it("keeps the posting's own structure", () => {
      renderDrawer({ role: withBody });

      expect(screen.getByRole('heading', { name: 'Responsibilities' })).toBeInTheDocument();
      expect(screen.getByRole('listitem')).toHaveTextContent('Own the transport layer');
    });

    /** With something to read in the panel, the outbound link goes back to being
     *  a stamp in the metadata row rather than the empty state's main event. */
    it('demotes the posting link to a stamp', () => {
      renderDrawer({ role: withBody });

      expect(screen.getByRole('link', { name: /^Original posting$/i })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /Read the original posting/i })).not.toBeInTheDocument();
    });

    /** The body is third-party markup and the app ships no CSP, so the drawer
     *  must not be the place a scraped script gets to run. */
    it('renders it sanitized', () => {
      const { container } = renderDrawer({
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
     * A body that sanitizes down to nothing is not a description. Both of these
     * are truthy strings — the check has to run on the sanitized output, or the
     * panel shows an empty section under a heading instead of saying where the
     * posting is.
     */
    it.each([['   '], ['<a></a>'], ['<img src="https://cdn.test/x.png" />']])(
      'treats %s as no description at all',
      (descriptionHtml) => {
        renderDrawer({ role: role({ descriptionHtml }) });

        expect(screen.getByText(/hasn't shared a description here yet/i)).toBeInTheDocument();
      },
    );
  });

  /**
   * The footer's sentence changes with what the press will actually do — a
   * footer promising "one press" to someone with no account would be describing
   * a different person's experience of the same button.
   */
  describe('the footer hint', () => {
    it.each([
      [{ loggedIn: false }, /you will set one up in the next step/i],
      [{ loggedIn: true }, /One press sends your PL profile/i],
    ])('matches the viewer %s', (props, expected) => {
      renderDrawer(props);

      expect(screen.getByText(expected)).toBeInTheDocument();
    });
  });

  /* This drawer used to have a second Apply: an unapproved member got an
     outbound `<a>` to the hiring team's own posting instead of the in-app
     letter, and the footer said "You'll apply on their site". Approval no longer
     gates applying, so there is one Apply for everyone.

     Guarded rather than simply deleted, because the failure mode is silent — a
     reintroduced branch would still render something called "Apply" and only the
     element type would give it away. */
  describe('one Apply, whatever the account state', () => {
    it('is always the in-app button, never an outbound link', () => {
      renderDrawer();

      expect(screen.getByRole('button', { name: 'Apply' })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Apply' })).not.toBeInTheDocument();
    });

    /* Reading the ad and applying were always two different acts, and only one
       of them changed. The posting link survives on its own. */
    it('still links out to the original posting', () => {
      renderDrawer();

      const posting = screen.getByRole('link', { name: /Read the original posting/i });
      expect(posting).toHaveAttribute('href', expect.stringContaining('https://example.com/apply'));
    });

    it('offers Apply even when there is no posting to link to', () => {
      renderDrawer({ role: role({ applyUrl: null }) });

      expect(screen.getByRole('button', { name: 'Apply' })).toBeInTheDocument();
    });
  });

  describe('once applied', () => {
    it('reports the application instead of offering again', () => {
      renderDrawer({ applied: true, appliedAt: '2026-08-01T00:00:00.000Z' });

      expect(screen.queryByRole('button', { name: 'Apply' })).not.toBeInTheDocument();
      const applied = screen.getByRole('button', { name: /Applied/ });
      expect(applied).toBeDisabled();
    });

    /** Having applied is no reason to stop being able to reread the job — the
     *  masthead and body are untouched. */
    it('still shows the job', () => {
      renderDrawer({ applied: true, appliedAt: '2026-08-01T00:00:00.000Z' });

      expect(screen.getByRole('heading', { name: 'Protocol Engineer' })).toBeInTheDocument();
    });
  });
});
