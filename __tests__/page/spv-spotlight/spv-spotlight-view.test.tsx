import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { SpvSpotlightView } from '@/components/page/spv-spotlight/SpvSpotlightView';
import { useCurrentUserStore } from '@/services/auth/store';
import { useGetSpvSpotlight } from '@/services/spv-spotlight/hooks/useGetSpvSpotlight';
import { getMockSpvSpotlight, MOCK_SPV_SLUG } from '@/services/spv-spotlight/spv-spotlight.mock';
import type { SpvSpotlight, SpvSpotlightStatus, SpvViewerAccess } from '@/services/spv-spotlight/types';

const mockGoToLogin = jest.fn();
let mockShowExplore = false;

jest.mock('@/services/explore-pl-network/constants', () => ({
  ...jest.requireActual('@/services/explore-pl-network/constants'),
  get SHOW_EXPLORE_PL_NETWORK() {
    return mockShowExplore;
  },
}));

jest.mock('@/services/spv-spotlight/hooks/useGetSpvSpotlight', () => ({ useGetSpvSpotlight: jest.fn() }));
jest.mock('@/services/spv-spotlight/hooks/useRequestSpvAccess', () => ({
  useRequestSpvAccess: () => ({ mutateAsync: jest.fn() }),
}));
jest.mock('@/services/members/hooks/useMember', () => ({ useMember: () => ({ data: undefined }) }));
jest.mock('@/components/core/login/utils', () => ({ useLoginRedirect: () => mockGoToLogin }));
jest.mock('@/analytics/spv-spotlight.analytics', () => ({
  useSpvSpotlightAnalytics: () =>
    new Proxy(
      {},
      {
        get: () => jest.fn(),
      },
    ),
}));
jest.mock(
  '@/components/page/demo-day/AppliedInvestorSteps/EditInvestorProfileDrawer/EditInvestorProfileDrawer',
  () => ({ EditInvestorProfileDrawer: () => null }),
);
jest.mock('embla-carousel-react', () => () => [jest.fn(), undefined]);

const mockedUseGetSpvSpotlight = useGetSpvSpotlight as jest.Mock;

let base: SpvSpotlight;

beforeAll(async () => {
  base = (await getMockSpvSpotlight(MOCK_SPV_SLUG, false)) as SpvSpotlight;
});

const renderView = (status: SpvSpotlightStatus, viewerAccess: SpvViewerAccess, { signedIn = false } = {}) => {
  useCurrentUserStore.setState({
    currentUser: signedIn ? ({ uid: 'u1', email: 'maya@northfield.vc', name: 'Maya Chen' } as never) : null,
    isHydrated: true,
  });
  const spotlight: SpvSpotlight = {
    ...base,
    status,
    viewerAccess,
    docSendUrl: status === 'OPEN' && viewerAccess === 'APPROVED' ? 'https://docsend.com/view/x' : null,
  };
  mockedUseGetSpvSpotlight.mockReturnValue({ data: spotlight, isError: false });
  return render(<SpvSpotlightView slug={MOCK_SPV_SLUG} initialSpotlight={spotlight} />);
};

const requestButton = () => screen.queryByRole('button', { name: /Request access to data room/ });

describe('SpvSpotlightView — the card action slot', () => {
  beforeEach(() => {
    mockGoToLogin.mockReset();
    mockShowExplore = false;
  });

  it('offers Request access and a Sign in link to a signed-out visitor', async () => {
    renderView('OPEN', 'NONE');
    expect(requestButton()).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(mockGoToLogin).toHaveBeenCalledWith(
      expect.objectContaining({ returnTo: `/spv-spotlight/${MOCK_SPV_SLUG}` }),
    );
  });

  it('drops the Sign in link once signed in', () => {
    renderView('OPEN', 'NONE', { signedIn: true });
    expect(requestButton()).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sign in' })).not.toBeInTheDocument();
  });

  it('still takes requests while the spotlight is a draft', () => {
    renderView('DRAFT', 'NONE');
    expect(requestButton()).toBeInTheDocument();
  });

  it('opens the DocSend for an approved viewer of an open spotlight', () => {
    renderView('OPEN', 'APPROVED', { signedIn: true });
    const link = screen.getByRole('link', { name: /View materials/ });
    expect(link).toHaveAttribute('href', 'https://docsend.com/view/x');
    expect(link).toHaveAttribute('target', '_blank');
    expect(screen.getByRole('button', { name: /investor profile/ })).toBeInTheDocument();
  });

  it.each([
    ['DRAFT', 'APPROVED', 'Approved, materials open soon'],
    ['OPEN', 'PENDING', 'Access requested, pending review'],
    ['OPEN', 'REJECTED', 'Access not approved'],
    ['CLOSED', 'APPROVED', 'Data room closed'],
    ['CLOSED', 'NONE', 'Data room closed'],
  ] as const)('%s + %s holds the slot with a quiet line', (status, access, line) => {
    renderView(status, access, { signedIn: access !== 'NONE' });
    expect(screen.getByText(line)).toBeInTheDocument();
    expect(requestButton()).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /View materials/ })).not.toBeInTheDocument();
  });

  it('shows the applied stepper and the full About while pending', () => {
    renderView('OPEN', 'PENDING', { signedIn: true });
    expect(screen.getByText('Request submitted successfully!')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show less' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('tells a rejected viewer plainly, with no way to request again', () => {
    renderView('OPEN', 'REJECTED', { signedIn: true });
    expect(screen.getByText(/wasn.t approved/)).toBeInTheDocument();
  });

  it('closes for everyone', () => {
    renderView('CLOSED', 'PENDING', { signedIn: true });
    expect(screen.getByText(/This Spotlight has closed/)).toBeInTheDocument();
    expect(screen.queryByText('Request submitted successfully!')).not.toBeInTheDocument();
  });

  describe('before the viewer’s own read lands (server data as a prop only)', () => {
    const renderWithoutData = (currentUser: unknown, isHydrated = true) => {
      useCurrentUserStore.setState({ currentUser: currentUser as never, isHydrated });
      mockedUseGetSpvSpotlight.mockReturnValue({ data: undefined, isError: false });
      render(<SpvSpotlightView slug={MOCK_SPV_SLUG} initialSpotlight={base} />);
    };

    it('shows content but no CTA or state message to a signed-in viewer', () => {
      renderWithoutData({ uid: 'u1' });
      expect(screen.getByRole('heading', { level: 1, name: base.title })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: base.team.name })).toBeInTheDocument();
      expect(requestButton()).not.toBeInTheDocument();
      expect(screen.queryByText(/Access requested|Data room closed|not approved/)).not.toBeInTheDocument();
    });

    it('shows no CTA before the auth store hydrates (the server render)', () => {
      renderWithoutData(null, false);
      expect(screen.getByRole('heading', { level: 1, name: base.title })).toBeInTheDocument();
      expect(requestButton()).not.toBeInTheDocument();
    });

    it('offers Request access straight away to a hydrated, signed-out viewer', () => {
      renderWithoutData(null);
      expect(requestButton()).toBeInTheDocument();
    });
  });

  it('hides the Explore tile while the Explore landing is dark', () => {
    renderView('OPEN', 'NONE');
    expect(screen.queryByRole('link', { name: /Explore the PL Network/ })).not.toBeInTheDocument();
  });

  it('links the Explore tile to the landing once it ships', () => {
    mockShowExplore = true;
    renderView('OPEN', 'NONE');
    expect(screen.getByRole('link', { name: /Explore the PL Network/ })).toHaveAttribute('href', '/explore-pl-network');
  });
});
