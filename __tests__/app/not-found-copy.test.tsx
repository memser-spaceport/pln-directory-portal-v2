/**
 * A 404 says "Page not found", not the error page's "Oh snap! Something went wrong!", which made a correct 404 read
 * as a failure.
 */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import NotFound from '@/app/not-found';
import ErrorPage from '@/components/core/error';

describe('not-found and error pages', () => {
  it('heads a 404 "Page not found", with the not-found message', () => {
    render(<NotFound />);
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(screen.queryByText(/Oh snap/)).not.toBeInTheDocument();
    expect(screen.getByText(/doesn.t exist or has been removed/)).toBeInTheDocument();
  });

  it('keeps "Oh snap" for a real error', () => {
    render(<ErrorPage refreshOnMount={false} />);
    expect(screen.getByRole('heading', { name: 'Oh snap! Something went wrong!' })).toBeInTheDocument();
  });
});
