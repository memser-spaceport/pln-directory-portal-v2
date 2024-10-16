import { fireEvent, render, screen } from '@testing-library/react';
import DiscoverHuskyCard from '@/components/page/home/discover/discover-husky-card';
import '@testing-library/jest-dom';

describe('DiscoverHuskyCard Component', () => {

  test('should render the DiscoverHuskyCard component', () => {
    render(<DiscoverHuskyCard userInfo={{ name: 'Test User' }} />);
    expect(screen.getByText(/discover moreusing husky/i)).toBeInTheDocument();
  });

  test('should call listener on click', () => {
    render(<DiscoverHuskyCard userInfo={{ name: 'Test User' }} />);

    const dispatchEventSpy = jest.spyOn(document, 'dispatchEvent').mockImplementation(() => true);

    // Find the clickable area
    const card = screen.getByTestId('discover-husky-card');

    // Click the card
    fireEvent.click(card);

    // Check if the custom event is dispatched
    const customEvent = new CustomEvent('open-husky-dialog');
    expect(dispatchEventSpy).toHaveBeenCalledWith(customEvent);
  });
});
