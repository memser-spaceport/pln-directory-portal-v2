import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { LabosAgentClient, LabosAgentOpenContext } from '@/types/labos-agent.types';
import { LabosAgentError } from '@/services/labos-agent/labos-agent.errors';
import { mockMentions } from '@/services/labos-agent/labos-agent.mock';

const chat = jest.fn();
const searchMentions = jest.fn();
const client: LabosAgentClient = {
  chat,
  confirmAction: jest.fn(),
  getAccess: async () => ({ enabled: true }),
  searchMentions,
};

jest.mock('@/services/labos-agent/labos-agent.service', () => ({
  ...jest.requireActual('@/services/labos-agent/labos-agent.service'),
  getLabosAgentClient: () => client,
}));

jest.mock('@tanstack/react-query', () => jest.requireActual('@tanstack/react-query'));

const canRequestIntro = jest.fn(() => false);
jest.mock('@/services/intro-requests/hooks/useCanRequestIntro', () => ({
  useCanRequestIntro: () => canRequestIntro(),
}));

jest.mock('@/components/common/Markdown', () => ({
  Markdown: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

import { LabosAgentRoot } from '@/components/core/labos-agent/LabosAgentRoot/LabosAgentRoot';
import { useCurrentUserStore } from '@/services/auth/store';
import { useLabosAgentStore } from '@/services/labos-agent/store';
import type { IUserInfo } from '@/types/shared.types';

const NO_CONTEXT_LINE =
  "I'm not reading any page right now. Add one with + or type @ to point me at a story, team or member.";

const answer = {
  steps: ['Understanding the question'],
  content: 'Mock answer text',
  sources: [],
  sourceRefs: [],
  followUpQuestions: [],
  actions: [],
  proposals: [],
  drafts: [],
};

async function openPanel(context: LabosAgentOpenContext | null = null) {
  window.localStorage.setItem('labos-agent', 'on');
  act(() => useCurrentUserStore.getState().actions.setCurrentUser({ uid: 'mock-viewer' } as IUserInfo));
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <LabosAgentRoot />
    </QueryClientProvider>,
  );
  act(() => useLabosAgentStore.getState().actions.openAgent({ context }));
  return (await screen.findByLabelText('Message the agent')) as HTMLTextAreaElement;
}

/** Types the text the way the composer gets it: the value and the caret at the end. */
function type(input: HTMLTextAreaElement, value: string) {
  fireEvent.change(input, { target: { value, selectionStart: value.length, selectionEnd: value.length } });
}

const picker = () => screen.queryByRole('dialog', { name: 'Add context' });
const hint = () => screen.getByTestId('labos-agent-picker-hint');
const option = (group: string, name: RegExp) =>
  within(screen.getByRole('group', { name: group })).getByRole('option', { name });
const findOption = async (group: string, name: RegExp) =>
  within(await screen.findByRole('group', { name: group })).findByRole('option', { name });

const lastChatRequest = () => chat.mock.calls[chat.mock.calls.length - 1][0];

describe('LAB-3318: agent @mentions (S6 frontend)', () => {
  beforeEach(() => {
    chat.mockReset();
    chat.mockResolvedValue(answer);
    searchMentions.mockReset();
    searchMentions.mockImplementation(async (query) => mockMentions(query));
    canRequestIntro.mockReturnValue(false);
    window.localStorage.clear();
    useLabosAgentStore.setState({ isOpen: false, context: null, readsPage: true, chats: {} });
    useCurrentUserStore.setState({ currentUser: null, isHydrated: true });
  });

  describe('opening and closing', () => {
    it('S6-F1: @ at the start or after a space opens the picker', async () => {
      const input = await openPanel();
      type(input, '@');
      expect(picker()).toBeInTheDocument();
      type(input, 'Ask ');
      expect(picker()).not.toBeInTheDocument();
      type(input, 'Ask @ad');
      expect(picker()).toBeInTheDocument();
      expect(hint()).toHaveTextContent('Matching "ad"');
    });

    it('S6-F1: @ inside a word does not open the picker', async () => {
      const input = await openPanel();
      type(input, 'mail@ada');
      expect(picker()).not.toBeInTheDocument();
    });

    it('S6-F2: a space, Esc or a deleted @ closes the @ picker', async () => {
      const input = await openPanel();
      type(input, '@ad');
      type(input, '@ad ');
      expect(picker()).not.toBeInTheDocument();

      type(input, '@ad');
      type(input, '');
      expect(picker()).not.toBeInTheDocument();

      type(input, '@ad');
      fireEvent.keyDown(input, { key: 'Escape' });
      expect(picker()).not.toBeInTheDocument();
      expect(input).toHaveValue('@ad');
    });

    it('S6-F3: the + button opens the same picker with its own search field and tooltip', async () => {
      await openPanel();
      const add = screen.getByRole('button', { name: 'Add context' });
      expect(add).toHaveAttribute('title', 'Add a page, story, team or member (or type @)');
      fireEvent.click(add);
      expect(picker()).toBeInTheDocument();
      const search = screen.getByRole('combobox', { name: 'Search what to add' });
      expect(search).toHaveFocus();
      fireEvent.change(search, { target: { value: 'sample' } });
      expect(hint()).toHaveTextContent('Matching "sample"');
      expect(await findOption('Teams', /Sample Co/)).toBeInTheDocument();
      fireEvent.click(add);
      expect(picker()).not.toBeInTheDocument();
    });

    it('S6-F4: the hint is "Mention a page, story, team or member" for an empty query', async () => {
      const input = await openPanel();
      type(input, '@');
      expect(hint()).toHaveTextContent(/^Mention a page, story, team or member$/);
    });

    it('S6-F5: the hint is Matching "<query>" while the member types', async () => {
      const input = await openPanel();
      type(input, '@mock');
      expect(hint()).toHaveTextContent(/^Matching "mock"$/);
    });
  });

  describe('groups and search', () => {
    it('S6-F6: groups show in the order Pages, News, Teams, Members', async () => {
      const input = await openPanel();
      type(input, '@mock');
      await screen.findByRole('group', { name: 'Members' });
      const groupNames = () =>
        within(screen.getByRole('listbox'))
          .getAllByRole('group')
          .map((g) => g.getAttribute('aria-label'));
      expect(groupNames()).toEqual(['News', 'Teams', 'Members']);
      type(input, '@');
      await screen.findByRole('group', { name: 'Teams' });
      expect(groupNames()).toEqual(['Pages', 'News', 'Teams']);
    });

    it('S6-F6: an empty group does not show', async () => {
      const input = await openPanel();
      type(input, '@sample co');
      // "sample co" has a space, so the @ picker is closed. Use + for a query with a space.
      expect(picker()).not.toBeInTheDocument();
      type(input, '@ben');
      await screen.findByRole('group', { name: 'Members' });
      expect(screen.queryByRole('group', { name: 'Pages' })).not.toBeInTheDocument();
      expect(screen.queryByRole('group', { name: 'Teams' })).not.toBeInTheDocument();
      expect(screen.queryByRole('group', { name: 'News' })).not.toBeInTheDocument();
    });

    it('S6-F7: the page group has Home, Jobs and Your profile', async () => {
      const input = await openPanel();
      type(input, '@');
      const pages = within(screen.getByRole('group', { name: 'Pages' }));
      expect(pages.getAllByRole('option').map((o) => o.textContent)).toEqual([
        'HHomeLabOS Home',
        'JJobsThe job board',
        'YYour profileYour own profile',
      ]);
    });

    it('S6-F7: the current page shows only after the member removed its chip, and a pick adds the chip back', async () => {
      const input = await openPanel({ page: 'team', teamUid: 'mock-team-labs', label: 'Mock Labs page' });
      type(input, '@');
      expect(within(screen.getByRole('group', { name: 'Pages' })).queryByText('Mock Labs page')).toBeNull();
      fireEvent.keyDown(input, { key: 'Escape' });

      fireEvent.click(screen.getByRole('button', { name: 'Stop reading Mock Labs page' }));
      type(input, '');
      type(input, '@');
      fireEvent.click(option('Pages', /Mock Labs page/));
      expect(screen.getByRole('button', { name: 'Stop reading Mock Labs page' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Remove Mock Labs page' })).toBeNull();

      fireEvent.keyDown(input, { key: 'Enter' });
      await waitFor(() => expect(chat).toHaveBeenCalled());
      expect(lastChatRequest().context).toEqual({ page: 'team', teamUid: 'mock-team-labs' });
      expect(lastChatRequest()).not.toHaveProperty('mentions');
    });

    it('S6-F8: the picker calls C4 once for fast keys, 300 ms after the last key', async () => {
      const input = await openPanel();
      jest.useFakeTimers();
      try {
        type(input, '@m');
        act(() => jest.advanceTimersByTime(100));
        type(input, '@mo');
        act(() => jest.advanceTimersByTime(100));
        type(input, '@moc');
        act(() => jest.advanceTimersByTime(299));
        expect(searchMentions).not.toHaveBeenCalled();
        await act(async () => {
          jest.advanceTimersByTime(1);
        });
        expect(searchMentions).toHaveBeenCalledTimes(1);
        expect(searchMentions.mock.calls[0][0]).toEqual({ q: 'moc' });
      } finally {
        jest.useRealTimers();
      }
    });

    it('S6-F16: a C4 error shows "Search is not available. Try again." and the input keeps its text', async () => {
      for (const status of [400, 403, 429, 0]) {
        searchMentions.mockRejectedValueOnce(new LabosAgentError(status, 'UNKNOWN', 'x'));
      }
      const input = await openPanel();
      for (const [i, q] of ['a', 'ab', 'abc', 'abcd'].entries()) {
        type(input, `Hi @${q}`);
        expect(await screen.findByText('Search is not available. Try again.')).toBeInTheDocument();
        expect(input).toHaveValue(`Hi @${q}`);
        expect(searchMentions).toHaveBeenCalledTimes(i + 1);
      }
    });
  });

  describe('keys and picks', () => {
    it('S6-F9: Down and Enter pick the second row; Up wraps to the last row; Tab picks', async () => {
      const input = await openPanel();
      type(input, '@');
      await screen.findByRole('group', { name: 'Teams' });
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      expect(option('Pages', /Jobs/)).toHaveAttribute('aria-selected', 'true');
      fireEvent.keyDown(input, { key: 'Enter' });
      expect(screen.getByRole('button', { name: 'Remove Jobs' })).toBeInTheDocument();
      expect(chat).not.toHaveBeenCalled();

      type(input, '@Jobs @');
      await screen.findByRole('group', { name: 'Teams' });
      fireEvent.keyDown(input, { key: 'ArrowUp' });
      const rows = screen.getAllByRole('option');
      expect(rows[rows.length - 1]).toHaveAttribute('aria-selected', 'true');
      fireEvent.keyDown(input, { key: 'Tab' });
      expect(screen.getAllByRole('button', { name: /^Remove / })).toHaveLength(2);
    });

    it('S6-F9: Esc closes the picker first, then the panel', async () => {
      const input = await openPanel();
      type(input, '@');
      fireEvent.keyDown(input, { key: 'Escape' });
      expect(picker()).not.toBeInTheDocument();
      expect(screen.getByRole('complementary', { name: 'Agent' })).toBeInTheDocument();
      fireEvent.keyDown(input, { key: 'Escape' });
      expect(screen.queryByRole('complementary', { name: 'Agent' })).not.toBeInTheDocument();
    });

    it('S6-F10: an @ pick puts @<name> in the place of @<query> and adds a chip', async () => {
      const input = await openPanel();
      type(input, 'Ask @samp');
      fireEvent.click(await findOption('Teams', /Sample Co/));
      expect(input).toHaveValue('Ask @Sample Co ');
      expect(screen.getByRole('button', { name: 'Remove Sample Co' })).toBeInTheDocument();
      expect(picker()).not.toBeInTheDocument();
    });

    it('S6-F10: a + pick adds a chip only', async () => {
      const input = await openPanel();
      type(input, 'Compare these');
      fireEvent.click(screen.getByRole('button', { name: 'Add context' }));
      fireEvent.click(await findOption('News', /Mock Labs raises/));
      expect(input).toHaveValue('Compare these');
      expect(screen.getByRole('button', { name: 'Remove Mock Labs raises a mock seed round' })).toBeInTheDocument();
    });

    it('S6-F11: the picker hides the items that already have a chip, also the page chip item', async () => {
      const input = await openPanel({ page: 'home', label: 'Home' });
      type(input, '@');
      await screen.findByRole('group', { name: 'Teams' });
      expect(within(screen.getByRole('group', { name: 'Pages' })).queryByText('Home')).toBeNull();
      fireEvent.click(option('Teams', /Mock Labs/));
      type(input, '@Mock Labs @');
      await screen.findByRole('group', { name: 'Teams' });
      expect(within(screen.getByRole('group', { name: 'Teams' })).queryByText('Mock Labs')).toBeNull();
      expect(option('Teams', /Sample Co/)).toBeInTheDocument();
    });

    it('S6-F12: at 5 chips, + is off and the picker shows "You can add up to 5 items."', async () => {
      const input = await openPanel();
      const picks: [string, RegExp][] = [
        ['Pages', /Home/],
        ['Pages', /Jobs/],
        ['Pages', /Your profile/],
        ['Teams', /Mock Labs/],
        ['Teams', /Sample Co/],
      ];
      for (const [group, name] of picks) {
        type(input, '@');
        fireEvent.click(await findOption(group, name));
      }
      expect(screen.getAllByRole('button', { name: /^Remove / })).toHaveLength(5);
      expect(screen.getByRole('button', { name: 'Add context' })).toBeDisabled();
      const calls = searchMentions.mock.calls.length;
      type(input, `${input.value}@`);
      expect(screen.getByText('You can add up to 5 items.')).toBeInTheDocument();
      expect(screen.queryByRole('option')).toBeNull();
      await act(async () => new Promise((r) => setTimeout(r, 350)));
      expect(searchMentions).toHaveBeenCalledTimes(calls);
    });

    it('S6-F13: the ✕ on a mention chip removes the chip and keeps the @name text', async () => {
      const input = await openPanel();
      type(input, 'Ask @samp');
      fireEvent.click(await findOption('Teams', /Sample Co/));
      fireEvent.click(screen.getByRole('button', { name: 'Remove Sample Co' }));
      expect(screen.queryByRole('button', { name: 'Remove Sample Co' })).toBeNull();
      expect(input).toHaveValue('Ask @Sample Co ');
    });
  });

  describe('send', () => {
    it('S6-F14: C1 gets mentions in the chip order with only type and uid, or type and page', async () => {
      const input = await openPanel({ page: 'home', label: 'Home' });
      type(input, 'Compare @samp');
      fireEvent.click(await findOption('Teams', /Sample Co/));
      type(input, `${input.value}@jo`);
      fireEvent.click(option('Pages', /Jobs/));
      type(input, `${input.value}@ada`);
      fireEvent.click(await findOption('Members', /Ada Mock/));
      fireEvent.keyDown(input, { key: 'Enter' });
      await waitFor(() => expect(chat).toHaveBeenCalledTimes(1));
      const req = lastChatRequest();
      expect(req.message).toBe('Compare @Sample Co @Jobs @Ada Mock');
      expect(req.context).toEqual({ page: 'home' });
      expect(req.mentions).toEqual([
        { type: 'team', uid: 'mock-team-sample' },
        { type: 'page', page: 'job' },
        { type: 'member', uid: 'mock-member-ada' },
      ]);
    });

    it('S6-F15: after a send, the mention chips clear and the page chip stays', async () => {
      const input = await openPanel({ page: 'home', label: 'Home' });
      type(input, 'Ask @samp');
      fireEvent.click(await findOption('Teams', /Sample Co/));
      fireEvent.keyDown(input, { key: 'Enter' });
      expect(await screen.findByText('Mock answer text')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Remove Sample Co' })).toBeNull();
      expect(screen.getByRole('button', { name: 'Stop reading Home' })).toBeInTheDocument();
      expect(input).toHaveValue('');
    });

    it.each([
      ['MEMBER_NOT_FOUND', 'Members', /Ada Mock/, 'Ada Mock', '@ada'],
      ['TEAM_NOT_FOUND', 'Teams', /Sample Co/, 'Sample Co', '@samp'],
      ['NEWS_NOT_FOUND', 'News', /Sample Co ships/, 'Sample Co ships a mock launch', '@ships'],
    ] as const)(
      'S6-F17: a C1 404 %s with mentionIndex marks the chip, shows its text and keeps the message',
      async (code, group, name, label, at) => {
        chat.mockRejectedValueOnce(new LabosAgentError(404, code, 'Not found', undefined, undefined, 1));
        const input = await openPanel();
        type(input, '@jo');
        fireEvent.click(option('Pages', /Jobs/));
        type(input, `${input.value}${at}`);
        fireEvent.click(await findOption(group, name));
        const message = input.value.trim();
        fireEvent.keyDown(input, { key: 'Enter' });

        expect(await screen.findByText(`The agent cannot read ${label}. Remove it and ask again.`)).toBeInTheDocument();
        const failed = screen.getByRole('button', { name: `Remove ${label}` }).parentElement!;
        expect(failed).toHaveAttribute('data-failed', 'true');
        expect(screen.getByRole('button', { name: 'Remove Jobs' }).parentElement).not.toHaveAttribute('data-failed');
        expect(input).toHaveValue(message);
      },
    );

    it('S6-F17: a 404 for context (no mentionIndex) keeps the S5 page text', async () => {
      chat.mockRejectedValueOnce(new LabosAgentError(404, 'TEAM_NOT_FOUND', 'Not found'));
      const input = await openPanel({ page: 'team', teamUid: 't-x', label: 'Team page' });
      type(input, 'Hi');
      fireEvent.keyDown(input, { key: 'Enter' });
      expect(
        await screen.findByText('The agent cannot read this page. Remove the page chip and ask again.'),
      ).toBeInTheDocument();
    });
  });

  describe('placeholder and no-context line', () => {
    it('S6-F18: the placeholder for a member who can request intros', async () => {
      canRequestIntro.mockReturnValue(true);
      const input = await openPanel();
      expect(input).toHaveAttribute('placeholder', 'Ask, request an intro, or type @ to add context');
    });

    it('S6-F19: the placeholder for other members', async () => {
      const input = await openPanel();
      expect(input).toHaveAttribute('placeholder', 'Ask, tell it what to do, or type @ to add context');
    });

    it('S6-F20: a first turn with no context and no mentions shows the line above the answer; later turns do not', async () => {
      const input = await openPanel();
      type(input, 'Hi');
      fireEvent.keyDown(input, { key: 'Enter' });
      await screen.findByText('Mock answer text');
      const line = screen.getByText(NO_CONTEXT_LINE);
      expect(line.compareDocumentPosition(screen.getByText('Mock answer text'))).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
      expect(answer.content).not.toContain(NO_CONTEXT_LINE);

      type(input, 'Again');
      fireEvent.keyDown(input, { key: 'Enter' });
      await waitFor(() => expect(screen.getAllByText('Mock answer text')).toHaveLength(2));
      expect(screen.getAllByText(NO_CONTEXT_LINE)).toHaveLength(1);
    });

    it('S6-F20: no line when the first turn failed; the line shows after a successful Retry of that turn (Oleg)', async () => {
      chat.mockRejectedValueOnce(new LabosAgentError(500, 'UNKNOWN', 'Server error'));
      const input = await openPanel();
      type(input, 'Hi');
      fireEvent.keyDown(input, { key: 'Enter' });
      const retry = await screen.findByRole('button', { name: 'Retry' });
      expect(screen.queryByText(NO_CONTEXT_LINE)).toBeNull();

      fireEvent.click(retry);
      await screen.findByText('Mock answer text');
      expect(chat).toHaveBeenCalledTimes(2);
      expect(lastChatRequest().context).toBeUndefined();
      expect(lastChatRequest().mentions).toBeUndefined();
      const lines = screen.getAllByText(NO_CONTEXT_LINE);
      expect(lines).toHaveLength(1);
      expect(lines[0].compareDocumentPosition(screen.getByText('Mock answer text'))).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      );
    });

    it('S6-F20: no line when the first turn has a context', async () => {
      const input = await openPanel({ page: 'home', label: 'Home' });
      type(input, 'Hi');
      fireEvent.keyDown(input, { key: 'Enter' });
      await screen.findByText('Mock answer text');
      expect(screen.queryByText(NO_CONTEXT_LINE)).toBeNull();
    });

    it('S6-F20: no line when the first turn has a mention', async () => {
      const input = await openPanel();
      type(input, '@jo');
      fireEvent.click(option('Pages', /Jobs/));
      fireEvent.keyDown(input, { key: 'Enter' });
      await screen.findByText('Mock answer text');
      expect(screen.queryByText(NO_CONTEXT_LINE)).toBeNull();
    });
  });

  describe('review fixes (Anna, review 5974557983)', () => {
    it('Finding 1: in @ mode the composer is a combobox that names the listbox and the active option', async () => {
      const input = await openPanel();
      expect(input).not.toHaveAttribute('role');
      type(input, '@');
      await screen.findByRole('group', { name: 'Teams' });
      const listbox = screen.getByRole('listbox', { name: 'Items to add' });
      expect(input).toHaveAttribute('role', 'combobox');
      expect(input).toHaveAttribute('aria-expanded', 'true');
      expect(input).toHaveAttribute('aria-controls', listbox.id);
      const options = screen.getAllByRole('option');
      expect(new Set(options.map((o) => o.id)).size).toBe(options.length);
      expect(input).toHaveAttribute('aria-activedescendant', options[0].id);
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      expect(input).toHaveAttribute('aria-activedescendant', options[1].id);
      expect(options[1]).toHaveAttribute('aria-selected', 'true');
      type(input, '@ ');
      expect(input).not.toHaveAttribute('role');
    });

    it('Finding 1: the + search field is a combobox too', async () => {
      await openPanel();
      fireEvent.click(screen.getByRole('button', { name: 'Add context' }));
      await screen.findByRole('group', { name: 'Teams' });
      const search = screen.getByRole('combobox', { name: 'Search what to add' });
      expect(search).toHaveAttribute('aria-controls', screen.getByRole('listbox').id);
      expect(search).toHaveAttribute('aria-activedescendant', screen.getAllByRole('option')[0].id);
      fireEvent.keyDown(search, { key: 'ArrowDown' });
      expect(search).toHaveAttribute('aria-activedescendant', screen.getAllByRole('option')[1].id);
    });

    it('Finding 1: the Searching and error notes are in a role="status" region', async () => {
      let fail: (e: Error) => void = () => undefined;
      searchMentions.mockImplementationOnce(() => new Promise((_, reject) => (fail = reject)));
      const input = await openPanel();
      type(input, '@zz');
      const status = screen.getByRole('status');
      expect(within(status).getByText('Searching…')).toBeInTheDocument();
      await waitFor(() => expect(searchMentions).toHaveBeenCalled());
      await act(async () => fail(new LabosAgentError(429, 'UNKNOWN', 'x')));
      expect(within(screen.getByRole('status')).getByText('Search is not available. Try again.')).toBeInTheDocument();
    });

    it('Finding 2: after Esc, more keys on the same @ do not open the picker; a new @ does', async () => {
      const input = await openPanel();
      type(input, 'Ask @ad');
      expect(picker()).toBeInTheDocument();
      fireEvent.keyDown(input, { key: 'Escape' });
      expect(picker()).not.toBeInTheDocument();
      type(input, 'Ask @ada');
      expect(picker()).not.toBeInTheDocument();
      type(input, 'Ask @ada and @');
      expect(picker()).toBeInTheDocument();
      expect(screen.getByRole('complementary', { name: 'Agent' })).toBeInTheDocument();
    });

    it('Finding 2: after Esc, a deleted @ and a new @ at the same place open the picker', async () => {
      const input = await openPanel();
      type(input, '@ad');
      fireEvent.keyDown(input, { key: 'Escape' });
      type(input, '');
      type(input, '@');
      expect(picker()).toBeInTheDocument();
    });

    it('Finding 3: Retry after a mention 404 sends the other chips, not the failed chip', async () => {
      chat.mockRejectedValueOnce(new LabosAgentError(404, 'TEAM_NOT_FOUND', 'Not found', undefined, undefined, 1));
      const input = await openPanel();
      type(input, '@jo');
      fireEvent.click(option('Pages', /Jobs/));
      type(input, `${input.value}@samp`);
      fireEvent.click(await findOption('Teams', /Sample Co/));
      fireEvent.keyDown(input, { key: 'Enter' });
      await screen.findByText('The agent cannot read Sample Co. Remove it and ask again.');
      expect(lastChatRequest().mentions).toEqual([
        { type: 'page', page: 'job' },
        { type: 'team', uid: expect.any(String) },
      ]);

      fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
      await screen.findByText('Mock answer text');
      expect(chat).toHaveBeenCalledTimes(2);
      expect(lastChatRequest().mentions).toEqual([{ type: 'page', page: 'job' }]);
    });

    it('Finding 4: a mention 404 with an index outside the chips never marks the page unreadable', async () => {
      chat.mockRejectedValueOnce(new LabosAgentError(404, 'TEAM_NOT_FOUND', 'Not found', undefined, undefined, 7));
      const context = { page: 'team', teamUid: 't-x', label: 'Team page' } as LabosAgentOpenContext;
      const input = await openPanel(context);
      type(input, '@samp');
      fireEvent.click(await findOption('Teams', /Sample Co/));
      fireEvent.keyDown(input, { key: 'Enter' });
      expect(
        await screen.findByText('The agent cannot read one of the items you added. Remove it and ask again.'),
      ).toBeInTheDocument();
      expect(screen.queryByText('The agent cannot read this page. Remove the page chip and ask again.')).toBeNull();
      const chats = useLabosAgentStore.getState().chats;
      expect(Object.values(chats).some((c) => c.pageUnreadable)).toBe(false);
      expect(screen.getByRole('button', { name: 'Stop reading Team page' })).toBeInTheDocument();
    });

    it('Finding 5: Enter does nothing while the @ picker has no row and C4 loads', async () => {
      searchMentions.mockImplementation(() => new Promise(() => undefined));
      const input = await openPanel();
      type(input, 'Ask @zzz');
      expect(screen.queryAllByRole('option')).toHaveLength(0);
      expect(within(screen.getByRole('status')).getByText('Searching…')).toBeInTheDocument();
      fireEvent.keyDown(input, { key: 'Enter' });
      expect(chat).not.toHaveBeenCalled();
      expect(input).toHaveValue('Ask @zzz');
      expect(picker()).toBeInTheDocument();
    });

    it('Finding 6: the chip row is a group named "What the agent reads"', async () => {
      await openPanel({ page: 'home', label: 'Home' });
      const row = screen.getByRole('group', { name: 'What the agent reads' });
      expect(within(row).getByRole('button', { name: 'Stop reading Home' })).toBeInTheDocument();
      expect(within(row).getByRole('button', { name: 'Add context' })).toBeInTheDocument();
    });
  });

  describe('Oleg decisions (#labos-team)', () => {
    const hintShown = () => screen.queryAllByText(/to add new line/).length > 0;

    it('S6-F19: the Shift + Enter hint hides while the composer is empty and shows with text', async () => {
      const input = await openPanel();
      expect(input).toHaveAttribute('placeholder', 'Ask, tell it what to do, or type @ to add context');
      expect(hintShown()).toBe(false);
      type(input, 'Hi');
      expect(hintShown()).toBe(true);
      type(input, '');
      expect(hintShown()).toBe(false);
    });

    it('S6-F19: the hint goes after a send clears the composer, and comes back with a prefill', async () => {
      const input = await openPanel();
      type(input, 'Hi');
      fireEvent.keyDown(input, { key: 'Enter' });
      await screen.findByText('Mock answer text');
      expect(input).toHaveValue('');
      expect(hintShown()).toBe(false);

      act(() => useLabosAgentStore.getState().actions.openAgent({ context: null, prefill: 'Draft an intro' }));
      await waitFor(() => expect(input).toHaveValue('Draft an intro'));
      expect(hintShown()).toBe(true);
      expect(picker()).not.toBeInTheDocument();
    });

    it('S6-F19: the restored text after a mention 404 shows the hint', async () => {
      chat.mockRejectedValueOnce(new LabosAgentError(404, 'TEAM_NOT_FOUND', 'Not found', undefined, undefined, 0));
      const input = await openPanel();
      type(input, 'Ask @samp');
      fireEvent.click(await findOption('Teams', /Sample Co/));
      fireEvent.keyDown(input, { key: 'Enter' });
      await screen.findByText('The agent cannot read Sample Co. Remove it and ask again.');
      expect(input).toHaveValue('Ask @Sample Co');
      expect(hintShown()).toBe(true);
    });

    it('copy: the picker shows "Searching…" with the ellipsis character while C4 loads', async () => {
      searchMentions.mockImplementation(() => new Promise(() => undefined));
      const input = await openPanel();
      type(input, '@zz');
      const note = within(screen.getByRole('status')).getByText('Searching…');
      expect(note.textContent).toBe('Searching\u2026');
      expect(screen.queryByText('Searching')).toBeNull();
    });
  });

  describe('test gaps (Oleg, after #3643)', () => {
    const hintShown = () => screen.queryAllByText(/to add new line/).length > 0;
    const PAGE_404_TEXT = 'The agent cannot read this page. Remove the page chip and ask again.';

    /** Sends the text with no change event, so the @ picker never opens before the send. */
    function sendAsIs(input: HTMLTextAreaElement, text: string) {
      input.value = text;
      fireEvent.keyDown(input, { key: 'Enter' });
    }

    it('(a) a prefill that ends in @name keeps the picker closed', async () => {
      const input = await openPanel();
      act(() => useLabosAgentStore.getState().actions.openAgent({ context: null, prefill: 'Introduce me to @ada' }));
      await waitFor(() => expect(input).toHaveValue('Introduce me to @ada'));
      expect(picker()).not.toBeInTheDocument();
      expect(searchMentions).not.toHaveBeenCalled();
    });

    it('(a) a page-404 restore of text that ends in @name keeps the picker closed', async () => {
      chat.mockRejectedValueOnce(new LabosAgentError(404, 'TEAM_NOT_FOUND', 'Not found'));
      const input = await openPanel({ page: 'team', teamUid: 't-x', label: 'Team page' });
      sendAsIs(input, 'Ask @ada');
      await screen.findByText(PAGE_404_TEXT);
      await waitFor(() => expect(input).toHaveValue('Ask @ada'));
      expect(picker()).not.toBeInTheDocument();
      expect(searchMentions).not.toHaveBeenCalled();
    });

    it('(a) a mention-404 restore of text that ends in @name keeps the picker closed', async () => {
      chat.mockRejectedValueOnce(new LabosAgentError(404, 'TEAM_NOT_FOUND', 'Not found', undefined, undefined, 0));
      const input = await openPanel();
      fireEvent.click(screen.getByRole('button', { name: 'Add context' }));
      fireEvent.click(await findOption('Teams', /Sample Co/));
      sendAsIs(input, 'Compare with @ada');
      await screen.findByText('The agent cannot read Sample Co. Remove it and ask again.');
      await waitFor(() => expect(input).toHaveValue('Compare with @ada'));
      expect(picker()).not.toBeInTheDocument();
      expect(searchMentions).toHaveBeenCalledTimes(1);
    });

    it('(a) after a restore, a new key on the @name opens the picker', async () => {
      chat.mockRejectedValueOnce(new LabosAgentError(404, 'TEAM_NOT_FOUND', 'Not found'));
      const input = await openPanel({ page: 'team', teamUid: 't-x', label: 'Team page' });
      sendAsIs(input, 'Ask @ada');
      await waitFor(() => expect(input).toHaveValue('Ask @ada'));
      type(input, 'Ask @adam');
      expect(picker()).toBeInTheDocument();
      expect(hint()).toHaveTextContent('Matching "adam"');
    });

    it('(b) the Shift + Enter hint shows after a page-404 text restore', async () => {
      chat.mockRejectedValueOnce(new LabosAgentError(404, 'TEAM_NOT_FOUND', 'Not found'));
      const input = await openPanel({ page: 'team', teamUid: 't-x', label: 'Team page' });
      type(input, 'Hi');
      expect(hintShown()).toBe(true);
      fireEvent.keyDown(input, { key: 'Enter' });
      await screen.findByText(PAGE_404_TEXT);
      await waitFor(() => expect(input).toHaveValue('Hi'));
      expect(hintShown()).toBe(true);
    });
  });
});
