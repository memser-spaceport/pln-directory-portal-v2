import { render } from '@testing-library/react';
import Cookies from 'js-cookie';

import { getIsLoggedInServerSnapshot, useIsLoggedIn } from '@/hooks/useIsLoggedIn';

function renderProbe() {
  const seen: boolean[] = [];

  function Probe() {
    seen.push(useIsLoggedIn());
    return null;
  }

  render(<Probe />);
  return seen;
}

describe('useIsLoggedIn', () => {
  afterEach(() => {
    Cookies.remove('authToken');
  });

  it('reports signed out from the server snapshot even when an auth cookie exists', () => {
    Cookies.set('authToken', '"a-token"');

    // The server renders with no cookies, so it always produces the signed-out
    // tree. The hydrating render has to agree or React fails hydration (#418)
    // and throws away the server HTML for that subtree.
    expect(getIsLoggedInServerSnapshot()).toBe(false);
  });

  it('reports signed in on the client when an auth cookie exists', () => {
    Cookies.set('authToken', '"a-token"');

    const seen = renderProbe();

    expect(seen[seen.length - 1]).toBe(true);
  });

  it('stays signed out when there is no auth cookie', () => {
    expect(renderProbe().every((value) => value === false)).toBe(true);
  });
});
