import { renderHook, act } from '@testing-library/react';

const mockFetchJobByUid = jest.fn();
jest.mock('@/services/jobs/jobs.service', () => ({
  fetchJobByUid: (...args: unknown[]) => mockFetchJobByUid(...args),
}));

import { useJobDetailDeepLink } from '@/components/page/jobs/hooks/useJobDetailDeepLink';
import type { useJobApplyFlow, JobDetailTarget } from '@/components/page/jobs/hooks/useJobApplyFlow';
import type { IJobRole, IJobTeam } from '@/types/jobs.types';

type Flow = ReturnType<typeof useJobApplyFlow>;

const role = { uid: 'role-1', roleTitle: 'Engineer' } as unknown as IJobRole;
const team = { uid: 'team-1', name: 'Acme' } as unknown as IJobTeam;
const target: JobDetailTarget = { role, teamId: team.uid, teamName: team.name, team };

const openDetail = jest.fn();
const closeFlow = jest.fn();

/** Only the three members this hook actually reads. */
const flowAt = (state: Flow['state']): Flow =>
  ({ state, onViewJob: openDetail, close: closeFlow }) as unknown as Flow;

const IDLE = flowAt({ step: 'idle' });

const search = () => new URL(window.location.href).search;

const setUrl = (url: string) => window.history.replaceState({}, '', url);

const render = (enabled: boolean, flow: Flow = IDLE) =>
  renderHook(({ f }: { f: Flow }) => useJobDetailDeepLink({ enabled, groups: [], isLoading: false, flow: f }), {
    initialProps: { f: flow },
  });

beforeEach(() => {
  openDetail.mockClear();
  closeFlow.mockClear();
  mockFetchJobByUid.mockClear();
  setUrl('/teams/team-1');
});

/**
 * `enabled` used to gate only the open-from-URL effect while the wrapped
 * callbacks wrote `?job=` unconditionally. A surface that wants the flow without
 * the param — the team profile, whose share links point at `/jobs` — would have
 * stamped one on its own URL anyway. These are the assertions that keep it honest.
 */
describe('useJobDetailDeepLink when disabled', () => {
  it('opens the flow without touching the URL', () => {
    const { result } = render(false);

    act(() => result.current.onViewJob(target));

    expect(openDetail).toHaveBeenCalledWith(target);
    expect(search()).toBe('');
  });

  it('closes the flow without touching the URL', () => {
    setUrl('/teams/team-1?tab=roles');
    const { result } = render(false);

    act(() => result.current.close());

    expect(closeFlow).toHaveBeenCalled();
    expect(search()).toBe('?tab=roles');
  });

  it('leaves the param alone when the flow steps off the reading step', () => {
    setUrl('/teams/team-1?job=someone-elses-uid');
    const { rerender } = render(false);

    rerender({ f: flowAt({ step: 'flow', target, at: 'profile', coverLetterDraft: '' }) });

    expect(search()).toBe('?job=someone-elses-uid');
  });

  it('is a true passthrough — the flow object comes back unwrapped', () => {
    const { result } = render(false);

    expect(result.current).toBe(IDLE);
  });
});

describe('useJobDetailDeepLink when enabled', () => {
  it('writes ?job= as the drawer opens', () => {
    const { result } = render(true);

    act(() => result.current.onViewJob(target));

    expect(openDetail).toHaveBeenCalledWith(target);
    expect(search()).toBe('?job=role-1');
  });

  it('clears ?job= as the drawer closes, keeping other params', () => {
    setUrl('/jobs?tags=eng&job=role-1');
    const { result } = render(true);

    act(() => result.current.close());

    expect(closeFlow).toHaveBeenCalled();
    expect(search()).toBe('?tags=eng');
  });

  it('clears ?job= when the flow steps off the reading step', () => {
    setUrl('/jobs?job=role-1');
    const { rerender } = render(true);

    rerender({ f: flowAt({ step: 'flow', target, at: 'profile', coverLetterDraft: '' }) });

    expect(search()).toBe('');
  });

  it('wraps the flow rather than returning it', () => {
    const { result } = render(true);

    expect(result.current).not.toBe(IDLE);
    expect(result.current.state).toBe(IDLE.state);
  });
});
