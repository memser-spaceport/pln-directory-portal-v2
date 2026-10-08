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
// Loaded, no investor profile. `undefined` is the member read still in flight.
const MEMBER_WITHOUT_PROFILE = { memberInfo: {} };
let mockMember: unknown = MEMBER_WITHOUT_PROFILE;

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
// Stable fns for the events the tests assert on; every other event gets a
// throwaway fn (a fresh jest.fn() per read can't be asserted).
const mockAnalytics: Record<string, jest.Mock> = {
  onOpenDataRoomClicked: jest.fn(),
  onSupportEmailClicked: jest.fn(),
  onInvestorProfileClicked: jest.fn(),
};
jest.mock('@/analytics/spv-spotlight.analytics', () => ({
  useSpvSpotlightAnalytics: () =>
    new Proxy(mockAnalytics, {
      get: (target, key: string) => target[key] ?? jest.fn(),
    }),
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
  {
    signedIn = false,
    initial = true,
    overrides = {},
  }: { signedIn?: boolean; initial?: boolean; overrides?: Partial<SpvSpotlight> } = {},
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
    ...overrides,
  };
  mockedUseGetSpvSpotlight.mockReturnValue({ data: spotlight, isError: false });
  return render(<SpvSpotlightView slug={MOCK_SPV_SLUG} initialSpotlight={initial ? spotlight : null} />);
};

const topBar = () => screen.getByText('PL Spotlight').closest('header') as HTMLElement;
const card = () => screen.getByRole('article');

const band = () => screen.queryByRole('region', { name: 'Data room' });
const dataRoomLinks = () => screen.queryAllByRole('link', { name: /Access data room/ });

const requestButton = () => screen.queryByRole('button', { name: /Request access to data room/ });

beforeEach(() => {
  mockGoToLogin.mockReset();
  mockEmitAuthEvent.mockReset();
  mockClearAuthCookies.mockReset();
  mockedUseGetSpvSpotlight.mockReset();
  mockShowExplore = false;
  mockRequestFlow = false;
  mockSearch = '';
  mockMember = MEMBER_WITHOUT_PROFILE;
  Object.values(mockAnalytics).forEach((fn) => fn.mockReset());
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
    const link = within(card()).getByRole('link', { name: /Access data room/ });
    expect(link).toHaveAttribute('href', 'https://docsend.com/view/x');
    expect(link).toHaveAttribute('target', '_blank');
    expect(screen.getByRole('button', { name: 'Set up your investor profile' })).toBeInTheDocument();
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
    expect(dataRoomLinks()).toHaveLength(0);
    expect(band()).not.toBeInTheDocument();
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
    // The FAQ subtitle and the footer each carry it (the request flow's FAQ answers don't).
    expect(screen.getAllByRole('link', { name: base.supportEmail })).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Set up your investor profile' })).toBeInTheDocument();
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
      expect(screen.getByText('If you think you should have access, contact us.')).toBeInTheDocument();
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
      expect(profileCard).toHaveTextContent(
        "Tell us how you invest, and we'll only send you deals that fit your check size, stages and focus. Set up your investor profile",
      );
    });

    it('holds the profile sentence back until the member read lands', () => {
      mockMember = undefined;
      renderView('OPEN', 'APPROVED', { signedIn: true, initial: false });
      expect(screen.queryByRole('region', { name: 'Your investor profile' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /your investor profile/ })).not.toBeInTheDocument();
    });

    it('links the data room from the team card, its one filled primary', () => {
      renderView('OPEN', 'APPROVED', { signedIn: true, initial: false });
      const link = within(card()).getByRole('link', { name: /Access data room/ });
      expect(link).toHaveAttribute('href', 'https://docsend.com/view/x');
      // The sentence is the profile's only door in the page body.
      expect(screen.getAllByRole('button', { name: /your investor profile/ })).toHaveLength(1);
    });

    it('notes the close date (UTC) and where the terms are under the card button', () => {
      renderView('OPEN', 'APPROVED', { signedIn: true, initial: false });
      expect(within(card()).getByText('Closes Oct 31, 2026')).toBeInTheDocument();
      expect(within(card()).getByText('Allocation, minimum check and SPV terms are inside.')).toBeInTheDocument();
    });

    it('drops every "Closes" line when the spotlight has no close date', () => {
      renderView('OPEN', 'APPROVED', { signedIn: true, initial: false, overrides: { closesAt: null } });
      expect(screen.queryByText(/Closes/)).not.toBeInTheDocument();
      expect(within(card()).getByText('Allocation, minimum check and SPV terms are inside.')).toBeInTheDocument();
      expect(band()).toBeInTheDocument();
    });

    it('repeats the data room in a band between the Explore tile and the FAQ', () => {
      mockShowExplore = true;
      renderView('OPEN', 'APPROVED', { signedIn: true, initial: false });
      const region = band() as HTMLElement;
      expect(region).toBeInTheDocument();
      expect(within(region).getByRole('heading', { name: 'Netholabs SPV' })).toBeInTheDocument();
      expect(region).toHaveTextContent(
        'Protocol Labs is leading an SPV into the Netholabs pre-seed round. The pitch, allocation, minimum check and SPV terms are in the data room.',
      );
      expect(within(region).getByText('Closes Oct 31, 2026')).toBeInTheDocument();
      // One link (stretched over the band), nothing else to press.
      const links = within(region).getAllByRole('link');
      expect(links).toHaveLength(1);
      expect(links[0]).toHaveAccessibleName(/Access data room/);
      expect(links[0]).toHaveAttribute('href', 'https://docsend.com/view/x');
      expect(links[0]).toHaveAttribute('target', '_blank');
      expect(within(region).queryAllByRole('button')).toHaveLength(0);

      const explore = screen.getByRole('link', { name: /Explore the PL Network/ });
      const faq = screen.getByText('Questions investors ask');
      expect(explore.compareDocumentPosition(region) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(region.compareDocumentPosition(faq) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('still reads when the team has no funding stage', () => {
      renderView('OPEN', 'APPROVED', {
        signedIn: true,
        initial: false,
        overrides: { team: { ...base.team, fundingStage: null } },
      });
      expect(band()).toHaveTextContent('Protocol Labs is leading an SPV into the Netholabs round.');
    });

    it('has no band while the data room is being prepared (open, no DocSend yet)', () => {
      renderView('OPEN', 'APPROVED', { signedIn: true, initial: false, overrides: { docSendUrl: null } });
      expect(screen.getByText('Data room is being prepared')).toBeInTheDocument();
      expect(band()).not.toBeInTheDocument();
      expect(screen.queryByText(/Closes/)).not.toBeInTheDocument();
    });

    it.each([
      ['DRAFT', 'Data room opens soon'],
      ['CLOSED', 'Data room closed'],
    ] as const)('has no band or close date when %s', (status, line) => {
      renderView(status, 'APPROVED', { signedIn: true, initial: false });
      expect(screen.getByText(line)).toBeInTheDocument();
      expect(band()).not.toBeInTheDocument();
      expect(screen.queryByText(/Closes/)).not.toBeInTheDocument();
    });

    it('tells the analytics which data room button was pressed', async () => {
      renderView('OPEN', 'APPROVED', { signedIn: true, initial: false });
      await userEvent.click(within(card()).getByRole('link', { name: /Access data room/ }));
      expect(mockAnalytics.onOpenDataRoomClicked).toHaveBeenCalledTimes(1);
      expect(mockAnalytics.onOpenDataRoomClicked).toHaveBeenLastCalledWith(
        expect.objectContaining({ source: 'team-card', view_state: 'open' }),
      );
      await userEvent.click(within(band() as HTMLElement).getByRole('link'));
      expect(mockAnalytics.onOpenDataRoomClicked).toHaveBeenCalledTimes(2);
      expect(mockAnalytics.onOpenDataRoomClicked).toHaveBeenLastCalledWith(expect.objectContaining({ source: 'band' }));
    });

    it('offers to set up a profile when the investor has none, and opens the drawer', async () => {
      renderView('OPEN', 'APPROVED', { signedIn: true, initial: false });
      await userEvent.click(screen.getByRole('button', { name: 'Set up your investor profile' }));
      expect(screen.getByText('Investor profile drawer')).toBeInTheDocument();
      expect(mockAnalytics.onInvestorProfileClicked).toHaveBeenCalledWith(
        expect.objectContaining({ source: 'profile-card', profile_state: 'setup' }),
      );
    });

    it('offers to review a profile that has a type (Demo Day, a past deal)', () => {
      mockMember = { memberInfo: { investorProfile: { type: 'ANGEL' } } };
      renderView('OPEN', 'APPROVED', { signedIn: true, initial: false });
      expect(screen.getByRole('region', { name: 'Your investor profile' })).toHaveTextContent(
        'Review your investor profile to keep the deals we send you matched to your check size, stages and focus.',
      );
      expect(screen.getByRole('button', { name: 'Review your investor profile' })).toBeInTheDocument();
    });

    it('still says set up for a profile without a type (created by an access request)', () => {
      mockMember = { memberInfo: { investorProfile: { type: null, secRulesAccepted: true } } };
      renderView('OPEN', 'APPROVED', { signedIn: true, initial: false });
      expect(screen.getByRole('button', { name: 'Set up your investor profile' })).toBeInTheDocument();
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
      expect(screen.getByText(/^Access data room opens the team.s DocSend\./)).toBeInTheDocument();
      expect(screen.queryByText('Who can request access?')).not.toBeInTheDocument();
    });

    it('answers "Why can\'t I open this page?" with the support email', async () => {
      renderView('OPEN', 'APPROVED', { signedIn: true, initial: false });
      expect(screen.queryByText('The page says I do not have access.')).not.toBeInTheDocument();
      const answer = screen.getByText(/^Spotlights are shared by invitation/);
      const mail = within(answer).getByRole('link', { name: base.supportEmail });
      expect(mail).toHaveAttribute('href', `mailto:${base.supportEmail}`);
      expect(screen.getByText("Why can't I open this page?")).toBeInTheDocument();
      // The subtitle, this answer and the footer.
      expect(screen.getAllByRole('link', { name: base.supportEmail })).toHaveLength(3);
      await userEvent.click(mail);
      expect(mockAnalytics.onSupportEmailClicked).toHaveBeenCalledWith(
        expect.objectContaining({ source: 'faq-answer' }),
      );
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
