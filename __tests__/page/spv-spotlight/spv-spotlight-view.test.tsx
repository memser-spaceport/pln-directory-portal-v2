import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { SpvSpotlightView } from '@/components/page/spv-spotlight/SpvSpotlightView';
import { useCurrentUserStore } from '@/services/auth/store';
import { useGetSpvSpotlight } from '@/services/spv-spotlight/hooks/useGetSpvSpotlight';
import { buildSpvSpotlight, SPV_FIXTURE_SLUG as MOCK_SPV_SLUG } from '@/services/spv-spotlight/spv-spotlight.fixture';
import {
  SpvAccessRequestValidationError,
  SpvSpotlightClosedError,
  type SpvSpotlight,
  type SpvSpotlightStatus,
  type SpvViewerAccess,
} from '@/services/spv-spotlight/types';

const mockGoToLogin = jest.fn();
const mockRequestAccess = jest.fn();
const mockEmitAuthEvent = jest.fn();
const mockClearAuthCookies = jest.fn();
let mockShowExplore = false;

jest.mock('@/services/explore-pl-network/constants', () => ({
  ...jest.requireActual('@/services/explore-pl-network/constants'),
  get SHOW_EXPLORE_PL_NETWORK() {
    return mockShowExplore;
  },
}));

jest.mock('@/services/spv-spotlight/hooks/useGetSpvSpotlight', () => ({ useGetSpvSpotlight: jest.fn() }));
jest.mock('@/services/spv-spotlight/hooks/useRequestSpvAccess', () => ({
  useRequestSpvAccess: () => ({ mutateAsync: (...args: unknown[]) => mockRequestAccess(...args) }),
}));
jest.mock('@/services/members/hooks/useMember', () => ({ useMember: () => ({ data: undefined }) }));
jest.mock('@/components/core/login/utils', () => ({
  useLoginRedirect: () => mockGoToLogin,
  authEvents: { emit: (...args: unknown[]) => mockEmitAuthEvent(...args) },
}));
jest.mock('@/components/core/login/components/BroadcastChannel', () => ({ broadcastLogout: jest.fn() }));
jest.mock('@/utils/third-party.helper', () => ({
  ...jest.requireActual('@/utils/third-party.helper'),
  clearAllAuthCookies: () => mockClearAuthCookies(),
}));
jest.mock('@/components/core/ToastContainer', () => ({ toast: { success: jest.fn() } }));
jest.mock('posthog-js/react', () => ({ usePostHog: () => ({ reset: jest.fn() }) }));
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
  () => ({
    EditInvestorProfileDrawer: ({ isOpen }: { isOpen: boolean }) =>
      isOpen ? <div>Investor profile drawer</div> : null,
  }),
);
jest.mock('embla-carousel-react', () => () => [jest.fn(), undefined]);

const mockedUseGetSpvSpotlight = useGetSpvSpotlight as jest.Mock;

let base: SpvSpotlight;

beforeAll(() => {
  base = buildSpvSpotlight();
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

const topBar = () => screen.getByText('PL Spotlight').closest('header') as HTMLElement;
const card = () => screen.getByRole('article');

const requestButton = () => screen.queryByRole('button', { name: /Request access to data room/ });

describe('SpvSpotlightView — the card action slot', () => {
  beforeEach(() => {
    mockGoToLogin.mockReset();
    mockEmitAuthEvent.mockReset();
    mockClearAuthCookies.mockReset();
    mockShowExplore = false;
  });

  it('offers Request access and a Sign in link to a signed-out visitor', async () => {
    renderView('OPEN', 'NONE');
    expect(requestButton()).toBeInTheDocument();

    expect(within(card()).getByText(/Already have an account\?/)).toBeInTheDocument();
    await userEvent.click(within(card()).getByRole('button', { name: 'Sign in' }));
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
    const link = screen.getByRole('link', { name: /Open data room/ });
    expect(link).toHaveAttribute('href', 'https://docsend.com/view/x');
    expect(link).toHaveAttribute('target', '_blank');
    expect(screen.getByRole('button', { name: /investor profile/ })).toBeInTheDocument();
  });

  it.each([
    ['DRAFT', 'APPROVED', 'Approved, data room opens soon'],
    ['OPEN', 'PENDING', 'Data room access pending review'],
    ['OPEN', 'REJECTED', 'Data room access not approved'],
    ['CLOSED', 'APPROVED', 'Data room closed'],
    ['CLOSED', 'NONE', 'Data room closed'],
  ] as const)('%s + %s holds the slot with a quiet line', (status, access, line) => {
    renderView(status, access, { signedIn: access !== 'NONE' });
    expect(screen.getByText(line)).toBeInTheDocument();
    expect(requestButton()).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Open data room/ })).not.toBeInTheDocument();
  });

  it('shows the applied stepper and the full About while pending', () => {
    renderView('OPEN', 'PENDING', { signedIn: true });
    expect(screen.getByText('Request submitted successfully!')).toBeInTheDocument();
    expect(screen.getByText('Get access to data room — subject to approval.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show less' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('tells a rejected viewer plainly, with no way to request again', () => {
    renderView('OPEN', 'REJECTED', { signedIn: true });
    expect(screen.getByText(/wasn.t approved\. If you think this is a mistake/)).toBeInTheDocument();
    expect(screen.queryByText(/materials aren.t available/)).not.toBeInTheDocument();
  });

  it('closes for everyone', () => {
    renderView('CLOSED', 'PENDING', { signedIn: true });
    expect(screen.getByText('This Spotlight has closed and its data room is no longer available.')).toBeInTheDocument();
    expect(screen.queryByText('Request submitted successfully!')).not.toBeInTheDocument();
  });

  it('links each founder to their directory profile in a new tab', () => {
    renderView('OPEN', 'NONE');
    const founder = base.team.founders[0];
    const link = screen.getByRole('link', { name: new RegExp(founder.name) });
    expect(link).toHaveAttribute('href', `/members/${founder.uid}`);
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('has no Contact us link in the hero or the top bar (the FAQ carries the email)', () => {
    renderView('OPEN', 'APPROVED', { signedIn: true });
    expect(screen.queryByRole('link', { name: 'Contact us' })).not.toBeInTheDocument();
    // The FAQ subtitle and the footer each carry it.
    expect(screen.getAllByRole('link', { name: base.supportEmail })).toHaveLength(2);
    expect(screen.getByRole('button', { name: /investor profile/ })).toBeInTheDocument();
  });

  it('gives a signed-in viewer the account menu: their name opens the investor profile, Sign out logs out', async () => {
    renderView('OPEN', 'APPROVED', { signedIn: true });
    expect(within(topBar()).queryByRole('button', { name: 'Sign in' })).not.toBeInTheDocument();

    await userEvent.click(within(topBar()).getByRole('button', { name: 'Account' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: /Maya Chen/ }));
    expect(screen.getByText('Investor profile drawer')).toBeInTheDocument();
    expect(mockGoToLogin).not.toHaveBeenCalled();

    await userEvent.click(within(topBar()).getByRole('button', { name: 'Account' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: /Sign out/ }));
    expect(mockClearAuthCookies).toHaveBeenCalled();
    expect(mockEmitAuthEvent).toHaveBeenCalledWith('auth:logout');
  });

  it('gives a signed-out visitor Sign in in the top bar, and no account menu', async () => {
    renderView('OPEN', 'NONE');
    expect(within(topBar()).queryByRole('button', { name: 'Account' })).not.toBeInTheDocument();
    await userEvent.click(within(topBar()).getByRole('button', { name: 'Sign in' }));
    expect(mockGoToLogin).toHaveBeenCalledWith(
      expect.objectContaining({ returnTo: `/spv-spotlight/${MOCK_SPV_SLUG}` }),
    );
  });

  describe('submitting a request', () => {
    const submitAsSignedIn = async () => {
      renderView('OPEN', 'NONE', { signedIn: true });
      const user = userEvent.setup();
      await user.click(requestButton()!);
      await user.type(screen.getByPlaceholderText('Enter your primary role'), 'Partner');
      await user.type(screen.getByPlaceholderText('e.g. Northfield Ventures'), 'Northfield');
      await user.click(screen.getByRole('checkbox'));
      await user.click(screen.getByRole('button', { name: 'Request access' }));
    };

    beforeEach(() => mockRequestAccess.mockReset());

    it('shows the backend 422 message inline and keeps the form open', async () => {
      const message = 'Input validation failed: organization should not be empty';
      mockRequestAccess.mockRejectedValueOnce(new SpvAccessRequestValidationError(message));
      await submitAsSignedIn();
      expect(await screen.findByText(message)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Request access' })).toBeInTheDocument();
    });

    it('closes the form when the spotlight closed meanwhile, without a sign-in prompt', async () => {
      mockRequestAccess.mockRejectedValueOnce(new SpvSpotlightClosedError());
      await submitAsSignedIn();
      await waitFor(() => expect(screen.queryByRole('button', { name: 'Request access' })).not.toBeInTheDocument());
      expect(screen.queryByText('Request received')).not.toBeInTheDocument();
      expect(mockGoToLogin).not.toHaveBeenCalled();
    });
  });

  it('ends with the Q&A before the footer', () => {
    renderView('OPEN', 'NONE');
    expect(screen.getByRole('heading', { name: 'Questions investors ask' })).toBeInTheDocument();
    expect(screen.getByText('What is PL Spotlight?')).toBeInTheDocument();
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
      expect(screen.queryByText(/pending review|Data room closed|not approved/)).not.toBeInTheDocument();
    });

    it('shows no CTA before the auth store hydrates (the server render)', () => {
      renderWithoutData(null, false);
      expect(screen.getByRole('heading', { level: 1, name: base.title })).toBeInTheDocument();
      expect(requestButton()).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Sign in' })).not.toBeInTheDocument();
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
    const tile = screen.getByRole('link', { name: /Explore the PL Network/ });
    expect(tile).toHaveAttribute('href', '/explore-pl-network');
    // The same count the Explore landing states, not the map's portfolio size.
    expect(tile).toHaveTextContent('750+ teams');
  });
});
