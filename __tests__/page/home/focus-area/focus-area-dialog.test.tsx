import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import FocusAreaDialog from '@/components/page/home/focus-area/focus-area-dialog';
import { HOME } from '@/utils/constants';

beforeAll(() => {
  // Mock showModal and close for all dialog elements
  window.HTMLDialogElement.prototype.showModal = function () {};
  window.HTMLDialogElement.prototype.close = function () {};
});

// Mocks
const mockAnalytics = {
  onFocusAreaTeamsClicked: jest.fn(),
  onFocusAreaProjectsClicked: jest.fn(),
};

jest.mock('@/analytics/home.analytics', () => ({
  useHomeAnalytics: () => mockAnalytics,
}));

jest.mock('@/utils/common.utils', () => ({
  getAnalyticsUserInfo: jest.fn(() => ({ name: 'Test User', email: 'test@example.com', roles: ['admin'] })),
  getAnalyticsFocusAreaInfo: jest.fn((focusArea) => ({ id: focusArea?.uid, title: focusArea?.title })),
}));

// Helper: mock userInfo and focusArea
const userInfo = { uid: '1', name: 'Test User', email: 'test@example.com', roles: ['admin'] };
const teamAncestorFocusAreas = [
  { team: { uid: 't1', logo: { url: '/logo1.png' } } },
  { team: { uid: 't2', logo: { url: '/logo2.png' } } },
  { team: { uid: 't3', logo: { url: '/logo3.png' } } },
  { team: { uid: 't4', logo: { url: '/logo4.png' } } },
];
const projectAncestorFocusAreas = [
  { project: { uid: 'p1', logo: { url: '/proj1.png' } } },
  { project: { uid: 'p2', logo: { url: '/proj2.png' } } },
  { project: { uid: 'p3', logo: { url: '/proj3.png' } } },
  { project: { uid: 'p4', logo: { url: '/proj4.png' } } },
];
const focusArea = {
  uid: 'fa1',
  title: 'Focus Area 1',
  description: 'Description for focus area 1',
  teamAncestorFocusAreas,
  projectAncestorFocusAreas,
};

describe('FocusAreaDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function triggerDialogOpen(focusAreaData = focusArea) {
    act(() => {
      document.dispatchEvent(
        new CustomEvent(HOME.TRIGGER_FOCUS_AREA_DIALOG, { detail: { focusArea: focusAreaData } })
      );
    });
  }

  it('does not render modal content initially', () => {
    render(<FocusAreaDialog userInfo={userInfo} />);
    expect(screen.queryByText('Focus Area 1')).not.toBeInTheDocument();
  });

  it('renders modal with correct focus area data when event is triggered', () => {
    render(<FocusAreaDialog userInfo={userInfo} />);
    triggerDialogOpen();
    expect(screen.getAllByText('Focus Area 1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Description for focus area 1').length).toBeGreaterThan(0);
    // Teams and Projects counts
    expect(screen.getAllByText('4').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Teams').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Projects').length).toBeGreaterThan(0);
    // Avatars (max 3, filter out arrow icons)
    const teamAvatars = screen.getAllByAltText('team').filter(
      img => !(img as HTMLImageElement).src.includes('/icons/')
    );
    expect(teamAvatars.length).toBe(3);
    const projectAvatars = screen.getAllByAltText('project').filter(
      img => !(img as HTMLImageElement).src.includes('/icons/')
    );
    expect(projectAvatars.length).toBe(3);
  });

  it('renders with empty teams/projects gracefully', () => {
    render(<FocusAreaDialog userInfo={userInfo} />);
    triggerDialogOpen({ ...focusArea, teamAncestorFocusAreas: [], projectAncestorFocusAreas: [] });
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
    expect(screen.queryByAltText('team')).not.toBeInTheDocument();
    expect(screen.queryByAltText('project')).not.toBeInTheDocument();
  });

  it('calls analytics and opens new tab when team arrow is clicked', () => {
    render(<FocusAreaDialog userInfo={userInfo} />);
    triggerDialogOpen();
    // The first arrow for teams
    const arrows = screen.getAllByRole('img', { hidden: true });
    const teamArrowBtn = (arrows.find(img => (img as HTMLImageElement).src.includes('arrow-blue-right.svg')) as HTMLImageElement);
    // Mock window.open
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
    fireEvent.click(teamArrowBtn!);
    expect(openSpy).toHaveBeenCalledWith('/teams?focusAreas=Focus Area 1', '_blank');
    expect(mockAnalytics.onFocusAreaTeamsClicked).toHaveBeenCalled();
    openSpy.mockRestore();
  });

  it('calls analytics and opens new tab when project arrow is clicked', () => {
    render(<FocusAreaDialog userInfo={userInfo} />);
    triggerDialogOpen();
    // The second arrow for projects
    const arrows = screen.getAllByRole('img', { hidden: true });
    const projectArrowBtn = (arrows.reverse().find(img => (img as HTMLImageElement).src.includes('arrow-blue-right.svg')) as HTMLImageElement);
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
    fireEvent.click(projectArrowBtn!);
    expect(openSpy).toHaveBeenCalledWith('/projects?focusAreas=Focus Area 1', '_blank');
    expect(mockAnalytics.onFocusAreaProjectsClicked).toHaveBeenCalled();
    openSpy.mockRestore();
  });

  it('closes modal and resets state when close button is clicked', () => {
    render(<FocusAreaDialog userInfo={userInfo} />);
    triggerDialogOpen();
    // Find close button (second button in the modal)
    const closeBtn = screen.getAllByRole('button', { hidden: true }).find(
      btn => btn.querySelector('img[alt="close"]')
    );
    fireEvent.click(closeBtn!);
    // Modal should be closed (content not in DOM)
    expect(screen.queryByText('Focus Area 1')).not.toBeInTheDocument();
  });

  it('cleans up event listener on unmount', () => {
    const addSpy = jest.spyOn(document, 'addEventListener');
    const removeSpy = jest.spyOn(document, 'removeEventListener');
    const { unmount } = render(<FocusAreaDialog userInfo={userInfo} />);
    unmount();
    expect(removeSpy).toHaveBeenCalled();
    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it('handles missing focusArea fields gracefully', () => {
    render(<FocusAreaDialog userInfo={userInfo} />);
    triggerDialogOpen({
      uid: '',
      title: '',
      description: '',
      teamAncestorFocusAreas: [],
      projectAncestorFocusAreas: [],
    });
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
  });

  it('removes the correct event listener on unmount (coverage for cleanup branch)', () => {
    const removeSpy = jest.spyOn(document, 'removeEventListener');
    const { unmount } = render(<FocusAreaDialog userInfo={userInfo} />);
    unmount();
    // The event type and a function are passed
    expect(removeSpy).toHaveBeenCalledWith(
      HOME.TRIGGER_FOCUS_AREA_DIALOG,
      expect.any(Function)
    );
    removeSpy.mockRestore();
  });

  it('handles async updateFocusArea (function coverage for async branch)', async () => {
    render(<FocusAreaDialog userInfo={userInfo} />);
    // Trigger the dialog open event
    act(() => {
      document.dispatchEvent(
        new CustomEvent(HOME.TRIGGER_FOCUS_AREA_DIALOG, { detail: { focusArea } })
      );
    });
    // Wait for the next tick to ensure the async function is fully executed
    await Promise.resolve();
    // Now check that the modal content is present
    expect(screen.getAllByText('Focus Area 1').length).toBeGreaterThan(0);
  });
});

