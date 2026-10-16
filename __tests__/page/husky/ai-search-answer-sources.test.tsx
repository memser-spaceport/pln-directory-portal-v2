import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';

const trackHuskySourceLinkClicked = jest.fn();
jest.mock('@/analytics/husky.analytics', () => ({
  useHuskyAnalytics: () => ({ trackHuskySourceLinkClicked }),
}));

import { AnswerSources } from '@/components/page/husky/Chat/components/Messages/components/PreviewMessage/components/AnswerSources';

const ref = (index: number, title: string, link: { directoryLink?: string; externalUrl?: string }) => ({
  index,
  title,
  type: 'team',
  ...link,
});

async function openPopup(pillName: RegExp | string) {
  fireEvent.click(screen.getByRole('button', { name: pillName }));
  return await screen.findByRole('dialog');
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AI Search answer sources', () => {
  it('renders nothing when the answer has no sources', () => {
    const { container } = render(<AnswerSources sources={[]} sourceRefs={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('skips a source ref with neither a directory nor an external link', () => {
    const { container } = render(<AnswerSources sourceRefs={[ref(1, 'Nowhere', {})]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('counts the sources in the pill and stacks the first letters of the first three', () => {
    render(
      <AnswerSources
        sources={[
          'https://alpha.example/1',
          'https://beta.example/2',
          'https://gamma.example/3',
          'https://delta.example/4',
        ]}
      />,
    );

    const pill = screen.getByRole('button', { name: '4 sources' });
    const marks = pill.querySelector('[aria-hidden="true"]') as HTMLElement;
    expect(marks.children).toHaveLength(3);
    expect(marks).toHaveTextContent('hhh');
  });

  it('lists every source in a "Sources" popup, titled and opening in a new tab', async () => {
    render(
      <AnswerSources
        sourceRefs={[
          ref(1, 'Saturn Grid', { directoryLink: '/teams/saturn', externalUrl: 'https://saturn.example' }),
          ref(2, 'Acme blog', { externalUrl: 'https://www.acme.example/post' }),
        ]}
      />,
    );

    const popup = await openPopup('2 sources');

    expect(within(popup).getByRole('heading', { name: 'Sources' })).toBeInTheDocument();
    const rows = within(popup).getAllByRole('link');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveAttribute('href', '/teams/saturn');
    expect(rows[0]).toHaveAttribute('target', '_blank');
    expect(rows[0]).toHaveAttribute('rel', 'noreferrer');
    expect(rows[0]).toHaveTextContent('Saturn Grid');
    expect(rows[1]).toHaveAttribute('href', 'https://www.acme.example/post');
    expect(rows[1]).toHaveTextContent('Acme blog');
  });

  it('prefers the source refs over the raw source URLs', () => {
    render(
      <AnswerSources
        sources={['https://a.example', 'https://b.example']}
        sourceRefs={[ref(1, 'Saturn Grid', { directoryLink: '/teams/saturn' })]}
      />,
    );

    expect(screen.getByRole('button', { name: '1 source' })).toBeInTheDocument();
  });

  it('labels a directory source with its kind and an outside page with its site', async () => {
    const links = [
      ['Ada', '/members/ada', 'Member'],
      ['Saturn Grid', '/teams/saturn', 'Team'],
      ['IPFS', '/projects/ipfs', 'Project'],
      ['Demo day', '/events/demo', 'Event'],
      ['Lab Week', '/irl/lab-week', 'Event'],
      ['Storage thread', '/forum/topics/1', 'Forum post'],
      ['Acme raises', '/home?news=news-1', 'News'],
      ['Openings', '/jobs/1', 'Directory'],
      ['Acme blog', 'https://www.acme.example/post', 'acme.example'],
      ['Docs', 'https://docs.saturn.example/intro', 'docs.saturn.example'],
    ];
    render(
      <AnswerSources
        sourceRefs={links.map(([title, href], index) =>
          ref(index + 1, title, href.startsWith('/') ? { directoryLink: href } : { externalUrl: href }),
        )}
      />,
    );

    const popup = await openPopup('10 sources');
    const rows = within(popup).getAllByRole('link');

    links.forEach(([title, , origin], index) => {
      expect(rows[index]).toHaveTextContent(`${title}${origin}`);
    });
  });

  it('records which source was opened', async () => {
    render(<AnswerSources sourceRefs={[ref(1, 'Saturn Grid', { directoryLink: '/teams/saturn' })]} />);

    const popup = await openPopup('1 source');
    fireEvent.click(within(popup).getByRole('link', { name: /Saturn Grid/ }));

    expect(trackHuskySourceLinkClicked).toHaveBeenCalledWith('/teams/saturn');
  });
});
