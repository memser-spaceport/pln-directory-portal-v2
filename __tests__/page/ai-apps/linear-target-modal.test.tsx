import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { LinearTargetModal } from '@/components/page/ai-apps/AiAppsPage/components/LinearTargetModal';
import type { AiApp, AiAppLinearTarget, AiAppLinearTeam } from '@/services/ai-apps/ai-apps.service';

let mockTarget: { target: AiAppLinearTarget | null; error: string | null; unavailable: boolean; isLoading: boolean };
jest.mock('@/services/ai-apps/hooks/useAiAppLinearTarget', () => ({
  useAiAppLinearTarget: () => ({ ...mockTarget, forbidden: false }),
}));

let mockTeams: { teams: AiAppLinearTeam[] | null; error: string | null; unavailable: boolean; isLoading: boolean };
jest.mock('@/services/ai-apps/hooks/useAiAppLinearTeams', () => ({
  useAiAppLinearTeams: () => mockTeams,
}));

const mockMutateAsync = jest.fn();
jest.mock('@/services/ai-apps/hooks/useSaveAiAppLinearTarget', () => ({
  useSaveAiAppLinearTarget: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
}));

const mockToastSuccess = jest.fn();
jest.mock('@/components/core/ToastContainer', () => ({
  toast: { success: (...args: unknown[]) => mockToastSuccess(...args) },
}));

const TEAMS: AiAppLinearTeam[] = [
  { id: 't-ops', key: 'OPS', name: 'Ops', projects: [{ id: 'p-q4', name: 'Q4 board' }] },
  { id: 't-web', key: 'WEB', name: 'Web', projects: [] },
];
const EMPTY_TARGET: AiAppLinearTarget = { teamId: null, projectId: null, setAt: null };

const app = { uid: 'app-1', name: 'News Summarizer' } as AiApp;

function teamSelect() {
  return screen.getByRole('combobox', { name: 'Linear team' });
}
function projectSelect() {
  return screen.getByRole('combobox', { name: 'Project (optional)' });
}

describe('LinearTargetModal', () => {
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockTarget = { target: EMPTY_TARGET, error: null, unavailable: false, isLoading: false };
    mockTeams = { teams: TEAMS, error: null, unavailable: false, isLoading: false };
    mockMutateAsync.mockResolvedValue({
      data: { teamId: 't-ops', projectId: null, setAt: '2026-10-16T00:00:00Z' },
      error: null,
    });
  });

  it('lists the private teams as KEY · Name and explains what is sent', () => {
    render(<LinearTargetModal app={app} onClose={onClose} />);
    expect(screen.getByRole('option', { name: 'OPS · Ops' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'WEB · Web' })).toBeInTheDocument();
    expect(screen.getByText('Only private Linear teams you belong to are listed.')).toBeInTheDocument();
    expect(screen.getByText(/Only new private feedback is sent: not comments/)).toBeInTheDocument();
    expect(screen.getByText(/Their emails are never shared/)).toBeInTheDocument();
  });

  it("offers only the chosen team's projects", () => {
    render(<LinearTargetModal app={app} onClose={onClose} />);
    expect(projectSelect()).toBeDisabled();
    fireEvent.change(teamSelect(), { target: { value: 't-ops' } });
    expect(projectSelect()).not.toBeDisabled();
    expect(screen.getByRole('option', { name: 'Q4 board' })).toBeInTheDocument();
    fireEvent.change(teamSelect(), { target: { value: 't-web' } });
    expect(screen.queryByRole('option', { name: 'Q4 board' })).not.toBeInTheDocument();
  });

  it('saves the team and project, then toasts and closes', async () => {
    render(<LinearTargetModal app={app} onClose={onClose} />);
    fireEvent.change(teamSelect(), { target: { value: 't-ops' } });
    fireEvent.change(projectSelect(), { target: { value: 'p-q4' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mockMutateAsync).toHaveBeenCalledWith({ teamId: 't-ops', projectId: 'p-q4' });
    expect(mockToastSuccess).toHaveBeenCalledWith('New feedback on News Summarizer will go to OPS in Linear');
  });

  it('saves a team without a project as projectId null', async () => {
    render(<LinearTargetModal app={app} onClose={onClose} />);
    fireEvent.change(teamSelect(), { target: { value: 't-web' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalledWith({ teamId: 't-web', projectId: null }));
  });

  it('keeps Save disabled until a team is chosen or something changes', () => {
    mockTarget = {
      target: { teamId: 't-ops', projectId: null, setAt: '2026-10-15T00:00:00Z' },
      error: null,
      unavailable: false,
      isLoading: false,
    };
    render(<LinearTargetModal app={app} onClose={onClose} />);
    expect(teamSelect()).toHaveValue('t-ops');
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    fireEvent.change(projectSelect(), { target: { value: 'p-q4' } });
    expect(screen.getByRole('button', { name: 'Save' })).not.toBeDisabled();
  });

  it('"Stop sending" clears the target', async () => {
    mockTarget = {
      target: { teamId: 't-ops', projectId: 'p-q4', setAt: '2026-10-15T00:00:00Z' },
      error: null,
      unavailable: false,
      isLoading: false,
    };
    mockMutateAsync.mockResolvedValue({ data: EMPTY_TARGET, error: null });
    render(<LinearTargetModal app={app} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Stop sending' }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mockMutateAsync).toHaveBeenCalledWith({ teamId: null });
    expect(mockToastSuccess).toHaveBeenCalledWith('Feedback on News Summarizer is no longer sent to Linear');
  });

  it('has no "Stop sending" while nothing is sent', () => {
    render(<LinearTargetModal app={app} onClose={onClose} />);
    expect(screen.queryByRole('button', { name: 'Stop sending' })).not.toBeInTheDocument();
  });

  it("shows the server's 400 message inline and stays open", async () => {
    mockMutateAsync.mockResolvedValue({ data: null, error: 'Linear team t-ops is public; choose a private team' });
    render(<LinearTargetModal app={app} onClose={onClose} />);
    fireEvent.change(teamSelect(), { target: { value: 't-ops' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Linear team t-ops is public; choose a private team')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(mockToastSuccess).not.toHaveBeenCalled();
  });

  it('says Linear is not set up on 503, with Save disabled', () => {
    mockTarget = {
      target: null,
      error: "Linear isn't set up for this environment",
      unavailable: true,
      isLoading: false,
    };
    render(<LinearTargetModal app={app} onClose={onClose} />);
    expect(screen.getByText("Linear isn't set up for this environment.")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('explains what to do when the caller has no private team', () => {
    mockTeams = { teams: [], error: null, unavailable: false, isLoading: false };
    render(<LinearTargetModal app={app} onClose={onClose} />);
    expect(screen.getByText(/You aren't in any private Linear team the LabOS app can reach/)).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Linear team' })).not.toBeInTheDocument();
  });

  it("keeps a team someone else set, even when it isn't one of the caller's", () => {
    mockTarget = {
      target: { teamId: 't-other', projectId: null, setAt: '2026-10-15T00:00:00Z' },
      error: null,
      unavailable: false,
      isLoading: false,
    };
    render(<LinearTargetModal app={app} onClose={onClose} />);
    expect(teamSelect()).toHaveValue('t-other');
    expect(screen.getByRole('option', { name: 'Current team (not one of yours)' })).toBeInTheDocument();
  });
});
