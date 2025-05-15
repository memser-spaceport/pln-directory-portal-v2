import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MemberProjectContributions from '@/components/page/member-details/member-project-contributions';

// Mocks
jest.mock('@/components/page/member-details/member-project-experience-card', () => ({
  __esModule: true,
  default: ({ experience }: { experience: any }) => <div data-testid="experience-card">{experience?.project?.name || 'No Project'}</div>,
}));

describe('MemberProjectContributions', () => {
  const baseContributions = [
    { project: { name: 'Alpha' } },
    { project: { name: 'Beta' } },
    { project: { name: 'Gamma' } },
  ];
  const baseProps = {
    contributions: baseContributions,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all contributions', () => {
    render(<MemberProjectContributions {...baseProps} />);
    expect(screen.getAllByTestId('experience-card').length).toBe(3);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('Gamma')).toBeInTheDocument();
    expect(screen.getByText('(3)')).toBeInTheDocument();
  });

  it('renders empty state if no contributions', () => {
    render(<MemberProjectContributions contributions={[]} />);
    expect(screen.getByText('No repository found.')).toBeInTheDocument();
    expect(screen.getByText('(0)')).toBeInTheDocument();
  });

  it('filters contributions by search', () => {
    render(<MemberProjectContributions {...baseProps} />);
    const input = screen.getByPlaceholderText('Search');
    fireEvent.change(input, { target: { value: 'alp' } });
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.queryByText('Beta')).not.toBeInTheDocument();
    expect(screen.queryByText('Gamma')).not.toBeInTheDocument();
  });

  it('shows empty state if search yields no results', () => {
    render(<MemberProjectContributions {...baseProps} />);
    const input = screen.getByPlaceholderText('Search');
    fireEvent.change(input, { target: { value: 'zzz' } });
    expect(screen.getByText('No repository found.')).toBeInTheDocument();
  });

  it('resets search and contributions on modal close event', () => {
    render(<MemberProjectContributions {...baseProps} />);
    const input = screen.getByPlaceholderText('Search');
    fireEvent.change(input, { target: { value: 'alp' } });
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    // Dispatch the close-member-projects-modal event
    fireEvent(document, new Event('close-member-projects-modal'));
    expect(input).toHaveValue('');
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('Gamma')).toBeInTheDocument();
  });

  it('renders with contributions undefined', () => {
    render(<MemberProjectContributions contributions={undefined} />);
    expect(screen.getByText('No repository found.')).toBeInTheDocument();
    expect(screen.getByText('(0)')).toBeInTheDocument();
  });

}); 