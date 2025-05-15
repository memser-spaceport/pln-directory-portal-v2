import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TeamProjectCard from '../../../components/page/team-details/team-project-card';

// --- Mocks ---
jest.mock('@/components/core/tooltip/tooltip', () => ({
  Tooltip: ({ trigger, content }: any) => (
    <>{trigger}{content && <span data-testid="tooltip-content">{content}</span>}</>
  ),
}));
jest.mock('@/components/ui/raising-funds', () => ({
  RaisingFunds: () => <span data-testid="raising-funds">RaisingFunds</span>,
}));
jest.mock('next/image', () => (props: any) => <img {...props} />);

const baseProject = {
  uid: 'p1',
  logo: { url: '/logo.png' },
  tagline: 'A great project',
  name: 'Project One',
  lookingForFunding: false,
  hasEditAccess: false,
  isDeleted: false,
  isMaintainingProject: false,
};

describe('TeamProjectCard', () => {
  const baseProps = {
    project: baseProject,
    hasProjectsEditAccess: false,
    url: '/project/p1',
    onCardClicked: jest.fn(),
    onEditClicked: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders project name, tagline, and logo', () => {
    render(<TeamProjectCard {...baseProps} />);
    const nameHeadings = screen.getAllByText('Project One');
    expect(nameHeadings.length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('A great project').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByAltText('team-logo')).toHaveAttribute('src', '/logo.png');
  });

  it('calls onCardClicked when card is clicked', () => {
    render(<TeamProjectCard {...baseProps} />);
    fireEvent.click(screen.getByRole('link'));
    expect(baseProps.onCardClicked).toHaveBeenCalledWith(baseProject);
  });

  it('shows maintainer badge if isMaintainingProject is true', () => {
    render(<TeamProjectCard {...baseProps} project={{ ...baseProject, isMaintainingProject: true }} />);
    const tooltips = screen.getAllByTestId('tooltip-content');
    expect(tooltips.some(el => el.textContent === 'Maintainer')).toBe(true);
  });

  it('shows RaisingFunds badge if lookingForFunding is true', () => {
    render(<TeamProjectCard {...baseProps} project={{ ...baseProject, lookingForFunding: true }} />);
    expect(screen.getByTestId('raising-funds')).toBeInTheDocument();
    expect(screen.getAllByTestId('tooltip-content').some(el => el.textContent === 'Raising Funds')).toBe(true);
  });

  it('stops propagation and prevents default on RaisingFunds badge click', () => {
    render(<TeamProjectCard {...baseProps} project={{ ...baseProject, lookingForFunding: true }} />);
    const badge = screen.getByTestId('raising-funds').parentElement?.parentElement;
    const stopPropagationSpy = jest.spyOn(Event.prototype, 'stopPropagation');
    const preventDefaultSpy = jest.spyOn(Event.prototype, 'preventDefault');
    fireEvent.click(badge as HTMLElement);
    expect(stopPropagationSpy).toHaveBeenCalled();
    expect(preventDefaultSpy).toHaveBeenCalled();
    stopPropagationSpy.mockRestore();
    preventDefaultSpy.mockRestore();
  });

  it('shows edit button if hasEditAccess and not deleted', () => {
    render(<TeamProjectCard {...baseProps} project={{ ...baseProject, hasEditAccess: true }} />);
    expect(screen.getByRole('button', { name: '' })).toBeInTheDocument();
  });

  it('calls onEditClicked and stops propagation on edit button click', () => {
    const onEditClicked = jest.fn();
    render(<TeamProjectCard {...baseProps} project={{ ...baseProject, hasEditAccess: true }} onEditClicked={onEditClicked} />);
    const btn = screen.getByRole('button', { name: '' });
    const stopPropagationSpy = jest.spyOn(Event.prototype, 'stopPropagation');
    const preventDefaultSpy = jest.spyOn(Event.prototype, 'preventDefault');
    fireEvent.click(btn);
    expect(stopPropagationSpy).toHaveBeenCalled();
    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(onEditClicked).toHaveBeenCalledWith({ ...baseProject, hasEditAccess: true });
    stopPropagationSpy.mockRestore();
    preventDefaultSpy.mockRestore();
  });

  it('does not show edit button if deleted', () => {
    render(<TeamProjectCard {...baseProps} project={{ ...baseProject, hasEditAccess: true, isDeleted: true }} />);
    expect(screen.queryByRole('button', { name: '' })).not.toBeInTheDocument();
  });

  it('shows deleted logo and disables card if isDeleted', () => {
    render(<TeamProjectCard {...baseProps} project={{ ...baseProject, isDeleted: true }} />);
    expect(screen.getByAltText('team-logo')).toHaveAttribute('src', '/icons/deleted-project-logo.svg');
    expect(screen.getByRole('link')).toHaveClass('deleted');
    expect(screen.getByRole('link')).toHaveAttribute('title', 'Project does not exist');
  });

  it('shows default logo if no logo and not deleted', () => {
    const { logo, ...projectWithoutLogo } = baseProject;
    render(<TeamProjectCard {...baseProps} project={projectWithoutLogo as any} />);
    expect(screen.getByAltText('team-logo')).toHaveAttribute('src', '/icons/default-project.svg');
  });

  it('renders with minimal props (edge case: empty tagline, name, logo)', () => {
    render(<TeamProjectCard {...baseProps} project={{ ...baseProject, tagline: '', name: '', logo: { url: '' } }} />);
    expect(screen.getByAltText('team-logo')).toHaveAttribute('src', '');
    expect(screen.getByRole('link')).toBeInTheDocument();
  });

  it('renders with missing name and tagline (fallback to empty string)', () => {
    const { logo, ...projectWithoutLogo } = baseProject;
    render(
      <TeamProjectCard
        {...baseProps}
        project={{
          ...projectWithoutLogo,
          name: '',
          tagline: '',
          logo: { url: '/logo.png' }
        }}
      />
    );
    // The h2 and p should be present but empty
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('');
    expect(screen.getByText((content, element) => element?.tagName === 'P' && content === '')).toBeInTheDocument();
  });

  it('renders with null name and tagline (nullish fallback branch)', () => {
    const { logo, ...projectWithoutLogo } = baseProject;
    render(
      <TeamProjectCard
        {...baseProps}
        project={{
          ...projectWithoutLogo,
          name: null,
          tagline: null,
          logo: { url: '/logo.png' }
        } as any}
      />
    );
    // The h2 and p should be present but empty
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('');
    expect(screen.getByText((content, element) => element?.tagName === 'P' && content === '')).toBeInTheDocument();
  });
}); 