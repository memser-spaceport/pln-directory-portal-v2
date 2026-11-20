import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import type { LabosAgentSourceRef, LabosAgentTurn as Turn } from '@/types/labos-agent.types';

// Markdown pulls in an ESM-only highlighter that Jest cannot parse.
jest.mock('@/components/common/Markdown', () => ({
  Markdown: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

import { LabosAgentTurn } from '@/components/core/labos-agent/LabosAgentTurn/LabosAgentTurn';
import { sourceRefLabel } from '@/services/labos-agent/labos-agent.sources';

/** LAB-3298 (D8, Oleg's QA): readable labels under "Sources", and the domain as the title of a web ref with an empty or URL title. */
const turn = (sourceRefs: LabosAgentSourceRef[]): Turn => ({
  id: 't-1',
  message: 'Who works on this?',
  status: 'done',
  steps: [],
  content: 'An answer.',
  sources: [],
  sourceRefs,
  followUpQuestions: [],
  proposals: [],
  cards: {},
  drafts: [],
  draftCards: {},
  startedAt: 0,
  endedAt: 1000,
});

const renderTurn = (sourceRefs: LabosAgentSourceRef[]) =>
  render(
    <LabosAgentTurn
      turn={turn(sourceRefs)}
      busy={false}
      onFollowUp={jest.fn()}
      onRetry={jest.fn()}
      onDecide={jest.fn()}
    />,
  );

describe('LAB-3298 D8: source labels', () => {
  it('shows Team, Project, Member and LabOS news, never the raw type', () => {
    renderTurn([
      { type: 'team', title: 'Textile', directoryLink: '/teams/t-1' },
      { type: 'project', title: 'IPFS', directoryLink: '/projects/p-1' },
      { type: 'member', title: 'A member', directoryLink: '/members/m-1' },
      { type: 'news', title: 'A story', directoryLink: '/?news=n-1' },
    ]);
    const metaOf = (title: string) => screen.getByText(title).closest('a')?.textContent?.replace(title, '');
    expect(metaOf('Textile')).toBe('Team');
    expect(metaOf('IPFS')).toBe('Project');
    expect(metaOf('A member')).toBe('Member');
    expect(metaOf('A story')).toBe('LabOS news');
    ['team', 'project', 'member'].forEach((raw) => expect(screen.queryByText(raw)).not.toBeInTheDocument());
  });

  it('shows the domain as the title and Web as the label of an external ref, not the raw URL', () => {
    renderTurn([
      {
        type: 'external',
        title: 'https://www.textile.io/blog/post?x=1',
        externalUrl: 'https://www.textile.io/blog/post?x=1',
      },
    ]);
    const link = screen.getByText('textile.io').closest('a');
    expect(link).toHaveAttribute('href', 'https://www.textile.io/blog/post?x=1');
    expect(link).toHaveTextContent('textile.ioWeb');
    expect(screen.queryByText('https://www.textile.io/blog/post?x=1')).not.toBeInTheDocument();
    expect(screen.queryByText('external')).not.toBeInTheDocument();
  });

  it('keeps the real page title of a web ref from searchWeb, and shows the domain only for an empty or URL title', () => {
    const url = 'https://www.textile.io/blog/post';
    expect(sourceRefLabel({ type: 'web', title: 'Textile raises a seed round', externalUrl: url })).toEqual({
      title: 'Textile raises a seed round',
      meta: 'Web',
    });
    expect(sourceRefLabel({ type: 'web', title: '', externalUrl: url })).toEqual({ title: 'textile.io', meta: 'Web' });
    expect(sourceRefLabel({ type: 'web', title: '  ', externalUrl: url })).toEqual({
      title: 'textile.io',
      meta: 'Web',
    });
    expect(sourceRefLabel({ type: 'web', title: 'www.textile.io/blog', externalUrl: url })).toEqual({
      title: 'textile.io',
      meta: 'Web',
    });
    expect(sourceRefLabel({ type: 'external', title: 'http://textile.io', externalUrl: url })).toEqual({
      title: 'textile.io',
      meta: 'Web',
    });
    renderTurn([{ type: 'web', title: 'Textile raises a seed round', externalUrl: url }]);
    expect(screen.getByText('Textile raises a seed round').closest('a')).toHaveAttribute('href', url);
    expect(screen.queryByText('textile.io')).not.toBeInTheDocument();
  });

  it('sourceRefLabel: a web ref with no valid link keeps its title; an unknown type gets a capital letter', () => {
    expect(sourceRefLabel({ type: 'web', title: 'A page', externalUrl: 'javascript:alert(1)' })).toEqual({
      title: 'A page',
      meta: 'Web',
    });
    expect(sourceRefLabel({ type: 'event', title: 'Demo day' })).toEqual({ title: 'Demo day', meta: 'Event' });
    expect(sourceRefLabel({ type: ' Team ', title: 'Textile' })).toEqual({ title: 'Textile', meta: 'Team' });
  });
});
