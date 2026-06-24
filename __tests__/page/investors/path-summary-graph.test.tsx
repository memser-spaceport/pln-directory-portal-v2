import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { PathSummaryGraph, buildCaption } from '@/components/page/investors/PathSummaryGraph/PathSummaryGraph';
import type { PathfinderPath } from '@/services/investors/types';

function path(overrides: Partial<PathfinderPath>): PathfinderPath {
  return {
    id: 1,
    target_investor_id: 'inv-1',
    connector_type: 'F',
    hops: 1,
    caliber: 'A',
    proximity_code: 'F+1A',
    score: 0.62,
    caliber_confidence: 0.9,
    hop_chain: { nodes: [], edges: [], explanation: '' },
    rank: 1,
    corrections: [],
    ...overrides,
  };
}

describe('PathSummaryGraph', () => {
  it('renders nothing when there is no best path', () => {
    const { container } = render(<PathSummaryGraph bestPath={null} investorName="Lena Hoffmann" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the contact inside the Protocol Labs node and links members', () => {
    render(
      <PathSummaryGraph
        bestPath={path({ contact: { name: 'Alicia Mer', member_uid: 'alicia-mer' } })}
        investorName="Lena Hoffmann"
      />,
    );
    expect(screen.getByText('Protocol Labs')).toBeInTheDocument();
    expect(screen.getByText('Alicia Mer')).toBeInTheDocument();
    expect(screen.getByText('Lena Hoffmann')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Alicia Mer/ })).toHaveAttribute('href', '/members/alicia-mer');
  });

  it('falls back to the org connector with an unknown-contact mark', () => {
    render(
      <PathSummaryGraph
        bestPath={path({ contact: undefined, org_connector: { name: 'Pico Ventures' } })}
        investorName="Lena Hoffmann"
      />,
    );
    expect(screen.getByText('Pico Ventures')).toBeInTheDocument();
    expect(screen.getByLabelText('contact unknown')).toBeInTheDocument();
  });

  it('renders a plain Protocol Labs node when no connector is resolved', () => {
    render(<PathSummaryGraph bestPath={path({})} investorName="Lena Hoffmann" />);
    expect(screen.getByText('Protocol Labs')).toBeInTheDocument();
    expect(screen.queryByLabelText('contact unknown')).not.toBeInTheDocument();
  });

  it('shows the tie score and relative last-email in the caption', () => {
    const recent = new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString();
    render(<PathSummaryGraph bestPath={path({ score: 0.62 })} investorName="Lena" lastEmailAt={recent} />);
    expect(screen.getByText(/tie 0\.62 · last email .*ago/)).toBeInTheDocument();
  });
});

describe('buildCaption', () => {
  it('omits the tie segment for a non-finite or out-of-range score', () => {
    expect(buildCaption(NaN)).toBe('');
    expect(buildCaption(1.5)).toBe('');
  });

  it('shows only the tie segment when no last-email date is present', () => {
    expect(buildCaption(0.62)).toBe('tie 0.62');
    expect(buildCaption(0.62, null)).toBe('tie 0.62');
  });

  it('omits the last-email segment for a future date (no dangling separator)', () => {
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();
    expect(buildCaption(0.62, future)).toBe('tie 0.62');
  });
});
