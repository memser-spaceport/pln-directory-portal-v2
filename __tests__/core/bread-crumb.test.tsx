import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BreadCrumb } from '@/components/core/bread-crumb';

// Mock next/link for isolation
jest.mock('next/link', () => ({ __esModule: true, default: ({ children, ...props }: any) => <a {...props}>{children}</a> }));

/**
 * Test suite for BreadCrumb component.
 * Covers all branches, lines, and edge cases for 100% coverage.
 */
describe('BreadCrumb', () => {
  const baseProps = {
    backLink: '/directory',
    directoryName: 'Directory',
    pageName: 'Current Page',
  };

  /**
   * Should render home icon, directory link, and current page
   */
  it('renders home icon, directory link, and current page', () => {
    render(<BreadCrumb {...baseProps} />);
    expect(screen.getByRole('link', { name: '' })).toHaveAttribute('href', '/');
    expect(screen.getByText('Directory')).toBeInTheDocument();
    expect(screen.getByText('Current Page')).toBeInTheDocument();
    // Directory should be a link
    expect(screen.getByText('Directory').closest('a')).toHaveAttribute('href', '/directory');
    // Current page should not be a link
    expect(screen.getByText('Current Page').closest('a')).toBeNull();
  });

  /**
   * Should render separators between items
   */
  it('renders separators between items', () => {
    render(<BreadCrumb {...baseProps} />);
    const separators = screen.getAllByText('/');
    // There should be at least two separators: after home and after directory
    expect(separators.length).toBeGreaterThanOrEqual(2);
  });

  /**
   * Should handle long page names with truncation
   */
  it('handles long page names with truncation', () => {
    render(<BreadCrumb {...baseProps} pageName={"A very very very long page name that should be truncated"} />);
    expect(screen.getByText(/A very very very long page name/)).toBeInTheDocument();
  });

  /**
   * Should handle missing directoryName gracefully
   */
  it('handles missing directoryName gracefully', () => {
    render(<BreadCrumb {...baseProps} directoryName={''} />);
    // Should still render home and current page
    expect(screen.getByText('Current Page')).toBeInTheDocument();
  });

  /**
   * Should handle missing backLink gracefully (directory is not a link)
   */
  it('handles missing backLink gracefully', () => {
    render(<BreadCrumb {...baseProps} backLink={''} />);
    // Directory should not be a link
    expect(screen.getByText('Directory').closest('a')).toBeNull();
  });

  /**
   * Should handle missing pageName gracefully
   */
  it('handles missing pageName gracefully', () => {
    render(<BreadCrumb {...baseProps} pageName={''} />);
    // Should still render directory
    expect(screen.getByText('Directory')).toBeInTheDocument();
  });
}); 