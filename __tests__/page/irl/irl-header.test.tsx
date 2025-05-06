import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import IrlHeader from '@/components/page/irl/irl-header';

describe('IrlHeader', () => {

  it('renders the header with correct text content', () => {
    render(<IrlHeader />);
    
    // Check main heading
    expect(screen.getByText('IRL Gatherings')).toBeInTheDocument();
    
    // Check subheading
    expect(screen.getByText(/Choose a destination to view upcoming gatherings/i)).toBeInTheDocument();
  });

  it('renders the back button with correct link', () => {
    render(<IrlHeader />);
    
    const backButton = screen.getByRole('link', { name: /back to events/i });
    expect(backButton).toBeInTheDocument();
    expect(backButton).toHaveAttribute('href', '/events');
  });

  it('renders the back arrow image', () => {
    render(<IrlHeader />);
    
    const backArrow = screen.getByAltText('Back To Events');
    expect(backArrow).toBeInTheDocument();
    expect(backArrow).toHaveAttribute('src', '/icons/rounded-left-arrow.svg');
  });

  it('has the correct styling classes', () => {
    const { container } = render(<IrlHeader />);
    
    expect(container.querySelector('.irlheaderCnt')).toBeInTheDocument();
    expect(container.querySelector('.irlHeaderCntr')).toBeInTheDocument();
    expect(container.querySelector('.irlHeaderCntrLeft')).toBeInTheDocument();
    expect(container.querySelector('.irlHeader')).toBeInTheDocument();
    expect(container.querySelector('.irlsubHeader')).toBeInTheDocument();
  });
});
