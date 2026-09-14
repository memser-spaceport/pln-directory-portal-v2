import { renderHook } from '@testing-library/react';

const mockFetchJobByUid = jest.fn().mockResolvedValue(null);
jest.mock('@/services/jobs/jobs.service', () => ({
  fetchJobByUid: (...args: unknown[]) => mockFetchJobByUid(...args),
}));

/* The global mock returns an always-empty URLSearchParams, which never reaches
   the open-from-URL branch this file is about. */
jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

const onJobReferShareLinkOpened = jest.fn();
jest.mock('@/analytics/jobs.analytics', () => ({
  useJobsAnalytics: () => ({
    onJobReferShareLinkOpened: (...args: unknown[]) => onJobReferShareLinkOpened(...args),
  }),
}));

import { useJobDetailDeepLink } from '@/components/page/jobs/hooks/useJobDetailDeepLink';
import type { useJobApplyFlow } from '@/components/page/jobs/hooks/useJobApplyFlow';

type Flow = ReturnType<typeof useJobApplyFlow>;

const openDetail = jest.fn();
const flow = { state: { step: 'idle' }, onViewJob: openDetail, close: jest.fn() } as unknown as Flow;

const render = () => renderHook(() => useJobDetailDeepLink({ enabled: true, groups: [], isLoading: false, flow }));

beforeEach(() => {
  jest.clearAllMocks();
  mockFetchJobByUid.mockResolvedValue(null);
});

describe('arriving on a shared job link', () => {
  it('reports the channel the link was shared through', () => {
    window.history.replaceState({}, '', '/jobs?job=role-1&utm_source=job_refer_share&utm_medium=copy_link');

    render();

    expect(onJobReferShareLinkOpened).toHaveBeenCalledWith({
      job_id: 'role-1',
      utm_source: 'job_refer_share',
      utm_medium: 'copy_link',
    });
  });

  /* The click is the thing being measured — a role that closed since the link
     was sent must not swallow it. */
  it('reports a link to a role that can no longer be resolved', () => {
    window.history.replaceState({}, '', '/jobs?job=gone&utm_source=job_refer_share&utm_medium=linkedin');

    render();

    expect(onJobReferShareLinkOpened).toHaveBeenCalledWith(expect.objectContaining({ job_id: 'gone' }));
  });

  it('says nothing when the role was opened from the board itself', () => {
    window.history.replaceState({}, '', '/jobs?job=role-1');

    render();

    expect(onJobReferShareLinkOpened).not.toHaveBeenCalled();
  });
});
