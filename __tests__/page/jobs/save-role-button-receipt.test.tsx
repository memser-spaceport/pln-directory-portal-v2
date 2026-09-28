import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockMutate = jest.fn();
jest.mock('@/services/jobs/hooks/savedJobs/useToggleSavedJob', () => ({
  useToggleSavedJob: () => ({ mutate: mockMutate }),
}));

const mockToastSuccess = jest.fn();
jest.mock('@/components/core/ToastContainer', () => ({
  toast: { success: (...args: unknown[]) => mockToastSuccess(...args), error: jest.fn() },
}));

jest.mock('@/components/core/login/utils', () => ({ useLoginRedirect: () => jest.fn() }));

import { SaveRoleButton } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/components/SaveRoleButton';
import { useJobsFilterStore } from '@/services/jobs/store';
import type { IJobRole } from '@/types/jobs.types';

const ROLE = { uid: 'role-1', roleTitle: 'Community Manager' } as IJobRole;

/** The press hands react-query its callbacks; this replays the one the server
 *  would have triggered, which is where the receipt lives. */
const confirmServer = () => {
  const [, callbacks] = mockMutate.mock.calls[0];
  (callbacks as { onSuccess: () => void }).onSuccess();
};

beforeEach(() => {
  mockMutate.mockClear();
  mockToastSuccess.mockClear();
  useJobsFilterStore.setState({ params: new URLSearchParams() });
});

describe('the save receipt', () => {
  it('says nothing until the server has confirmed — the glyph led, the sentence follows', () => {
    render(<SaveRoleButton role={ROLE} memberUid="m1" saved={false} />);

    fireEvent.click(screen.getByRole('button', { name: 'Save Community Manager' }));

    expect(mockMutate).toHaveBeenCalled();
    expect(mockToastSuccess).not.toHaveBeenCalled();
  });

  it('ticks the Saved filter once the save lands', () => {
    render(<SaveRoleButton role={ROLE} memberUid="m1" saved={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save Community Manager' }));

    confirmServer();

    expect(mockToastSuccess).toHaveBeenCalledTimes(1);
    render(<>{mockToastSuccess.mock.calls[0][0] as React.ReactNode}</>);

    fireEvent.click(screen.getByRole('button', { name: 'View saved roles' }));
    expect(useJobsFilterStore.getState().params.get('saved')).toBe('true');
  });

  /* Unsaving is silent: the outline coming back is the whole of that receipt. */
  it('stays quiet on an unsave', () => {
    render(<SaveRoleButton role={ROLE} memberUid="m1" saved />);
    fireEvent.click(screen.getByRole('button', { name: 'Unsave Community Manager' }));

    confirmServer();

    expect(mockToastSuccess).not.toHaveBeenCalled();
  });
});
