import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Funding from '../../../components/page/team-details/funding';

// --- Mocks ---
jest.mock('@/components/core/tooltip/tooltip', () => ({
  Tooltip: ({ trigger, content }: any) => (
    <div data-testid="tooltip-mock">{trigger}<span data-testid="tooltip-content">{content}</span></div>
  ),
}));
jest.mock('@/components/ui/tag', () => ({
  Tag: ({ value }: any) => <span data-testid="tag-mock">{value}</span>,
}));

describe('Funding', () => {
  const baseTeam = {
    fundingStage: { title: 'Series A' },
    membershipSources: [
      { title: 'Y Combinator' },
      { title: 'Techstars' },
    ],
  };

  it('renders Not available if membershipSources is empty', () => {
    render(<Funding team={{ ...baseTeam, membershipSources: [] } as any} />);
    expect(screen.getByText('Not available')).toBeInTheDocument();
  });

  it('renders Not available if membershipSources is undefined', () => {
    render(<Funding team={{ ...baseTeam, membershipSources: undefined } as any} />);
    expect(screen.getByText('Not available')).toBeInTheDocument();
  });

  it('renders with missing fundingStage', () => {
    render(<Funding team={{ ...baseTeam, fundingStage: undefined } as any} />);
    expect(screen.getByText('Funding Stage')).toBeInTheDocument();
    // The heading for funding stage should be empty
    const heading = document.querySelector('.funding__seriesconainer__title-container__series');
    expect(heading).toBeInTheDocument();
    expect(heading).toBeEmptyDOMElement();
  });

  it('renders with empty team object', () => {
    render(<Funding team={{} as any} />);
    expect(screen.getByText('Funding Stage')).toBeInTheDocument();
    expect(screen.getByText('Membership Sources:')).toBeInTheDocument();
    expect(screen.getByText('Not available')).toBeInTheDocument();
  });
}); 