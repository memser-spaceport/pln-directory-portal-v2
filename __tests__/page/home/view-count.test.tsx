import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { ViewCount } from '@/components/page/home/TeamNews/components/ViewCount/ViewCount';

describe('ViewCount', () => {
  it('shows "0 Views" when count is 0 (row shape stays stable, matching UpvoteButton)', () => {
    render(<ViewCount count={0} />);
    expect(screen.getByText('0 Views')).toBeInTheDocument();
  });

  it('treats an undefined count the same as 0', () => {
    render(<ViewCount />);
    expect(screen.getByText('0 Views')).toBeInTheDocument();
  });

  it('renders a compact count by default', () => {
    render(<ViewCount count={1234} />);
    expect(screen.getByText('1.2k Views')).toBeInTheDocument();
  });

  it('renders the exact count when exact is set', () => {
    render(<ViewCount count={1234} exact />);
    expect(screen.getByText('1,234 Views')).toBeInTheDocument();
  });
});
