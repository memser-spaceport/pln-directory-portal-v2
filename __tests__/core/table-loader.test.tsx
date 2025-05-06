import React from 'react';
import { render, screen } from '@testing-library/react';
import TableLoader from '../../components/core/table-loader';
import '@testing-library/jest-dom';
describe('TableLoader Component', () => {
  it('renders without crashing', () => {
    render(<TableLoader />);
    expect(screen.getByText('Loading more data...')).toBeInTheDocument();
  });

  it('renders the loader container with correct class', () => {
    render(<TableLoader />);
    expect(document.querySelector('.loader')).toBeInTheDocument();
  });

  it('renders the spinner with correct class', () => {
    render(<TableLoader />);
    expect(document.querySelector('.spinner')).toBeInTheDocument();
  });

  it('displays the correct loading text', () => {
    render(<TableLoader />);
    expect(screen.getByText('Loading more data...')).toBeVisible();
  });

  it('matches snapshot', () => {
    const { asFragment } = render(<TableLoader />);
    expect(asFragment()).toMatchSnapshot();
  });
});
