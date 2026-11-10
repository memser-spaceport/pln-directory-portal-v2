import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import PlaaLayoutWrapper from '@/components/page/aligement-assets/plaa-layout-wrapper';

let mockPathname = '/alignment-asset/overview';
jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/analytics/alignment-assets.analytics', () => ({
  useAlignmentAssetsAnalytics: () => ({
    onMobileNavMenuClicked: jest.fn(),
    onMobileNavMenuClosed: jest.fn(),
    onNavMenuClicked: jest.fn(),
  }),
}));

jest.mock('@/services/rbac/hooks/usePlaaAccess', () => ({
  usePlaaAccess: () => ({ canView: false, isLoading: false, isError: false }),
}));

beforeAll(() => {
  window.scrollTo = jest.fn();
});

beforeEach(() => {
  mockPathname = '/alignment-asset/overview';
});

const mobileMenu = () => screen.queryByRole('dialog');

test('closes the open mobile menu when the user navigates to another page', () => {
  const { rerender } = render(<PlaaLayoutWrapper>page</PlaaLayoutWrapper>);
  fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
  expect(mobileMenu()).toBeInTheDocument();

  mockPathname = '/alignment-asset/activities';
  rerender(<PlaaLayoutWrapper>page</PlaaLayoutWrapper>);

  expect(mobileMenu()).not.toBeInTheDocument();
});

test('keeps the mobile menu open while the page stays the same', () => {
  const { rerender } = render(<PlaaLayoutWrapper>page</PlaaLayoutWrapper>);
  fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));

  rerender(<PlaaLayoutWrapper>other child</PlaaLayoutWrapper>);

  expect(mobileMenu()).toBeInTheDocument();
});
