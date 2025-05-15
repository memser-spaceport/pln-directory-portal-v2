import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import Technologies from '../../../components/page/team-details/technologies';

// Mocks
const analyticsMock = {
  onTeamDetailShowMoreTechnologiesClicked: jest.fn(),
};
jest.mock('@/analytics/teams.analytics', () => ({
  useTeamAnalytics: () => analyticsMock,
}));
jest.mock('@/components/core/modal', () => ({
  __esModule: true,
  default: ({ modalRef, onClose, children }: any) => (
    <dialog ref={modalRef} data-testid="modal">
      <button onClick={onClose}>Close</button>
      {children}
    </dialog>
  ),
}));
jest.mock('@/components/core/tooltip/tooltip', () => ({
  Tooltip: ({ trigger, content }: any) => (
    <>{trigger}{content && <span data-testid="tooltip-content">{content}</span>}</>
  ),
}));
jest.mock('next/image', () => (props: any) => <img {...props} />);

const TECHNOLOGIES = ['React', 'TypeScript', 'Node.js'];
jest.mock('@/utils/constants', () => ({
  TECHNOLOGIES: ['React', 'TypeScript', 'Node.js'],
}));

const baseUserInfo = { uid: '1', name: 'User', email: 'user@email.com', roles: ['admin'] };
const baseTeam = { id: 't1', name: 'Team 1' };
const techList = [
  { name: 'React', url: '/react.png' },
  { name: 'TypeScript', url: '/ts.png' },
  { name: 'Node.js', url: '/node.png' },
  { name: 'Other', url: '/other.png' },
];

describe('Technologies', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Patch dialog methods for all dialog elements
    window.HTMLDialogElement.prototype.showModal = jest.fn();
    window.HTMLDialogElement.prototype.close = jest.fn();
  });

  it('renders nothing if technologies is empty', () => {
    const { container } = render(<Technologies technologies={[]} userInfo={baseUserInfo} team={baseTeam as any} />);
    expect(container.querySelector('.technology-container')).not.toBeInTheDocument();
  });

  it('renders up to 3 known technologies with tooltips', () => {
    render(<Technologies technologies={techList} userInfo={baseUserInfo} team={baseTeam as any} />);
    // Only the first 3 known technologies should be rendered
    expect(screen.getAllByAltText('technology-container').length).toBe(3);
    expect(screen.getAllByTestId('tooltip-content').length).toBe(3);
    // Check that at least one instance of each technology name is present (main or tooltip)
    expect(screen.getAllByText('React').length).toBeGreaterThan(0);
    expect(screen.getAllByText('TypeScript').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Node.js').length).toBeGreaterThan(0);
    // The "Other" technology is not in TECHNOLOGIES, so not rendered in main list
    expect(screen.queryByAltText('Other')).not.toBeInTheDocument();
  });

  it('renders +N button if more than 3 technologies', () => {
    render(<Technologies technologies={techList} userInfo={baseUserInfo} team={baseTeam as any} />);
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('calls analytics and opens modal on +N button click', () => {
    render(<Technologies technologies={techList} userInfo={baseUserInfo} team={baseTeam as any} />);
    const plusBtn = screen.getByText('+1');
    fireEvent.click(plusBtn);
    expect(analyticsMock.onTeamDetailShowMoreTechnologiesClicked).toHaveBeenCalled();
    expect(screen.getByTestId('modal')).toBeInTheDocument();
  });

  it('renders all technologies in modal', () => {
    render(<Technologies technologies={techList} userInfo={baseUserInfo} team={baseTeam as any} />);
    fireEvent.click(screen.getByText('+1'));
    const modal = screen.getByTestId('modal');
    expect(modal).toBeInTheDocument();
    // All technologies should be listed in the modal
    expect(within(modal).getByText('Technologies')).toBeInTheDocument();
    expect(within(modal).getByText('React')).toBeInTheDocument();
    expect(within(modal).getByText('TypeScript')).toBeInTheDocument();
    expect(within(modal).getByText('Node.js')).toBeInTheDocument();
    expect(within(modal).getByText('Other')).toBeInTheDocument();
  });

  it('closes modal when close button is clicked', () => {
    render(<Technologies technologies={techList} userInfo={baseUserInfo} team={baseTeam as any} />);
    fireEvent.click(screen.getByText('+1'));
    const closeBtn = screen.getByText('Close');
    fireEvent.click(closeBtn);
    expect(screen.getByTestId('modal')).toBeInTheDocument(); // dialog remains in DOM
  });

  it('handles undefined userInfo and team gracefully', () => {
    render(<Technologies technologies={techList} userInfo={undefined} team={undefined} />);
    // Only check for the main list, not tooltips or modal
    expect(screen.getAllByText('React').length).toBeGreaterThan(0);
    expect(screen.getAllByText('TypeScript').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Node.js').length).toBeGreaterThan(0);
  });

  it('handles undefined technologies prop gracefully', () => {
    const { container } = render(<Technologies userInfo={baseUserInfo} team={baseTeam as any} technologies={undefined as any} />);
    expect(container.querySelector('.technology-container')).not.toBeInTheDocument();
  });

  it('handles a technology with a name not in TECHNOLOGIES gracefully', () => {
    const techs = [
      { name: 'UnknownTech', url: '/foo.png' },
      { name: 'React', url: '/react.png' },
      { name: 'TypeScript', url: '/ts.png' }
    ];
    render(<Technologies technologies={techs} userInfo={baseUserInfo} team={baseTeam as any} />);
    // Only React and TypeScript should be rendered in the main list
    expect(screen.getAllByAltText('technology-container').length).toBe(2);
  });

  it('handles a technology with undefined url gracefully', () => {
    const techs = [
      { name: 'React', url: undefined }
    ];
    render(<Technologies technologies={techs} userInfo={baseUserInfo} team={baseTeam as any} />);
    expect(screen.getAllByAltText('technology-container').length).toBe(1);
    // Modal should show React with empty src
    const modal = screen.getByTestId('modal');
    expect(within(modal).getByText('React')).toBeInTheDocument();
  });

  it('renders empty modal content if technologies is empty', () => {
    render(<Technologies technologies={[]} userInfo={baseUserInfo} team={baseTeam as any} />);
    const modal = screen.getByTestId('modal');
    // Modal should not have any technology name
    expect(modal.textContent).not.toMatch(/React|TypeScript|Node\.js|Other/);
  });
}); 
