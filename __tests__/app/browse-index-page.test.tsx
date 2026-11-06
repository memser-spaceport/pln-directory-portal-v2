/**
 * @jest-environment node
 */
/**
 * LAB-3093: a browse page links every profile on it and every other page, has a self-canonical, and answers 404 for
 * a page that does not exist.
 */
const mockNotFound = jest.fn(() => {
  throw new Error('NEXT_NOT_FOUND');
});
jest.mock('next/navigation', () => ({ notFound: () => mockNotFound() }));
const mockLoad = jest.fn();
jest.mock('@/services/browse/browseIndex', () => ({
  ...jest.requireActual('@/services/browse/browseIndex'),
  loadBrowseEntries: (...args: unknown[]) => mockLoad(...args),
}));

import { renderToStaticMarkup } from 'react-dom/server';
import type { ReactElement } from 'react';
import { readFileSync } from 'fs';
import { join } from 'path';
import { BrowseAllLink, BrowseIndexPage, browseMetadata } from '@/components/page/browse/BrowseIndexPage';
import { BROWSE_PAGE_SIZE } from '@/services/browse/browseIndex';

const entries = Array.from({ length: BROWSE_PAGE_SIZE * 2 + 5 }, (_, i) => ({
  uid: `uid${i}`,
  name: `Team ${String(i).padStart(3, '0')}`,
}));
const original = process.env.APPLICATION_BASE_URL;

beforeEach(() => {
  process.env.APPLICATION_BASE_URL = 'https://os.pl.xyz';
  mockLoad.mockReset();
  mockLoad.mockResolvedValue(entries);
  mockNotFound.mockClear();
});
afterAll(() => {
  process.env.APPLICATION_BASE_URL = original;
});

const html = async (page?: string) =>
  renderToStaticMarkup((await BrowseIndexPage({ kind: 'teams', searchParams: page ? { page } : {} })) as ReactElement);

describe('browse index page', () => {
  it('links every profile on the page and every other page, with one h1', async () => {
    const out = await html('2');

    expect(out.match(/href="\/teams\/uid\d+"/g)).toHaveLength(BROWSE_PAGE_SIZE);
    expect(out).toContain(`href="/teams/uid${BROWSE_PAGE_SIZE}"`);
    expect(out).toContain('href="/teams/browse"');
    expect(out).toContain('href="/teams/browse?page=3"');
    expect(out).toContain('aria-current="page"');
    expect(out.match(/<h1/g)).toHaveLength(1);
  });

  it('gives each page a self-canonical, page 1 without ?page=', async () => {
    await expect(browseMetadata('teams', {})).resolves.toMatchObject({
      alternates: { canonical: 'https://os.pl.xyz/teams/browse' },
    });
    await expect(browseMetadata('teams', { page: '3' })).resolves.toMatchObject({
      title: 'All teams A–Z, page 3 | Protocol Labs Directory',
      alternates: { canonical: 'https://os.pl.xyz/teams/browse?page=3' },
    });
  });

  it('answers 404 for a page past the last or not a number', async () => {
    await expect(browseMetadata('teams', { page: '4' })).rejects.toThrow('NEXT_NOT_FOUND');
    await expect(html('abc')).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('is noindex when the API fails, and shows the error page', async () => {
    mockLoad.mockResolvedValue(null);
    await expect(browseMetadata('teams', {})).resolves.toMatchObject({ robots: { index: false, follow: true } });
    expect(mockNotFound).not.toHaveBeenCalled();
  });
});

describe('browse-all link on a listing (LAB-3184)', () => {
  it('is a plain link in the server HTML, out of the Tab order', () => {
    const markup = renderToStaticMarkup(<BrowseAllLink kind="teams" />);
    expect(markup).toContain('href="/teams/browse"');
    expect(markup).toContain('tabindex="-1"');
    expect(markup).toContain('class="browseAll"');
  });

  it('is visually hidden, not display:none, so crawlers still get the link', () => {
    const scss = readFileSync(join(process.cwd(), 'components/page/browse/BrowseIndexPage.module.scss'), 'utf8');
    const rule = scss.slice(scss.indexOf('.browseAll {'));
    const body = rule.slice(0, rule.indexOf('\n}'));
    expect(body).toMatch(/position: absolute/);
    expect(body).toMatch(/clip-path: inset\(50%\)/);
    expect(body).not.toMatch(/^\s*(display:\s*none|visibility:\s*hidden)\s*;/m);
  });
});
