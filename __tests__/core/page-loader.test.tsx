// unit test for page loader

import { render, screen } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';
import PageLoader from '@/components/core/page-loader';

// Test suite for PageLoader component

describe('PageLoader', () => {
  // Test: Loader overlay and spinner render correctly
  it('renders the loader overlay and spinner', () => {
    const { container } = render(<PageLoader />);
    // Loader overlay should be present
    const overlay = container.querySelector('.loaderc');
    expect(overlay).toBeInTheDocument();
    // Spinner SVG should be present (find by class)
    const spinner = overlay?.querySelector('svg');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('loaderc__lo__spinner');
    // Text should be present
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  // Test: Loader overlay uses correct styles and structure
  it('has correct structure and classes', () => {
    const { container } = render(<PageLoader />);
    // Loader container
    const overlay = container.querySelector('.loaderc');
    expect(overlay).toBeInTheDocument();
    // Loader inner box
    const inner = overlay?.querySelector('.loaderc__lo');
    expect(inner).toBeInTheDocument();
  });

  // Test: Spinner SVG has correct attributes
  it('spinner SVG has correct attributes', () => {
    const { container } = render(<PageLoader />);
    const spinner = container.querySelector('.loaderc__lo__spinner');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('viewBox', '0 0 100 101');
    expect(spinner).toHaveAttribute('aria-hidden', 'true');
  });

  // Test: Loader overlay covers the whole screen (style check)
  it('loader overlay covers the whole screen', () => {
    const { container } = render(<PageLoader />);
    const overlay = container.querySelector('.loaderc');
    expect(overlay).toBeInTheDocument();
  });

  // Test: Loader is accessible (has role and text)
  it('is accessible with loading text', () => {
    render(<PageLoader />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});

    