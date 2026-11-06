import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import { McpAdminLimits } from '@/components/page/settings/mcp/McpAdminLimits';
import { McpConnectionsPage } from '@/components/page/settings/mcp';
import { McpMemberLimits } from '@/components/page/settings/mcp/McpMemberLimits';
import type { McpAdminLimits as AdminData, McpMemberLimits as MemberData } from '@/services/mcp/types';

const memberData: MemberData = {
  tier: 'pl_infra',
  limits: [
    {
      callType: 'write',
      label: 'write',
      used: 30,
      limit: 40,
      resetsAt: '2026-11-05T12:00:00.000Z',
      window: 'hour',
      tier: 'pl_infra',
      override: { limit: 40, endsAt: '2026-11-12T00:00:00.000Z' },
      hitRecently: true,
      lastHitAt: '2026-11-05T10:00:00.000Z',
    },
  ],
};

const adminData: AdminData = {
  callTypes: [],
  recentHits: [
    {
      memberUid: 'm1',
      memberName: 'Ada',
      email: 'ada@example.com',
      callType: 'write',
      hitAt: '2026-11-05T10:00:00.000Z',
      resetsAt: '2026-11-05T12:00:00.000Z',
    },
  ],
  overrides: [
    {
      memberUid: 'm1',
      memberName: 'Ada',
      email: 'ada@example.com',
      callType: 'write',
      limit: 40,
      endsAt: '2026-11-12T00:00:00.000Z',
      updatedAt: '2026-11-05T09:00:00.000Z',
      updatedByUid: 'admin-1',
    },
  ],
  changes: [
    {
      memberUid: 'm1',
      callType: 'write',
      action: 'set',
      limit: 40,
      endsAt: '2026-11-12T00:00:00.000Z',
      actorUid: 'admin-1',
      createdAt: '2026-11-05T09:00:00.000Z',
    },
  ],
  members: [
    {
      uid: 'm1',
      name: 'Ada',
      email: 'ada@example.com',
      tier: 'standard',
      limits: memberData.limits,
    },
  ],
};

let mockMember: { data?: MemberData; isLoading: boolean; isError: boolean; refetch: jest.Mock } = {
  data: memberData,
  isLoading: false,
  isError: false,
  refetch: jest.fn(),
};
jest.mock('@/services/mcp/hooks/useMcpLimits', () => ({
  useMcpLimits: () => mockMember,
}));

let mockAdmin = { data: adminData, isLoading: false, isError: false, refetch: jest.fn() };
const mockSave = jest.fn();
const mockRemove = jest.fn();
jest.mock('@/services/mcp/hooks/useMcpAdminLimits', () => ({
  useMcpAdminLimits: () => mockAdmin,
  useSaveMcpLimitOverride: () => ({ mutate: mockSave, isPending: false, isError: false }),
  useDeleteMcpLimitOverride: () => ({ mutate: mockRemove, isPending: false }),
}));

jest.mock('@/utils/common.utils', () => ({
  ...jest.requireActual('@/utils/common.utils'),
  triggerLoader: jest.fn(),
}));
jest.mock('@/hooks/useOneTimeCallout', () => ({ useOneTimeCallout: () => ({ open: false, dismiss: jest.fn() }) }));
jest.mock('@/analytics/mcp.analytics', () => ({ useMcpAnalytics: () => ({ onConnectionsPageViewed: jest.fn() }) }));
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), refresh: jest.fn() }),
  usePathname: () => '/settings/mcp',
  useSearchParams: () => new URLSearchParams(),
}));
jest.mock('@/services/rbac/hooks/useMcpAccess', () => ({
  useMcpAccess: () => ({ canConnect: true, isLoading: false, isError: false, isFetched: true }),
}));
jest.mock('@/services/mcp/hooks/useMcpConnections', () => ({
  useMcpConnections: () => ({ data: [], isLoading: false, isSuccess: true, isError: false, refetch: jest.fn() }),
}));
jest.mock('@/services/mcp/hooks/useMcpAccessRequest', () => ({
  useMcpAccessRequest: () => ({ data: undefined, isLoading: false, isError: false }),
}));
jest.mock('@/services/mcp/hooks/useUpdateMcpScopes', () => ({
  useUpdateMcpScopes: () => ({ mutate: jest.fn(), reset: jest.fn(), isPending: false, isError: false }),
}));
jest.mock('@/services/mcp/hooks/useRevokeMcpConnection', () => ({
  useRevokeMcpConnection: () => ({ mutate: jest.fn(), isPending: false, variables: undefined }),
}));

describe('MCP limit views', () => {
  beforeEach(() => {
    mockMember = { data: memberData, isLoading: false, isError: false, refetch: jest.fn() };
    mockAdmin = { data: adminData, isLoading: false, isError: false, refetch: jest.fn() };
    mockSave.mockClear();
    mockRemove.mockClear();
  });

  it('shows each limit, usage, reset, override and a recent hit', () => {
    render(<McpMemberLimits />);
    expect(screen.getByText('Agent limits')).toBeInTheDocument();
    expect(screen.getByText(/PL infra/)).toBeInTheDocument();
    expect(screen.getByText('30 of 40 per hour')).toBeInTheDocument();
    expect(screen.getByText(/Custom limit/)).toBeInTheDocument();
    expect(screen.getByText('This limit was hit recently.')).toBeInTheDocument();
  });

  it('hides the admin view from a member and shows it to a directory admin', () => {
    const { rerender } = render(<McpConnectionsPage />);
    expect(screen.queryByRole('heading', { name: 'Member limits' })).not.toBeInTheDocument();
    rerender(<McpConnectionsPage isDirectoryAdmin />);
    expect(screen.getByRole('heading', { name: 'Member limits' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Limited recently' })).toBeInTheDocument();
    expect(screen.getAllByText(/Ada/).length).toBeGreaterThan(0);
  });

  it('saves and removes an override', () => {
    render(<McpAdminLimits />);
    fireEvent.change(screen.getByLabelText('Member uid'), { target: { value: 'm1' } });
    fireEvent.change(screen.getByLabelText('Limit'), { target: { value: '12' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save override' }));
    expect(mockSave).toHaveBeenCalledWith({ memberUid: 'm1', callType: 'write', limit: 12, endsAt: null });
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(mockRemove).toHaveBeenCalledWith({ memberUid: 'm1', callType: 'write' });
  });
});
