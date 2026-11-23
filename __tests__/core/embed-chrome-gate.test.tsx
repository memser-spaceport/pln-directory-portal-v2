import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { EmbedChromeGate, isEmbedPath } from '@/components/core/EmbedChromeGate';

let pathname = '/';
jest.mock('next/navigation', () => ({ usePathname: () => pathname }));

/** LAB-3352: the site's chrome stays out of the events embed, and only there. */
describe('EmbedChromeGate', () => {
  it.each(['/events/embed', '/events/embed/'])('renders nothing on %s', (path) => {
    pathname = path;
    render(
      <EmbedChromeGate>
        <header>Site header</header>
      </EmbedChromeGate>,
    );
    expect(screen.queryByText('Site header')).toBeNull();
  });

  it.each(['/', '/events', '/events/all', '/events/embedded', '/x/events/embed'])(
    'renders its children on %s',
    (path) => {
      pathname = path;
      render(
        <EmbedChromeGate>
          <header>Site header</header>
        </EmbedChromeGate>,
      );
      expect(screen.getByText('Site header')).toBeInTheDocument();
    },
  );

  it('treats an unknown path as a normal page', () => {
    expect(isEmbedPath(null)).toBe(false);
  });
});
