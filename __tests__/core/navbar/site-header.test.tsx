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

jest.mock('@/components/core/navbar/components/PlaaBanner', () => ({
  PlaaBanner: () => <div data-testid="plaa-banner" />,
}));

jest.mock('@/components/core/navbar/components/CompleteYourProfile', () => ({
  CompleteYourProfile: () => <div data-testid="complete-your-profile" />,
}));

const props = { userInfo: {} as never, isLoggedIn: false, authToken: '' };

describe('SiteHeader', () => {
  it('renders the site chrome on a normal route', () => {
    mockUsePathname.mockReturnValue('/members');
    render(<SiteHeader {...props} />);

    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    // PlaaBanner is intentionally disabled on this release branch (#2667).
    expect(screen.queryByTestId('plaa-banner')).not.toBeInTheDocument();
    expect(screen.getByTestId('complete-your-profile')).toBeInTheDocument();
  });

  it('renders nothing on the bare AI App PRD viewer route', () => {
    mockUsePathname.mockReturnValue('/pl-infra/ai-apps/app-1/prd');
    const { container } = render(<SiteHeader {...props} />);

    expect(container).toBeEmptyDOMElement();
  });
});
