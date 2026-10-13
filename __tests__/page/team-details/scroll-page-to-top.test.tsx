import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ScrollPageToTop } from '@/components/page/team-details/TeamApplicants/ScrollPageToTop';

/**
 * One rule, two surfaces: the applicants view AND its `loading.tsx` skeleton,
 * which is what a lead actually sees first and which inherits the scroll
 * position of the page they left. A skeleton is a server component and cannot
 * run an effect, which is why this is a component rather than a line in the
 * view.
 */
describe('ScrollPageToTop', () => {
  const original = (document.body as any).scrollTo;

  afterEach(() => {
    (document.body as any).scrollTo = original;
  });

  /* `document.body`, not `window`. Next scrolls the scrolling element, which in
     this app is not what scrolls — the member page and the home page's own
     "back to top" button both reach for `body` for the same reason. */
  it('scrolls the body to the top on mount', () => {
    const scrollTo = jest.fn();
    (document.body as any).scrollTo = scrollTo;

    render(<ScrollPageToTop />);

    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 0, left: 0 }));
  });

  it('renders nothing', () => {
    const { container } = render(<ScrollPageToTop />);

    expect(container).toBeEmptyDOMElement();
  });

  /* jsdom implements no scroll methods, and neither do some older browsers on
     `Element`. A hard call would take out every test that renders either
     surface — and, worse, the page itself. */
  it('does not throw where the method is missing', () => {
    delete (document.body as any).scrollTo;

    expect(() => render(<ScrollPageToTop />)).not.toThrow();
  });
});
