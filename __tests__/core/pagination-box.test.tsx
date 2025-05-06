import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PaginationBox } from '../../components/core/pagination-box';
import { ITeamsSearchParams } from '@/types/teams.types';
import { triggerLoader } from '@/utils/common.utils';
import '@testing-library/jest-dom';

const onPaginationOptionClicked = jest.fn();
jest.mock('@/analytics/common.analytics', () => ({
  useCommonAnalytics: jest.fn(() => ({
    onPaginationOptionClicked,
  })),
}));

jest.mock('@/utils/common.utils', () => ({
  triggerLoader: jest.fn(),
  getAnalyticsUserInfo: jest.fn(() => ({})),
}));

jest.mock('next/navigation', () => ({
  usePathname: () => '/test-path',
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    forward: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

const mockSearchParams: ITeamsSearchParams = {
  searchBy: '',
  sort: '',
  tags: '',
  membershipSources: '',
  fundingStage: '',
  technology: '',
  includeFriends: '',
  viewType: '',
  page: '',
  officeHoursOnly: '',
  focusAreas: '',
  isRecent: '',
  isHost: '',
  asks: '',
};

const defaultProps = {
  totalItems: 100,
  showingItems: 10,
  currentPage: 1,
  totalPages: 10,
  searchParams: mockSearchParams,
  from: 'test',
  userInfo: null,
};

describe('PaginationBox', () => {
  it('renders with minimal props', () => {
    render(<PaginationBox {...defaultProps} />);
    expect(screen.getByText(/Showing 10 items per page of 100/)).toBeInTheDocument();
    expect(screen.getByText(/Page 1 of 10/)).toBeInTheDocument();
  });

  it('renders all navigation buttons', () => {
    render(<PaginationBox {...defaultProps} />);
    expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(5);
  });

  it('disables first/prev on first page', () => {
    render(<PaginationBox {...defaultProps} currentPage={1} />);
    const firstBtn = screen.getByRole('button', { name: /first/i });
    const prevBtn = screen.getByRole('button', { name: /prev/i });
    expect(firstBtn).toHaveStyle('pointer-events: none');
    expect(prevBtn).toHaveStyle('pointer-events: none');
  });

  it('disables next/last on last page', () => {
    render(<PaginationBox {...defaultProps} currentPage={10} />);
    const nextBtn = screen.getByRole('button', { name: /next/i });
    const lastBtn = screen.getByRole('button', { name: /last/i });
    expect(nextBtn).toHaveStyle('pointer-events: none');
    expect(lastBtn).toHaveStyle('pointer-events: none');
  });

//   it('opens and closes page dropdown', async () => {
//     render(<PaginationBox {...defaultProps} />);
//     const pageBtn = screen.getByText('1');
//     fireEvent.click(pageBtn);
//     expect(screen.getByText('2')).toBeInTheDocument();
//     fireEvent.mouseDown(document.body);
//     await waitFor(() => {
//       expect(screen.queryByText('2')).not.toBeInTheDocument();
//     });
//   });

  it('shows correct number of pages in dropdown', () => {
    render(<PaginationBox {...defaultProps} />);
    fireEvent.click(screen.getByAltText(/dropdown/i));

    for (let i = 2; i <= 10; i++) {
      expect(screen.getByText(i.toString())).toBeInTheDocument();
    }
  });

//   it('triggers analytics and loader on navigation', () => {
//     render(<PaginationBox {...defaultProps} />);
//     fireEvent.click(screen.getByRole('button', { name: /next/i }));
//     expect(onPaginationOptionClicked).toHaveBeenCalled();
//     expect(triggerLoader).toHaveBeenCalled();
//   });

  it('does not trigger loader/analytics if clicking current page', () => {
    const { onPaginationOptionClicked } = require('@/analytics/common.analytics').useCommonAnalytics();
    const { triggerLoader } = require('@/utils/common.utils');
    render(<PaginationBox {...defaultProps} />);
    fireEvent.click(screen.getByText('1'));
    expect(onPaginationOptionClicked).not.toHaveBeenCalledWith('', 1, expect.anything(), expect.anything());
    expect(triggerLoader).not.toHaveBeenCalledWith(true);
  });

  it('removes outside click listener on unmount', () => {
    const { unmount } = render(<PaginationBox {...defaultProps} />);
    const removeSpy = jest.spyOn(document, 'removeEventListener');
    unmount();
    expect(removeSpy).toHaveBeenCalled();
  });
});
