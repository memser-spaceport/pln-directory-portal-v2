import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { ReferMenu } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/components/ReferMenu';
import { jobBoardShareUrl } from '@/services/jobs/job-detail-link';
import type { IJobRole } from '@/types/jobs.types';

const onJobReferShared = jest.fn();
const onJobReferShareMenuOpened = jest.fn();

jest.mock('@/analytics/jobs.analytics', () => ({
  useJobsAnalytics: () => ({
    onJobReferShared: (...args: unknown[]) => onJobReferShared(...args),
    onJobReferShareMenuOpened: (...args: unknown[]) => onJobReferShareMenuOpened(...args),
  }),
}));

const role: IJobRole = {
  uid: 'role-1',
  roleTitle: 'Protocol Engineer',
  roleCategory: 'Engineering',
  seniority: 'senior',
  location: ['Berlin'],
  workMode: 'remote',
  applyUrl: 'https://greenhouse.example/apply',
  lastUpdated: '2026-08-01T00:00:00.000Z',
  postedDate: '2026-08-01T00:00:00.000Z',
  detectionDate: null,
};

const CANONICAL = 'http://localhost/jobs/openings/role-1';
/** What a shared link carries so the arrival can be attributed back to the share. */
const shared = (channel: string) => `${CANONICAL}?utm_source=job_refer_share&utm_medium=${channel}`;
/** Copy link shares the board deep link instead — note the `&` before the UTMs. */
const COPIED = 'http://localhost/jobs?job=role-1&utm_source=job_refer_share&utm_medium=copy_link';

const writeText = jest.fn().mockResolvedValue(undefined);
beforeAll(() => {
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
});

let windowOpenSpy: jest.SpyInstance;
beforeEach(() => {
  jest.clearAllMocks();
  windowOpenSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
});
afterEach(() => {
  windowOpenSpy.mockRestore();
  window.history.replaceState(null, '', '/');
});

const openMenu = () => fireEvent.click(document.querySelector('[aria-haspopup="menu"]') as HTMLElement);

describe('ReferMenu', () => {
  it('copies the board deep link, never the opening page, the posting, or location.href', async () => {
    window.history.replaceState(null, '', '/jobs?roleCategory=Engineering&job=other-role');
    render(<ReferMenu role={role} teamId="team-1" teamName="Lattice Compute" source="job-board" />);
    openMenu();

    fireEvent.click(screen.getByRole('menuitem', { name: 'Copy link' }));
    await act(async () => {});

    expect(writeText).toHaveBeenCalledWith(COPIED);
    expect(writeText).toHaveBeenCalledWith(jobBoardShareUrl(role.uid, 'copy_link'));
    expect(writeText.mock.calls[0][0]).not.toContain('/jobs/openings/');
    expect(writeText.mock.calls[0][0]).not.toContain('greenhouse.example');
    expect(screen.getByRole('menuitem', { name: 'Link copied!' })).toBeInTheDocument();
    expect(onJobReferShared).toHaveBeenCalledWith(expect.objectContaining({ network: 'copy_link', job_id: 'role-1' }));
  });

  it('shares the drawer link on LinkedIn and X', () => {
    render(<ReferMenu role={role} teamId="team-1" teamName="Lattice Compute" source="job-board" />);
    openMenu();

    fireEvent.click(screen.getByRole('menuitem', { name: 'Share on LinkedIn' }));

    const linkedinUrl = windowOpenSpy.mock.calls[0][0] as string;
    expect(linkedinUrl).toContain('linkedin.com/sharing/share-offsite');
    expect(linkedinUrl).toContain(encodeURIComponent(shared('linkedin')));
    expect(linkedinUrl).not.toContain('greenhouse.example');
    expect(onJobReferShared).toHaveBeenCalledWith(expect.objectContaining({ network: 'linkedin' }));

    windowOpenSpy.mockClear();
    openMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Share on X' }));

    const xUrl = windowOpenSpy.mock.calls[0][0] as string;
    expect(xUrl).toContain('twitter.com/intent/tweet');
    expect(xUrl).toContain(encodeURIComponent(shared('x')));
    expect(onJobReferShared).toHaveBeenCalledWith(expect.objectContaining({ network: 'x' }));
  });
});
