/**
 * LAB-3095: the search submit button held only an icon and had no accessible name (axe button-name).
 */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { DebouncedInput } from '@/components/core/application-search/components/DebouncedInput/DebouncedInput';

it('names the icon-only search button "Search"', () => {
  render(<DebouncedInput value="" onChange={() => {}} flushIcon={<svg />} />);
  expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
});
