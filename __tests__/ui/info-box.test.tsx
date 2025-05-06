import { render, screen } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';
import InfoBox from '@/components/ui/info-box';

/**
 * Test suite for the InfoBox component.
 * Covers all props, branches, and edge cases for 100% coverage.
 */
describe('InfoBox', () => {
  // Test: Renders main info text only
  it('renders only the main info text when no imgUrl or moreInfo is provided', () => {
    render(<InfoBox info="Main info" />);
    // Main info should be present
    expect(screen.getByText('Main info')).toBeInTheDocument();
    // No image should be rendered
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    // No moreInfo should be rendered
    expect(screen.queryByText(/more info/i)).not.toBeInTheDocument();
  });

  // Test: Renders with image
  it('renders the image when imgUrl is provided', () => {
    render(<InfoBox info="Main info" imgUrl="/test.png" />);
    // Image should be present
    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/test.png');
    expect(img).toHaveClass('infobox__img');
  });

  // Test: Renders with moreInfo
  it('renders the moreInfo text when moreInfo is provided', () => {
    render(<InfoBox info="Main info" moreInfo="Additional info" />);
    // moreInfo should be present
    expect(screen.getByText('Additional info')).toBeInTheDocument();
    // Should have correct class
    const moreInfo = screen.getByText('Additional info');
    expect(moreInfo).toHaveClass('infobox__moreinfo');
  });

  // Test: Renders with both image and moreInfo
  it('renders both image and moreInfo when both are provided', () => {
    render(<InfoBox info="Main info" imgUrl="/test.png" moreInfo="Extra info" />);
    // Image should be present
    expect(screen.getByRole('img')).toBeInTheDocument();
    // moreInfo should be present
    expect(screen.getByText('Extra info')).toBeInTheDocument();
  });

  // Test: Structure and classes
  it('has correct structure and classes', () => {
    const { container } = render(<InfoBox info="Main info" imgUrl="/test.png" moreInfo="Extra info" />);
    // Outer container
    const infobox = container.querySelector('.infobox');
    expect(infobox).toBeInTheDocument();
    // Main info
    const mainInfo = container.querySelector('.infobox__info');
    expect(mainInfo).toBeInTheDocument();
    // More info
    const moreInfo = container.querySelector('.infobox__moreinfo');
    expect(moreInfo).toBeInTheDocument();
  });

  // Test: Accessibility - info is always present
  it('is accessible: always renders the main info text', () => {
    render(<InfoBox info="Accessible info" />);
    expect(screen.getByText('Accessible info')).toBeInTheDocument();
  });

  // Edge case: Empty string for info
  it('renders nothing for empty info string', () => {
    render(<InfoBox info="" />);
    // Should render an empty <p> for main info
    const mainInfo = screen.getByText('', { selector: '.infobox__info' });
    expect(mainInfo).toBeInTheDocument();
  });

  // Edge case: imgUrl is empty string
  it('does not render image if imgUrl is empty string', () => {
    render(<InfoBox info="Main info" imgUrl="" />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
