import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import '@testing-library/jest-dom';

const analytics = {
  onJobSaved: jest.fn(),
  onJobUnsaved: jest.fn(),
  onJobSaveFailed: jest.fn(),
  onJobsSavedFilterApplied: jest.fn(),
};
jest.mock('@/analytics/jobs.analytics', () => ({
  useJobsAnalytics: () => analytics,
}));

const goToLogin = jest.fn();
jest.mock('@/components/core/login/utils', () => ({
  useLoginRedirect: () => goToLogin,
}));

const mutate = jest.fn();
jest.mock('@/services/jobs/hooks/savedJobs/useToggleSavedJob', () => ({
  useToggleSavedJob: () => ({ mutate }),
}));

let toastNode: ReactNode = null;
jest.mock('@/components/core/ToastContainer', () => ({
  toast: {
    success: (node: ReactNode) => {
      toastNode = node;
    },
    error: jest.fn(),
  },
}));

import { SaveRoleButton } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/components/SaveRoleButton';
import { SavedJobsFilter } from '@/components/page/jobs/JobsFilterBody/components/SavedJobsFilter/SavedJobsFilter';
import { useJobsFilterStore } from '@/services/jobs/store';
import type { IJobRole } from '@/types/jobs.types';

const role = {
  uid: 'role-1',
  roleTitle: 'Community Manager',
} as IJobRole;

const savedEvent = { job_id: 'role-1', team_id: 'team-1', source: 'job-board' };

function renderSave(props: Partial<React.ComponentProps<typeof SaveRoleButton>> = {}) {
  return render(
    <SaveRoleButton role={role} teamId="team-1" source="job-board" memberUid="member-1" saved={false} {...props} />,
  );
}

beforeEach(() => {
  toastNode = null;
  goToLogin.mockReset();
  mutate.mockReset();
  Object.values(analytics).forEach((fn) => fn.mockReset());
  useJobsFilterStore.getState().clearParams();
});

describe('save job analytics', () => {
  it('records a save when it succeeds', async () => {
    mutate.mockImplementation((_vars, options) => options.onSuccess());
    renderSave();

    await userEvent.click(screen.getByRole('button', { name: 'Save Community Manager' }));

    expect(analytics.onJobSaved).toHaveBeenCalledWith(savedEvent);
    expect(analytics.onJobUnsaved).not.toHaveBeenCalled();
  });

  it('records an unsave when it succeeds', async () => {
    mutate.mockImplementation((_vars, options) => options.onSuccess());
    renderSave({ saved: true });

    await userEvent.click(screen.getByRole('button', { name: 'Unsave Community Manager' }));

    expect(analytics.onJobUnsaved).toHaveBeenCalledWith(savedEvent);
    expect(analytics.onJobSaved).not.toHaveBeenCalled();
  });

  it('records a failed save', async () => {
    mutate.mockImplementation((_vars, options) => options.onError());
    renderSave();

    await userEvent.click(screen.getByRole('button', { name: 'Save Community Manager' }));

    expect(analytics.onJobSaveFailed).toHaveBeenCalledWith({ ...savedEvent, action: 'save' });
  });

  it('does not record a logged-out press', async () => {
    renderSave({ memberUid: undefined });

    await userEvent.click(screen.getByRole('button', { name: 'Save Community Manager' }));

    expect(goToLogin).toHaveBeenCalled();
    expect(mutate).not.toHaveBeenCalled();
    expect(analytics.onJobSaved).not.toHaveBeenCalled();
  });

  it('records View saved roles as the Saved filter', async () => {
    mutate.mockImplementation((_vars, options) => options.onSuccess());
    renderSave();
    await userEvent.click(screen.getByRole('button', { name: 'Save Community Manager' }));

    render(<>{toastNode}</>);
    await userEvent.click(screen.getByRole('button', { name: 'View saved roles' }));

    expect(analytics.onJobsSavedFilterApplied).toHaveBeenCalledWith({ filter_state: {} });
  });
});

describe('Saved filter analytics', () => {
  it('records turning the filter on', async () => {
    render(<SavedJobsFilter />);

    await userEvent.click(screen.getByText('Saved'));

    expect(analytics.onJobsSavedFilterApplied).toHaveBeenCalledWith({ filter_state: {} });
  });

  it('does not record turning the filter off', async () => {
    useJobsFilterStore.getState().setParam('saved', 'true');
    render(<SavedJobsFilter />);

    await userEvent.click(screen.getByText('Saved'));

    expect(analytics.onJobsSavedFilterApplied).not.toHaveBeenCalled();
  });
});
