import '@testing-library/jest-dom';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fireEvent, render, screen } from '@testing-library/react';

import FeedbackForm from '@/components/page/aligement-assets/feedback/feedback-form';
import RoadmapBoard from '@/components/page/aligement-assets/feedback/roadmap-board';
import { item } from './__fixtures__/feedback.fixtures';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

const STYLES = readFileSync(
  join(process.cwd(), 'components/page/aligement-assets/feedback/feedback-styles.tsx'),
  'utf8',
);

/** WCAG relative luminance / contrast, so the thresholds are measured not guessed. */
function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const v = hex.replace('#', '');
    const full = v.length === 3 ? v.split('').map((c) => c + c).join('') : v;
    const [r, g, bl] = [0, 2, 4]
      .map((i) => parseInt(full.slice(i, i + 2), 16) / 255)
      .map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function declaredValue(variable: string): string {
  const match = STYLES.match(new RegExp(`${variable}:\\s*([^;]+);`));
  return match ? match[1].trim() : '';
}

/** Body of the rule whose selector list contains `selector` (grouped or alone). */
function ruleBody(selector: string): string {
  const escaped = selector.replace(/[.\\]/g, '\\$&');
  const match = STYLES.match(new RegExp(`(?:^|[,{}])\\s*[^{}]*${escaped}\\s*(?:,[^{}]*)?\\{([^}]*)\\}`, 'm'));
  if (!match) throw new Error(`No rule for ${selector}`);
  return match[1];
}

/**
 * The colour a selector actually paints with, following one var() hop.
 * Reading the token alone would pass even if the rule stopped using it.
 */
function resolvedColor(selector: string, property = 'color'): string {
  const raw = ruleBody(selector).match(new RegExp(`(?<![a-z-])${property}:\\s*([^;]+);`));
  if (!raw) throw new Error(`No ${property} in ${selector}`);
  const value = raw[1].trim();
  const variable = value.match(/var\((--[a-z-]+)/);
  return variable ? declaredValue(variable[1]) : value;
}

function minHeightOf(selector: string): number {
  const match = ruleBody(selector).match(/min-height:\s*(\d+)px/);
  return match ? Number(match[1]) : 0;
}

describe('stylesheet is valid CSS', () => {
  it('declares no malformed hex colour', () => {
    // A 5-digit hex is silently dropped by the browser, taking its rule with it.
    const malformed = [...STYLES.matchAll(/#([0-9a-fA-F]+)\b/g)]
      .map((m) => m[1])
      .filter((hex) => ![3, 4, 6, 8].includes(hex.length));
    expect(malformed).toEqual([]);
  });

  it('terminates every declaration with a semicolon', () => {
    const unterminated = STYLES.split('\n')
      .map((line) => line.trim())
      .filter((line) => /^[a-z-]+:\s*[^;{}]+$/.test(line) && !line.endsWith(';') && !line.endsWith(','));
    expect(unterminated).toEqual([]);
  });

  it('gives the primary button a hover colour distinct from its rest state', () => {
    const brand = declaredValue('--fb-brand');
    const hover = declaredValue('--fb-brand-dark');
    expect(hover).toMatch(/^#[0-9a-f]{6}$/i);
    expect(hover).not.toBe(brand);
  });
});

describe('contrast meets WCAG AA', () => {
  // Each case resolves the colour the selector paints with, so swapping the
  // token back out for a literal still fails.
  it.each([
    ['muted badge (Private / Declined / Duplicate)', '.fb-badge--muted', '#f1f5f9'],
    ['slate badge', '.fb-badge--slate', '#f1f5f9'],
    ['amber badge', '.fb-badge--amber', '#fef3c7'],
    ['green badge', '.fb-badge--green', '#dcfce7'],
    ['row age / meta text', '.fb-row__age', '#ffffff'],
    ['empty-state text', '.fb-empty__text', '#ffffff'],
  ])('%s clears 4.5:1 on its own background', (_name, selector, background) => {
    expect(contrast(resolvedColor(selector), background)).toBeGreaterThanOrEqual(4.5);
  });

  it('paints the primary button label against its own fill', () => {
    expect(contrast(resolvedColor('.fb-btn--primary'), declaredValue('--fb-brand'))).toBeGreaterThanOrEqual(4.5);
  });
});

describe('touch targets clear WCAG 2.5.8 (24px)', () => {
  // minHeightOf returns 0 when the declaration is missing, so deleting it fails
  // the assertion rather than skipping it.
  it.each(['.fb-linkbtn', '.fb-files__remove', '.fb-modal__close'])('%s reaches 24px', (selector) => {
    expect(minHeightOf(selector)).toBeGreaterThanOrEqual(24);
  });

  it.each(['.fb-tabs__tab', '.fb-board__tab'])('%s is thumb-sized at 44px', (selector) => {
    expect(minHeightOf(selector)).toBeGreaterThanOrEqual(44);
  });

  it('leaves no interactive rule without a stated minimum height', () => {
    const interactive = ['.fb-linkbtn', '.fb-files__remove', '.fb-tabs__tab', '.fb-board__tab', '.fb-moveto__option'];
    const missing = interactive.filter((selector) => minHeightOf(selector) === 0);
    expect(missing).toEqual([]);
  });
});

describe('tabs are associated with their panels', () => {
  function mockViewport(narrow: boolean) {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query: string) => ({
        matches: narrow,
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })),
    });
  }

  it('points each Roadmap tab at the panel it controls', () => {
    mockViewport(true);
    render(
      <RoadmapBoard
        roadmap={{ under_review: [item()], todo: [], in_progress: [], completed: [] }}
        isAdmin={false}
        onVote={jest.fn()}
        onMove={jest.fn()}
      />,
    );

    const tab = screen.getByRole('tab', { selected: true });
    const panelId = tab.getAttribute('aria-controls');
    expect(panelId).toBeTruthy();

    const panel = document.getElementById(panelId as string);
    expect(panel).toHaveAttribute('role', 'tabpanel');
    expect(panel).toHaveAttribute('aria-labelledby', tab.id);
  });

  it('does not claim tabpanel semantics when all four columns are visible', () => {
    mockViewport(false);
    render(
      <RoadmapBoard
        roadmap={{ under_review: [item()], todo: [], in_progress: [], completed: [] }}
        isAdmin={false}
        onVote={jest.fn()}
        onMove={jest.fn()}
      />,
    );
    expect(screen.queryAllByRole('tabpanel')).toHaveLength(0);
  });
});

describe('modal is a modal', () => {
  it('locks page scroll while open and restores it on close', () => {
    const { unmount } = render(<FeedbackForm onClose={jest.fn()} onSubmit={jest.fn()} isSubmitting={false} />);
    expect(document.body.style.overflow).toBe('hidden');

    unmount();
    expect(document.body.style.overflow).not.toBe('hidden');
  });

  it('returns focus to whatever opened it', () => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();

    const { unmount } = render(<FeedbackForm onClose={jest.fn()} onSubmit={jest.fn()} isSubmitting={false} />);
    expect(opener).not.toHaveFocus();

    unmount();
    expect(opener).toHaveFocus();
    opener.remove();
  });

  it('keeps Tab inside the dialog', () => {
    render(<FeedbackForm onClose={jest.fn()} onSubmit={jest.fn()} isSubmitting={false} />);
    const dialog = screen.getByRole('dialog');
    const focusable = dialog.querySelectorAll<HTMLElement>('button:not([disabled]), input, textarea, a[href]');
    const last = focusable[focusable.length - 1];

    last.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(dialog.contains(document.activeElement)).toBe(true);
  });
});
