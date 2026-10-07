import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { SpvSpotlightView } from '@/components/page/spv-spotlight/SpvSpotlightView';
import { useCurrentUserStore } from '@/services/auth/store';
import { useContactSupportStore } from '@/services/contact-support/store';
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
let mockRequestFlow = false;
let mockSearch = '';
let mockMember: unknown = undefined;

jest.mock('@/services/spv-spotlight/constants', () => ({
  ...jest.requireActual('@/services/spv-spotlight/constants'),
  get REQUEST_FLOW_ENABLED() {
    return mockRequestFlow;
  },
}));
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
  usePathname: () => '/mock-path',
  useSearchParams: () => new URLSearchParams(mockSearch),
}));
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
jest.mock('@/services/members/hooks/useMember', () => ({ useMember: () => ({ data: mockMember }) }));
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

const renderView = (
  status: SpvSpotlightStatus,
  viewerAccess: SpvViewerAccess,
  // The page passes its server read only with the request flow on.
  { signedIn = false, initial = true } = {},
) => {
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
  return render(<SpvSpotlightView slug={MOCK_SPV_SLUG} initialSpotlight={initial ? spotlight : null} />);
};

const topBar = () => screen.getByText('PL Spotlight').closest('header') as HTMLElement;
const card = () => screen.getByRole('article');

const requestButton = () => screen.queryByRole('button', { name: /Request access to data room/ });

beforeEach(() => {
  mockGoToLogin.mockReset();
  mockEmitAuthEvent.mockReset();
  mockClearAuthCookies.mockReset();
  mockedUseGetSpvSpotlight.mockReset();
  mockShowExplore = false;
  mockRequestFlow = false;
  mockSearch = '';
  mockMember = undefined;
  useContactSupportStore.getState().actions.closeModal();
});

describe('SpvSpotlightView — request flow (REQUEST_FLOW_ENABLED on)', () => {
  beforeEach(() => {
    mockRequestFlow = true;
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
    const link = screen.getByRole('link', { name: /Request data room access/ });
    expect(link).toHaveAttribute('href', 'https://docsend.com/view/x');
    expect(link).toHaveAttribute('target', '_blank');
    expect(screen.getByRole('button', { name: /investor profile/ })).toBeInTheDocument();
  });

  it.each([
    ['DRAFT', 'APPROVED', 'Data room opens soon'],
    ['OPEN', 'PENDING', 'Data room access pending review'],
    ['OPEN', 'REJECTED', 'Data room access not approved'],
    ['CLOSED', 'APPROVED', 'Data room closed'],
    ['CLOSED', 'NONE', 'Data room closed'],
  ] as const)('%s + %s holds the slot with a quiet line', (status, access, line) => {
    renderView(status, access, { signedIn: access !== 'NONE' });
    expect(screen.getByText(line)).toBeInTheDocument();
    expect(requestButton()).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Request data room access/ })).not.toBeInTheDocument();
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

  it('gives a scheme-less directory website an absolute https link', () => {
    useCurrentUserStore.setState({ currentUser: null, isHydrated: true });
    const spotlight = { ...base, team: { ...base.team, website: 'www.netholabs.com' } };
    mockedUseGetSpvSpotlight.mockReturnValue({ data: spotlight, isError: false });
    render(<SpvSpotlightView slug={MOCK_SPV_SLUG} initialSpotlight={spotlight} />);
    // The fact strip's link and the carousel's source credit.
    const links = screen.getAllByRole('link', { name: /www\.netholabs\.com/ });
    expect(links).toHaveLength(2);
    links.forEach((link) => expect(link).toHaveAttribute('href', 'https://www.netholabs.com'));
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
    expect(within(tile).getByText('Organizations in the network').nextSibling).toHaveTextContent('750+');
  });
});

describe('SpvSpotlightView — gated (the default)', () => {
  const lockedSignedOutTitle = 'Sign in to view this Spotlight';
  const noAccessTitle = 'This Spotlight is invite-only';

  // Nothing of the deal: no title, no team, no FAQ, no support email.
  const expectNoDealContent = (container: HTMLElement) => {
    expect(screen.queryByRole('heading', { name: base.title })).not.toBeInTheDocument();
    expect(screen.queryByText(base.team.name)).not.toBeInTheDocument();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Questions investors ask' })).not.toBeInTheDocument();
    expect(container.querySelector('a[href^="mailto:"]')).toBeNull();
    expect(container).not.toHaveTextContent(base.supportEmail);
  };

  describe('signed out', () => {
    it('shows only the sign-in lock, and never reads the spotlight', () => {
      const { container } = renderView('OPEN', 'NONE', { initial: false });
      expect(screen.getByRole('heading', { level: 1, name: lockedSignedOutTitle })).toBeInTheDocument();
      expectNoDealContent(container);
      expect(screen.queryByRole('region', { name: 'Your investor profile' })).not.toBeInTheDocument();
      expect(mockedUseGetSpvSpotlight).toHaveBeenCalledWith(MOCK_SPV_SLUG, { enabled: false });
    });

    it('signs in back to this page, and Contact us opens the support modal', async () => {
      renderView('OPEN', 'NONE', { initial: false });
      const hero = screen.getByRole('heading', { level: 1 }).closest('section') as HTMLElement;
      await userEvent.click(within(hero).getByRole('button', { name: 'Sign in' }));
      expect(mockGoToLogin).toHaveBeenCalledWith(
        expect.objectContaining({ returnTo: `/spv-spotlight/${MOCK_SPV_SLUG}` }),
      );
      await userEvent.click(within(hero).getByRole('button', { name: 'Contact us' }));
      expect(useContactSupportStore.getState().open).toBe(true);
    });

    it('waits, showing nothing, while an invitation link signs the viewer in', () => {
      mockSearch = 'loginToken=t0k&prefillEmail=maya%40northfield.vc';
      renderView('OPEN', 'NONE', { initial: false });
      expect(screen.queryByText(lockedSignedOutTitle)).not.toBeInTheDocument();
      expect(screen.getByLabelText('Loading Spotlight')).toBeInTheDocument();
    });
  });

  describe.each(['NONE', 'PENDING', 'REJECTED'] as const)('signed in, %s', (access) => {
    it.each(['DRAFT', 'OPEN', 'CLOSED'] as const)('%s: only the no-access message and Contact us', async (status) => {
      const { container } = renderView(status, access, { signedIn: true, initial: false });
      expect(screen.getByRole('heading', { level: 1, name: noAccessTitle })).toBeInTheDocument();
      expect(
        screen.getByText('If you think you should have access, contact us.'),
      ).toBeInTheDocument();
      expectNoDealContent(container);

      const hero = screen.getByRole('heading', { level: 1 }).closest('section') as HTMLElement;
      // No other-account option: Contact us is the only door.
      expect(
        within(hero)
          .getAllByRole('button')
          .map((b) => b.textContent),
      ).toEqual(['Contact us']);
      expect(screen.queryByText(/another account|different account/i)).not.toBeInTheDocument();
      await userEvent.click(within(hero).getByRole('button', { name: 'Contact us' }));
      expect(useContactSupportStore.getState().open).toBe(true);
    });
  });

  it('shows the Explore tile on a locked page', () => {
    mockShowExplore = true;
    renderView('OPEN', 'NONE', { signedIn: true, initial: false });
    expect(screen.getByRole('link', { name: /Explore the PL Network/ })).toBeInTheDocument();
  });

  describe('approved', () => {
    it('puts the investor profile card between the hero and the team card', () => {
      renderView('OPEN', 'APPROVED', { signedIn: true, initial: false });
      const heading = screen.getByRole('heading', { level: 1, name: base.title });
      const profileCard = screen.getByRole('region', { name: 'Your investor profile' });
      const teamCard = screen.getByRole('article');
      expect(heading.compareDocumentPosition(profileCard) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(profileCard.compareDocumentPosition(teamCard) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(within(profileCard).getByText('For future deals')).toBeInTheDocument();
      expect(within(profileCard).getByText('Takes about 1 min')).toBeInTheDocument();
    });

    it('links the data room from the team card, its one filled primary', () => {
      renderView('OPEN', 'APPROVED', { signedIn: true, initial: false });
      const link = within(screen.getByRole('article')).getByRole('link', { name: /Request data room access/ });
      expect(link).toHaveAttribute('href', 'https://docsend.com/view/x');
      // The old hero link is gone; the card is the profile's only door on the page.
      expect(
        screen.getAllByRole('button', { name: /^(Set up investor profile|Edit investor profile|Review and update)/ }),
      ).toHaveLength(1);
    });

    it('offers to set up a profile when the investor has none, and opens the drawer', async () => {
      renderView('OPEN', 'APPROVED', { signedIn: true, initial: false });
      await userEvent.click(screen.getByRole('button', { name: 'Set up investor profile' }));
      expect(screen.getByText('Investor profile drawer')).toBeInTheDocument();
    });

    it('offers to review a profile that has a type (Demo Day, a past deal)', () => {
      mockMember = { memberInfo: { investorProfile: { type: 'ANGEL' } } };
      renderView('OPEN', 'APPROVED', { signedIn: true, initial: false });
      expect(screen.getByRole('button', { name: 'Review and update' })).toBeInTheDocument();
    });

    it('still says set up for a profile without a type (created by an access request)', () => {
      mockMember = { memberInfo: { investorProfile: { type: null, secRulesAccepted: true } } };
      renderView('OPEN', 'APPROVED', { signedIn: true, initial: false });
      expect(screen.getByRole('button', { name: 'Set up investor profile' })).toBeInTheDocument();
    });

    it('says the data room opens soon while the spotlight is a draft, with the profile card', () => {
      renderView('DRAFT', 'APPROVED', { signedIn: true, initial: false });
      expect(screen.getByText('Data room opens soon')).toBeInTheDocument();
      expect(screen.getByRole('region', { name: 'Your investor profile' })).toBeInTheDocument();
    });

    it('shows the closed state, without the profile card', () => {
      renderView('CLOSED', 'APPROVED', { signedIn: true, initial: false });
      expect(screen.getByText('Data room closed')).toBeInTheDocument();
      expect(screen.queryByRole('region', { name: 'Your investor profile' })).not.toBeInTheDocument();
    });

    it('asks the token-link questions', () => {
      renderView('OPEN', 'APPROVED', { signedIn: true, initial: false });
      expect(screen.getByText('How do I see the materials?')).toBeInTheDocument();
      expect(screen.queryByText('Who can request access?')).not.toBeInTheDocument();
    });
  });

  describe('until the viewer’s state is known', () => {
    it('shows neither content nor a lock before the auth store hydrates', () => {
      useCurrentUserStore.setState({ currentUser: null, isHydrated: false });
      mockedUseGetSpvSpotlight.mockReturnValue({ data: undefined, isError: false });
      render(<SpvSpotlightView slug={MOCK_SPV_SLUG} initialSpotlight={null} />);
      expect(screen.getByLabelText('Loading Spotlight')).toBeInTheDocument();
      expect(screen.queryByText(lockedSignedOutTitle)).not.toBeInTheDocument();
    });

    it('never flashes a lock at a signed-in viewer whose read is in flight', () => {
      useCurrentUserStore.setState({ currentUser: { uid: 'u1' } as never, isHydrated: true });
      mockedUseGetSpvSpotlight.mockReturnValue({ data: undefined, isError: false });
      render(<SpvSpotlightView slug={MOCK_SPV_SLUG} initialSpotlight={null} />);
      expect(screen.getByLabelText('Loading Spotlight')).toBeInTheDocument();
      expect(screen.queryByText(noAccessTitle)).not.toBeInTheDocument();
    });

    it('says the read failed rather than locking the viewer out', () => {
      useCurrentUserStore.setState({ currentUser: { uid: 'u1' } as never, isHydrated: true });
      mockedUseGetSpvSpotlight.mockReturnValue({ data: undefined, isError: true });
      render(<SpvSpotlightView slug={MOCK_SPV_SLUG} initialSpotlight={null} />);
      expect(screen.getByRole('alert')).toHaveTextContent("We couldn't load this Spotlight");
      expect(screen.queryByText(noAccessTitle)).not.toBeInTheDocument();
    });
  });
});
