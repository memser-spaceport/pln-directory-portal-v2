// __tests__/FocusAreaHeader.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { IUserInfo } from '@/types/shared.types';
import '@testing-library/jest-dom';
import FocusAreaHeader from '@/components/page/home/focus-area/focus-area-header';

const mockAnalytics = {
  onFocusAreaProtocolLabsVisionUrlClicked: jest.fn(),
};

jest.mock('@/analytics/home.analytics', () => ({
  useHomeAnalytics: () => mockAnalytics,
}));

describe('FocusAreaHeader', () => {
  const mockOnPrevButtonClick = jest.fn();
  const mockOnNextButtonClick = jest.fn();
  const userInfo: IUserInfo = { uid: "1", name: 'Test User' };

  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should render the component with the correct title and description', () => {
    render(
      <FocusAreaHeader
        onPrevButtonClick={mockOnPrevButtonClick}
        onNextButtonClick={mockOnNextButtonClick}
        prevBtnDisabled={false}
        nextBtnDisabled={false}
        userInfo={userInfo}
      />
    );

    expect(screen.getByText('Focus Areas')).toBeInTheDocument();
    expect(screen.getByText(/Protocol Labs’ vision/)).toBeInTheDocument();
  });

  it('should call onPrevButtonClick when the previous button is clicked', () => {
    render(
      <FocusAreaHeader
        onPrevButtonClick={mockOnPrevButtonClick}
        onNextButtonClick={mockOnNextButtonClick}
        prevBtnDisabled={false}
        nextBtnDisabled={false}
        userInfo={userInfo}
      />
    );

    const prevButton = screen.getByRole('button', { name: /left arrow/i });
    fireEvent.click(prevButton);
    expect(mockOnPrevButtonClick).toHaveBeenCalledTimes(1);
  });

  it('should call onNextButtonClick when the next button is clicked', () => {
    render(
      <FocusAreaHeader
        onPrevButtonClick={mockOnPrevButtonClick}
        onNextButtonClick={mockOnNextButtonClick}
        prevBtnDisabled={false}
        nextBtnDisabled={false}
        userInfo={userInfo}
      />
    );

    const nextButton = screen.getByRole('button', { name: /right arrow/i });
    fireEvent.click(nextButton);
    expect(mockOnNextButtonClick).toHaveBeenCalledTimes(1);
  });

  it('should disable the previous button when prevBtnDisabled is true', () => {
    render(
      <FocusAreaHeader
        onPrevButtonClick={mockOnPrevButtonClick}
        onNextButtonClick={mockOnNextButtonClick}
        prevBtnDisabled={true}
        nextBtnDisabled={false}
        userInfo={userInfo}
      />
    );

    const prevButton = screen.getByRole('button', { name: /left arrow/i });
    expect(prevButton).toHaveClass('disabled');
  });

  it('should disable the next button when nextBtnDisabled is true', () => {
    render(
      <FocusAreaHeader
        onPrevButtonClick={mockOnPrevButtonClick}
        onNextButtonClick={mockOnNextButtonClick}
        prevBtnDisabled={false}
        nextBtnDisabled={true}
        userInfo={userInfo}
      />
    );

    const nextButton = screen.getByRole('button', { name: /right arrow/i });
    expect(nextButton).toHaveClass('disabled');
  });

it('should call analytics when the Protocol Labs vision link is clicked', () => {
  render(
    <FocusAreaHeader
      onPrevButtonClick={mockOnPrevButtonClick}
      onNextButtonClick={mockOnNextButtonClick}
      prevBtnDisabled={false}
      nextBtnDisabled={false}
      userInfo={userInfo}
    />
  );

  const link = screen.getByText(/Protocol Labs’ vision/);
  fireEvent.click(link);
  expect(mockAnalytics.onFocusAreaProtocolLabsVisionUrlClicked).toHaveBeenCalledTimes(1);
});
});