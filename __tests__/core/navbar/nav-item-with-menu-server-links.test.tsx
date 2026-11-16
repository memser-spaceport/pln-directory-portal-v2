/**
 * @jest-environment node
 */
/**
 * LAB-3253: a nav dropdown's links are in the server HTML. Base UI mounts the menu's content only while it is open, so
 * the server HTML of every page had no link to /teams, /members or /projects: a crawler found the listings from /home
 * alone.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { NavigationMenu } from '@base-ui-components/react';

import { NavItemWithMenu } from '@/components/core/navbar/components/NavItemWithMenu';
import { DIRECTORY_LINKS } from '@/components/core/navbar/constants/navLinks';

function serverHtml(items: Parameters<typeof NavItemWithMenu>[0]['items']) {
  return renderToStaticMarkup(
    <NavigationMenu.Root>
      <NavigationMenu.List>
        <NavItemWithMenu icon={null} label="Directory" items={items} onNavItemClickHandler={() => {}} />
      </NavigationMenu.List>
    </NavigationMenu.Root>,
  );
}

/** The crawler list's markup: the `<ul>` that carries the test id, up to its end. */
function crawlerList(html: string) {
  return html.match(/<ul[^>]*data-testid="nav-menu-links"[^>]*>.*?<\/ul>/)?.[0] ?? '';
}

describe('nav dropdown in the server HTML', () => {
  it('links every Directory page, in a list that is not on screen', () => {
    const list = crawlerList(serverHtml(DIRECTORY_LINKS));

    expect(list).toMatch(/^<ul[^>]*\shidden=""/);
    expect([...list.matchAll(/<a href="([^"]+)">([^<]+)<\/a>/g)].map((m) => [m[1], m[2]])).toEqual([
      ['/members', 'Members'],
      ['/teams', 'Teams'],
      ['/projects', 'Projects'],
    ]);
  });

  it('leaves out links to other sites', () => {
    const list = crawlerList(
      serverHtml([
        { href: '/events/all', title: 'All Events' },
        { href: 'https://ats.os.pl.xyz', title: 'PL ATS', external: true },
      ]),
    );

    expect(list).toContain('href="/events/all"');
    expect(list).not.toContain('ats.os.pl.xyz');
  });
});
