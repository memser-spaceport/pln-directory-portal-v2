import { getJobPreviewSnippet } from '@/services/jobs/jobPreviewSnippet';
import type { IJobRole, IJobTeam } from '@/types/jobs.types';

const role = (overrides: Partial<IJobRole> = {}): IJobRole => ({
  uid: 'role-1',
  roleTitle: 'Start Up Operator',
  roleCategory: 'Operations',
  seniority: null,
  location: ['US'],
  workMode: 'remote',
  applyUrl: null,
  lastUpdated: '2026-05-01T00:00:00.000Z',
  postedDate: '2026-05-01T00:00:00.000Z',
  detectionDate: null,
  ...overrides,
});

const team = (overrides: Partial<IJobTeam> = {}): IJobTeam => ({
  uid: 'team-1',
  name: 'Protocol Labs',
  logoUrl: null,
  focusAreas: [],
  subFocusAreas: [],
  jobReferEmail: null,
  ...overrides,
});

describe('getJobPreviewSnippet', () => {
  it('composes category, work mode, location and the hiring team', () => {
    expect(getJobPreviewSnippet(role(), team())).toBe('Operations · Remote · US · Protocol Labs is hiring.');
  });

  it('maps the work mode to its display label', () => {
    expect(getJobPreviewSnippet(role({ workMode: 'in-office' }), team())).toBe(
      'Operations · In-Office · US · Protocol Labs is hiring.',
    );
  });

  it('drops the work mode when the posting carries none', () => {
    expect(getJobPreviewSnippet(role({ workMode: null }), team())).toBe('Operations · US · Protocol Labs is hiring.');
  });

  it('drops the location when the posting carries none', () => {
    expect(getJobPreviewSnippet(role({ location: [] }), team())).toBe('Operations · Remote · Protocol Labs is hiring.');
  });

  it('joins multiple locations', () => {
    expect(getJobPreviewSnippet(role({ location: ['San Francisco', 'San Mateo'] }), team())).toBe(
      'Operations · Remote · San Francisco, San Mateo · Protocol Labs is hiring.',
    );
  });

  // One dev role has none of the three. The role title carries the specifics in
  // the preview's own title, so the description falls back to the team alone
  // rather than to the board's generic copy.
  it('falls back to the team alone when no facts are on the wire', () => {
    expect(getJobPreviewSnippet(role({ roleCategory: null, workMode: null, location: [] }), team())).toBe(
      'Protocol Labs is hiring.',
    );
  });

  // The whole point of composing from fields: a scraped body would open with
  // the same "About <team>" paragraph on every role this team posts.
  it('never reads the scraped description body', () => {
    const snippet = getJobPreviewSnippet(
      role({ descriptionHtml: '<h3>About Protocol Labs</h3><p>Protocol Labs is an innovation network…</p>' }),
      team(),
    );

    expect(snippet).toBe('Operations · Remote · US · Protocol Labs is hiring.');
  });
});
