import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

/** LAB-3300, S3-R10: "Ask the agent" next to "Request an intro", for eligible members inside the agent gate only. */
let canRequest = true;
let agentEnabled = true;

jest.mock('@/services/intro-requests/hooks/useCanRequestIntro', () => ({
  useCanRequestIntro: () => canRequest,
}));

jest.mock('@/services/labos-agent/hooks/useLabosAgentAccess', () => ({
  useLabosAgentAccess: () => agentEnabled,
}));

const onDialogOpened = jest.fn();
jest.mock('@/analytics/intro-requests.analytics', () => ({
  useIntroRequestAnalytics: () => ({
    onButtonShown: jest.fn(),
    onDialogOpened,
    onAskSubmitted: jest.fn(),
    onSubmitFailed: jest.fn(),
    onDialogClosed: jest.fn(),
  }),
}));

import { RequestIntroEntry } from '@/components/page/intro-request/RequestIntroEntry';
import { useLabosAgentStore } from '@/services/labos-agent/store';

describe('LAB-3300: Ask the agent next to Request an intro', () => {
  beforeEach(() => {
    onDialogOpened.mockReset();
    useLabosAgentStore.setState({ isOpen: false, context: null, chats: {}, prefill: null });
  });

  it.each([
    [true, true, true],
    [true, false, false],
    [false, true, false],
    [false, false, false],
  ])('S3-R10: can request %s, agent enabled %s: shows Ask the agent %s', (can, enabled, shows) => {
    canRequest = can;
    agentEnabled = enabled;
    render(<RequestIntroEntry type="MEMBER" targetId="m-1" targetName="Ada Lovelace" />);
    expect(screen.queryByRole('button', { name: 'Ask the agent' }) !== null).toBe(shows);
    expect(screen.queryByRole('button', { name: /Request an intro/ }) !== null).toBe(can);
  });

  it('opens the agent with the intro context and a first message the member can change', () => {
    canRequest = true;
    agentEnabled = true;
    render(<RequestIntroEntry type="TEAM" targetId="t-1" targetName="Acme" />);
    fireEvent.click(screen.getByRole('button', { name: 'Ask the agent' }));

    const state = useLabosAgentStore.getState();
    expect(state.isOpen).toBe(true);
    expect(state.context).toEqual({
      page: 'intro',
      introTarget: { type: 'team', uid: 't-1' },
      label: 'Intro to Acme',
      entryPoint: 'team-header',
    });
    expect(state.prefill).toBe('Help me write an intro request to Acme.');
    // The modal funnel does not count an agent open (S3-R16).
    expect(onDialogOpened).not.toHaveBeenCalled();
  });
});
