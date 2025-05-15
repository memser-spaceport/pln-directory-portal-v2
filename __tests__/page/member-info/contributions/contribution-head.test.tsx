import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ContributionHead from '../../../../components/page/member-info/contributions/contribution-head';

// Helper to create a contribution object
const makeContribution = (overrides = {}) => ({
  projectName: '',
  currentProject: true,
  ...overrides,
});

describe('ContributionHead', () => {
  const baseProps = {
    expandedId: 0,
    contributionIndex: 0,
    onDeleteContribution: jest.fn(),
    currentProjectsCount: 1,
    contribution: makeContribution(),
    isError: false,
    onToggleExpansion: jest.fn(),
    onProjectStatusChanged: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders project name as Project 1 if projectName is empty', () => {
    render(<ContributionHead {...baseProps} />);
    expect(screen.getByText('Project 1')).toBeInTheDocument();
  });

  it('renders trimmed project name if present', () => {
    render(<ContributionHead {...baseProps} contribution={makeContribution({ projectName: '  My Project  ' })} />);
    expect(screen.getByText('My Project')).toBeInTheDocument();
  });

  it('calls onToggleExpansion with index when arrow-down is clicked (expanded)', () => {
    render(<ContributionHead {...baseProps} expandedId={0} contributionIndex={0} />);
    const arrow = screen.getAllByRole('img')[0];
    fireEvent.click(arrow);
    expect(baseProps.onToggleExpansion).toHaveBeenCalledWith(0);
  });

  it('calls onToggleExpansion with index when arrow-up is clicked (not expanded)', () => {
    render(<ContributionHead {...baseProps} expandedId={1} contributionIndex={0} />);
    const arrow = screen.getAllByRole('img')[0];
    fireEvent.click(arrow);
    expect(baseProps.onToggleExpansion).toHaveBeenCalledWith(0);
  });

  it('calls onDeleteContribution with index when delete icon is clicked', () => {
    render(<ContributionHead {...baseProps} />);
    const deleteIcon = screen.getAllByRole('img')[1];
    fireEvent.click(deleteIcon);
    expect(baseProps.onDeleteContribution).toHaveBeenCalledWith(0);
  });

  it('shows error class when isError is true', () => {
    render(<ContributionHead {...baseProps} isError />);
    expect(screen.getByText('Project 1').closest('.cb')).toHaveClass('cb--error');
  });

  it('disables toggle if currentProject is false and currentProjectsCount is 5', () => {
    render(
      <ContributionHead
        {...baseProps}
        contribution={makeContribution({ currentProject: false })}
        currentProjectsCount={5}
      />
    );
    const toggle = screen.getByRole('checkbox');
    expect(toggle).toHaveStyle('pointer-events: none');
  });

  it('enables toggle if currentProject is true or currentProjectsCount < 5', () => {
    render(
      <ContributionHead
        {...baseProps}
        contribution={makeContribution({ currentProject: true })}
        currentProjectsCount={4}
      />
    );
    const toggle = screen.getByRole('checkbox');
    expect(toggle).not.toBeDisabled();
  });

  it('calls onProjectStatusChanged when toggle is changed', () => {
    render(
      <ContributionHead
        {...baseProps}
        contribution={makeContribution({ currentProject: true })}
      />
    );
    const toggle = screen.getByRole('checkbox');
    fireEvent.click(toggle);
    expect(baseProps.onProjectStatusChanged).toHaveBeenCalled();
  });

  it('shows correct title when max current projects reached', () => {
    render(
      <ContributionHead
        {...baseProps}
        contribution={makeContribution({ currentProject: false })}
        currentProjectsCount={5}
      />
    );
    const toggleDiv = screen.getByTitle('Max 5 projects can be set as current');
    expect(toggleDiv).toBeInTheDocument();
  });

  it('shows correct title when not at max current projects', () => {
    render(
      <ContributionHead
        {...baseProps}
        contribution={makeContribution({ currentProject: true })}
        currentProjectsCount={3}
      />
    );
    const toggleDiv = screen.getByTitle('On/Off');
    expect(toggleDiv).toBeInTheDocument();
  });

  it('does not show error class when isError is undefined (default false)', () => {
    const { container } = render(
      <ContributionHead
        {...baseProps}
        isError={false}
      />
    );
    expect(container.querySelector('.cb')).not.toHaveClass('cb--error');
  });
}); 