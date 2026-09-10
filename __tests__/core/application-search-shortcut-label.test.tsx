import '@testing-library/jest-dom';
import React from 'react';

/* `react-dom/server`'s browser build schedules through `MessageChannel`, which
   jsdom does not implement. The shim only has to exist for the module to load;
   `renderToString` is synchronous and never actually posts a message. */
if (typeof (globalThis as { MessageChannel?: unknown }).MessageChannel === 'undefined') {
  (globalThis as { MessageChannel?: unknown }).MessageChannel = class {
    port1 = { onmessage: null, close() {} };
    port2 = { postMessage() {} };
  };
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { renderToString } = require('react-dom/server');
import { render, screen } from '@testing-library/react';

import {
  getServerShortcutLabel,
  getShortcutLabel,
  subscribeToNothing,
} from '@/components/core/application-search/shortcutLabel';

/**
 * Regression: the navbar search button warned
 * "A tree hydrated but some attributes of the server rendered HTML didn't
 * match" — `title="Search (⌘K)"` on the client against `title="Search (Ctrl+K)"`
 * from the server.
 *
 * A lazy `useState` initializer looked like it snapshotted the platform once,
 * but it runs during SSR too, where `navigator` is undefined. So the server
 * always said Ctrl+K and a Mac client always said ⌘K — mismatching on exactly
 * the machines the ⌘ is for, and React does not patch attributes up, so those
 * users kept the wrong label anyway.
 *
 * The three functions are the ones `ApplicationSearch` actually calls; they
 * live in their own leaf module so this can bind to them without dragging in
 * that component's graph (Privy, PostHog, the search dialog). The host below is
 * a stand-in for the button, but the logic under test is the shipped logic.
 */
const ShortcutLabel = () => {
  const label = React.useSyncExternalStore(subscribeToNothing, getShortcutLabel, getServerShortcutLabel);
  return <button title={`Search (${label})`}>Search</button>;
};

const withUserAgent = (userAgent: string, run: () => void) => {
  const original = Object.getOwnPropertyDescriptor(window.navigator, 'userAgent');
  Object.defineProperty(window.navigator, 'userAgent', { value: userAgent, configurable: true });
  try {
    run();
  } finally {
    if (original) Object.defineProperty(window.navigator, 'userAgent', original);
  }
};

const MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
const WINDOWS = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

describe('search shortcut label', () => {
  it('renders the neutral label on the server', () => {
    expect(renderToString(<ShortcutLabel />)).toContain('Search (Ctrl+K)');
  });

  // The mismatch was between the SERVER render and the FIRST client render.
  // `useSyncExternalStore` is what makes those two agree; React then re-renders
  // with the client value, which is a normal update rather than a hydration
  // error.
  it('agrees with the server on a Mac, where the mismatch used to happen', () => {
    withUserAgent(MAC, () => {
      expect(renderToString(<ShortcutLabel />)).toContain('Search (Ctrl+K)');
    });
  });

  it('shows the Mac shortcut once the client has taken over', () => {
    withUserAgent(MAC, () => {
      render(<ShortcutLabel />);
      expect(screen.getByRole('button')).toHaveAttribute('title', 'Search (⌘K)');
    });
  });

  // Naming it ⌘K everywhere would be wrong for most people.
  it('shows the Ctrl shortcut off a Mac', () => {
    withUserAgent(WINDOWS, () => {
      render(<ShortcutLabel />);
      expect(screen.getByRole('button')).toHaveAttribute('title', 'Search (Ctrl+K)');
    });
  });
});
