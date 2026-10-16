export type Placement = 'navbar' | 'floating';

/** The page this prototype stands on; production would read it from the route. */
export const HOME_PAGE = { name: 'Home', path: '/home' };

export const PLACEMENTS: { value: Placement; label: string; note: string }[] = [
  {
    value: 'navbar',
    label: 'In the navbar',
    note: 'A labelled button before the (?), in the header on every page. Below 1440px it is a glyph box like the (?), with the label as a tooltip.',
  },
  {
    value: 'floating',
    label: 'Floating',
    note: "AI Apps' own floating pill, bottom-right: it says its name, then settles to a glyph. Above the bottom nav on phones.",
  },
];
