import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { CompleteYourProfile } from '@/components/core/navbar/components/CompleteYourProfile';
import { useCurrentUserStore } from '@/services/auth/store';
import type { IUserInfo } from '@/types/shared.types';

jest.mock('@/components/core/navbar/components/HighlightsBar', () => ({
  HighlightsBar: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const user = (overrides: Partial<IUserInfo> = {}): IUserInfo => ({
  uid: 'm1',
  rbac: { status: 'VERIFIED', policies: [], effectivePermissions: [], roles: [] },
  ...overrides,
});

describe('CompleteYourProfile', () => {
  afterEach(() => {
    useCurrentUserStore.setState({ currentUser: null });
  });

  it('shows the under-review copy for a pending member who is not a Job Aspirant', () => {
    useCurrentUserStore.setState({ currentUser: user() });
    render(<CompleteYourProfile />);

    expect(screen.getByText("Profile under review — we'll notify you once approved")).toBeInTheDocument();
  });

  it('hides the under-review copy for a Job Aspirant', () => {
    useCurrentUserStore.setState({
      currentUser: user({
        signUpSource: 'job-board',
        rbac: {
          status: 'VERIFIED',
          policies: [{ uid: 'p', code: 'job_aspirant', name: 'Job Aspirant', description: null, role: '', group: '' }],
          effectivePermissions: [],
          roles: [],
        },
      }),
    });
    render(<CompleteYourProfile />);

    expect(screen.queryByText("Profile under review — we'll notify you once approved")).not.toBeInTheDocument();
  });

  it('hides it from Job Board signUpSource even when the cookie has no policies', () => {
    useCurrentUserStore.setState({ currentUser: user({ signUpSource: 'job-board' }) });
    render(<CompleteYourProfile />);

    expect(screen.queryByText("Profile under review — we'll notify you once approved")).not.toBeInTheDocument();
  });
});
