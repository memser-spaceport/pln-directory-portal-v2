import { groupSourceItems, sourceItems } from '@/components/utils/sourceItems';

describe('AI Search source groups', () => {
  it('puts directory pages under "Directory" and web pages under "Web", directory first', () => {
    const items = sourceItems(undefined, [
      { index: 1, title: 'From the web', type: 'web', externalUrl: 'https://saturn.example/about' },
      { index: 2, title: 'Saturn Grid', type: 'team', directoryLink: '/teams/saturn' },
      { index: 3, title: 'https://cited.example', type: 'external', externalUrl: 'https://cited.example' },
    ]);

    expect(groupSourceItems(items).map((group) => [group.label, group.items.map((item) => item.title)])).toEqual([
      ['Directory', ['Saturn Grid']],
      ['Web', ['From the web', 'https://cited.example']],
    ]);
  });

  it('keeps a source with a directory page in "Directory" even when it also has an outside URL', () => {
    const items = sourceItems(undefined, [
      {
        index: 1,
        title: 'Acme raises',
        type: 'news',
        directoryLink: '/home?news=1',
        externalUrl: 'https://news.example/acme',
      },
    ]);

    expect(items[0].kind).toBe('directory');
    expect(groupSourceItems(items).map((group) => group.label)).toEqual(['Directory']);
  });

  it('shows only the group that has sources', () => {
    const items = sourceItems(undefined, [
      { index: 1, title: 'Web page', type: 'web', externalUrl: 'https://only-web.example' },
    ]);

    expect(groupSourceItems(items).map((group) => group.label)).toEqual(['Web']);
    expect(groupSourceItems([])).toEqual([]);
  });

  it('sorts plain source URLs by where they point when the answer has no source refs', () => {
    const items = sourceItems(['/teams/saturn', 'https://news.example/acme'], undefined);

    expect(items.map((item) => item.kind)).toEqual(['directory', 'web']);
  });
});
