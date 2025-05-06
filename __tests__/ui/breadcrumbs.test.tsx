import { render, screen } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';
import Breadcrumbs from '@/components/ui/breadcrumbs';

describe('Breadcrumbs', () => {
  const items = [
    { text: 'Home', url: '/home', icon: '/icon-home.svg' },
    { text: 'Library', url: '/library' },
    { text: 'Current', url: '/current', icon: '/icon-current.svg' },
  ];

  // Test: Renders all breadcrumb items
  it('renders all breadcrumb items', () => {
    render(<Breadcrumbs items={items} />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Library')).toBeInTheDocument();
    expect(screen.getByText('Current')).toBeInTheDocument();
  });

  // Test: Renders links for all but the last item
  it('renders links for all but the last item', () => {
    render(<Breadcrumbs items={items} />);
    const links = screen.getAllByRole('link');
    expect(links.length).toBe(2);
    expect(links[0]).toHaveAttribute('href', '/home');
    expect(links[1]).toHaveAttribute('href', '/library');
  });

  // Test: Renders icons if provided
  it('renders icons if provided', () => {
    render(<Breadcrumbs items={items} />);
    const icons = screen.getAllByAltText(''); 
    expect(icons[0]).toHaveAttribute('src', '/icon-home.svg');
    expect(icons[1]).toHaveAttribute('src', '/icon-current.svg');
  });

  // Test: Renders custom LinkComponent if provided
  it('renders custom LinkComponent if provided', () => {
    const CustomLink = ({ href, children }: any) => <a href={href} data-testid="custom-link">{children}</a>;
    render(<Breadcrumbs items={items} LinkComponent={CustomLink} />);
    const customLinks = screen.getAllByTestId('custom-link');
    expect(customLinks.length).toBe(2);
    expect(customLinks[0]).toHaveAttribute('href', '/home');
    expect(customLinks[1]).toHaveAttribute('href', '/library');
  });

  // Test: Renders separator for all but the last item
  it('renders separator for all but the last item', () => {
    render(<Breadcrumbs items={items} />);
    const separators = screen.getAllByText('/');
    expect(separators.length).toBe(2);
  });

  // Test: Renders "Current" for last item if text is missing
  it('renders "Current" for last item if text is missing', () => {
    const itemsNoText = [
      { text: 'Home', url: '/home' },
      { url: '/current' },
    ];
    render(<Breadcrumbs items={itemsNoText} />);
    expect(screen.getByText('Current')).toBeInTheDocument();
  });

  // Test: Handles empty items array
  it('renders nothing if items is empty', () => {
    render(<Breadcrumbs items={[]} />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByText('Current')).not.toBeInTheDocument();
  });

  // Test: Renders breadcrumb item with no icon
  it('renders breadcrumb item with no icon', () => {
    const itemsNoIcon = [
      { text: 'Home', url: '/home' },
      { text: 'Library', url: '/library' },
      { text: 'Current', url: '/current' },
    ];
    render(<Breadcrumbs items={itemsNoIcon} />);
    // Should not find any <img>
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Library')).toBeInTheDocument();
    expect(screen.getByText('Current')).toBeInTheDocument();
  });

  // Test: Renders breadcrumb item with no text (should render empty string for link)
  it('renders breadcrumb item with no text', () => {
    const itemsNoText = [
      { url: '/home' },
      { url: '/library' },
      { url: '/current' },
    ];
    render(<Breadcrumbs items={itemsNoText} />);
    // Should render three links (all with empty text)
    const links = screen.getAllByRole('link');
    expect(links.length).toBe(2); // Only first two are links
    // The text content of the links should be empty string
    expect(links[0].textContent).toBe('');
    expect(links[1].textContent).toBe('');
    // The last item should render "Current"
    expect(screen.getByText('Current')).toBeInTheDocument();
  });

  // Test: Renders breadcrumb item with both icon and text missing (edge case)
  it('renders breadcrumb item with both icon and text missing', () => {
    const itemsEdge = [
      { url: '/home' },
      { url: '/current' },
    ];
    render(<Breadcrumbs items={itemsEdge} />);
    // Should render a link with empty text and "Current" for the last item
    const links = screen.getAllByRole('link');
    expect(links.length).toBe(1);
    expect(links[0].textContent).toBe('');
    expect(screen.getByText('Current')).toBeInTheDocument();
  });

  // Test: Custom LinkComponent with missing text and icon
  it('renders custom LinkComponent for items with missing text and icon', () => {
    const CustomLink = ({ href, children }: any) => <a href={href} data-testid="custom-link">{children}</a>;
    const itemsEdge = [
      { url: '/home' }, // no text, no icon
      { url: '/current' }, // no text, no icon
    ];
    render(<Breadcrumbs items={itemsEdge} LinkComponent={CustomLink} />);
    const customLinks = screen.getAllByTestId('custom-link');
    expect(customLinks.length).toBe(1); // Only the first is a link, last is 'Current'
    expect(customLinks[0]).toHaveAttribute('href', '/home');
    expect(customLinks[0].textContent).toBe('');
    expect(screen.getByText('Current')).toBeInTheDocument();
  });
}); 