import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import Toaster from '@/components/core/toaster';
import React from 'react';

// Section: Mock react-toastify ToastContainer to inspect props and rendering
jest.mock('react-toastify', () => ({
  ToastContainer: (props: any) => (
    <div data-testid="mock-toast-container" {...props} />
  ),
}));

/**
 * Test suite for Toaster component
 */
describe('Toaster', () => {
  it('renders the ToastContainer with correct props and classes', () => {
    const { getByTestId } = render(<Toaster />);
    const toastContainer = getByTestId('mock-toast-container');
    // Check that the ToastContainer is rendered
    expect(toastContainer).toBeInTheDocument();
    // Check all expected props are passed
    expect(toastContainer).toHaveAttribute('position', 'top-right');
    expect(toastContainer).toHaveAttribute('theme', 'dark');
    expect(toastContainer).toHaveAttribute('bodyclassname', 'toast__body');
    expect(toastContainer).toHaveAttribute('class', 'toast__class');
    expect(toastContainer).toHaveAttribute('toastclassname', 'toast__toaster');
    expect(toastContainer).toHaveAttribute('progressclassname', 'toast_progress');
  });

  it('matches snapshot for regression safety', () => {
    const { asFragment } = render(<Toaster />);
    expect(asFragment()).toMatchSnapshot();
  });

  // Edge case: Rendering with extra props (future extensibility)
  it('renders without crashing if extra props are passed (future-proof)', () => {
    // @ts-expect-error: Testing future extensibility
    expect(() => render(<Toaster foo="bar" />)).not.toThrow();
  });
}); 