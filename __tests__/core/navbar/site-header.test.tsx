import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { SiteHeader } from '@/components/core/navbar/components/SiteHeader';

const mockUsePathname = jest.fn();
jest.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

jest.mock('@/components/core/navbar/nav-bar', () => ({
  __esModule: true,
  default: () => <div data-testid="navbar" />,
}));

jest.mock('@/components/core/navbar/components/CompleteYourProfile', () => ({
  CompleteYourProfile: () => <div data-testid="complete-your-profile" />,
}));

const props = { userInfo: {} as never, isLoggedIn: false, authToken: '' };

let observedTag: string | null = null;
beforeEach(() => {
  observedTag = null;
  document.documentElement.style.removeProperty('--app-header-height');
  class FakeResizeObserver {
    observe(el: Element) {
      observedTag = el.tagName;
    }
    disconnect() {}
    unobserve() {}
  }
  (global as { ResizeObserver?: unknown }).ResizeObserver = FakeResizeObserver;
});

describe('SiteHeader', () => {
  it('renders the site chrome on a normal route', () => {
    mockUsePathname.mockReturnValue('/members');
    render(<SiteHeader {...props} />);

    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    expect(screen.getByTestId('complete-your-profile')).toBeInTheDocument();
  });

  /* The bars stack *inside* this element, so its height is the chrome height
     the rest of the app offsets from. Measuring the wrong node — or forgetting
     to measure at all — is invisible in jsdom, so it is pinned here rather than
     left to the hook's own tests. */
  it('measures the header element the bars are stacked in', () => {
    mockUsePathname.mockReturnValue('/members');
    render(<SiteHeader {...props} />);

    expect(observedTag).toBe('HEADER');
    expect(document.documentElement.style.getPropertyValue('--app-header-height')).not.toBe('');
  });

  it('publishes no measurement on a bare route, leaving the stylesheet default', () => {
    mockUsePathname.mockReturnValue('/pl-infra/ai-apps/app-1/prd');
    render(<SiteHeader {...props} />);

    expect(observedTag).toBeNull();
    expect(document.documentElement.style.getPropertyValue('--app-header-height')).toBe('');
  });

  it('renders nothing on the bare AI App PRD viewer route', () => {
    mockUsePathname.mockReturnValue('/pl-infra/ai-apps/app-1/prd');
    const { container } = render(<SiteHeader {...props} />);

    expect(container).toBeEmptyDOMElement();
  });
});
