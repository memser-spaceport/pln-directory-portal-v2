import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';

import { SuggestedWhy } from '@/components/page/team-details/TeamApplicants/components/SuggestedWhy';
import { suggestedCandidateSchema, type SuggestedCandidate } from '@/schema/suggested-candidates';

/**
 * LAB-2854: the Why suggested pane after Polina's prototype — "Why we
 * suggested Ana", an "In the network" block for what only the product knows,
 * and the requirements grouped with short labels over their statements.
 */

const base: SuggestedCandidate = {
  memberUid: 'm-1',
  name: 'Ana Lopez',
  role: 'Protocol Engineer',
  imageUrl: null,
  fit: 80,
  label: 'Strong match',
  rank: 1,
  blurb: null,
  criteria: [
    { text: 'Hands-on proficiency in Rust', matched: true, label: 'Rust', group: 'Skills' },
    { text: 'Working hours overlapping Europe', matched: false, label: 'Europe hours', group: 'Location' },
    { text: 'Five years of infrastructure work', matched: true, label: '5+ yrs infra', group: 'Experience' },
    { text: 'Writes clearly', matched: false, group: 'Other' },
  ],
};

const renderWhy = (over: Partial<SuggestedCandidate> = {}) =>
  render(<SuggestedWhy suggestion={{ ...base, ...over }} />);

/* Each list's visible header, or null for the flat list. */
const headers = () =>
  screen.getAllByRole('list').map((list) => {
    const id = list.getAttribute('aria-labelledby');
    return id ? document.getElementById(id)?.textContent : null;
  });

describe('SuggestedWhy title', () => {
  it('names the member by first name', () => {
    renderWhy();
    expect(screen.getByRole('heading', { name: 'Why we suggested Ana' })).toBeInTheDocument();
  });

  it('says "them" when there is no name to use', () => {
    renderWhy({ name: '   ' });
    expect(screen.getByRole('heading', { name: 'Why we suggested them' })).toBeInTheDocument();
  });
});

describe('SuggestedWhy In the network', () => {
  it('is absent for a member who did not say they are interested', () => {
    renderWhy({ interested: false, note: 'A note the flag does not back.' });

    expect(screen.queryByText('In the network')).not.toBeInTheDocument();
    expect(screen.queryByText(/Pressed I’m interested/)).not.toBeInTheDocument();
    expect(screen.queryByText('A note the flag does not back.')).not.toBeInTheDocument();
  });

  it('opens the body with the interest press for an interested member, without a note', () => {
    renderWhy({ interested: true });

    expect(headers()[0]).toBe('In the network');
    const network = screen.getByRole('list', { name: 'In the network' });
    expect(within(network).getByRole('listitem')).toHaveTextContent(
      /^Pressed I’m interested on your team or this role$/,
    );
    expect(screen.queryByLabelText('Their note')).not.toBeInTheDocument();
  });

  it('carries the member’s whole note under the interest press', () => {
    renderWhy({ interested: true, note: 'Keen to work on consensus.' });

    const network = screen.getByRole('list', { name: 'In the network' });
    expect(within(network).getByLabelText('Their note')).toHaveTextContent('Keen to work on consensus.');
  });

  it('draws no note area for a blank note', () => {
    renderWhy({ interested: true, note: '   ' });

    expect(screen.getByRole('list', { name: 'In the network' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Their note')).not.toBeInTheDocument();
  });
});

describe('SuggestedWhy requirements', () => {
  it('groups them in the fixed order and hides empty groups', () => {
    renderWhy();

    expect(headers()).toEqual(['Skills', 'Experience', 'Location', 'Other']);
    expect(screen.queryByText('Seniority')).not.toBeInTheDocument();
  });

  it('shows the label over the statement, and "Not on their profile" under a miss', () => {
    renderWhy();

    expect(within(screen.getByRole('list', { name: 'Skills' })).getByRole('listitem')).toHaveTextContent(
      /^Rust — metHands-on proficiency in Rust$/,
    );
    expect(within(screen.getByRole('list', { name: 'Location' })).getByRole('listitem')).toHaveTextContent(
      /^Europe hours — not metWorking hours overlapping EuropeNot on their profile$/,
    );
  });

  it('shows the statement alone when there is no label', () => {
    renderWhy();

    expect(within(screen.getByRole('list', { name: 'Other' })).getByRole('listitem')).toHaveTextContent(
      /^Writes clearly — not metNot on their profile$/,
    );
  });

  it('lists them flat, with no headers, when none has a group', () => {
    renderWhy({
      criteria: [
        { text: 'Hands-on proficiency in Rust', matched: true, label: 'Rust' },
        { text: 'Writes clearly', matched: true },
      ],
    });

    expect(headers()).toEqual([null]);
    const list = screen.getByRole('list', { name: 'Role requirements' });
    expect(
      within(list)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['Rust — metHands-on proficiency in Rust', 'Writes clearly — met']);
  });

  it('lists a group the page has never heard of under Other', () => {
    const parsed = suggestedCandidateSchema.parse({
      ...base,
      criteria: [
        { text: 'Hands-on proficiency in Rust', matched: true, label: 'Rust', group: 'Skills' },
        { text: 'A PhD in distributed systems', matched: true, label: 'PhD', group: 'Education' },
      ],
    });
    render(<SuggestedWhy suggestion={{ ...base, criteria: parsed.criteria }} />);

    expect(headers()).toEqual(['Skills', 'Other']);
    expect(within(screen.getByRole('list', { name: 'Other' })).getByText('PhD')).toBeInTheDocument();
  });

  it('keeps "N of M requirements" in the header', () => {
    renderWhy();
    expect(screen.getByText('2 of 4 requirements')).toBeInTheDocument();
  });
});
