import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { CompanyFundraiseParagraph } from '@/components/page/demo-day/FounderPendingView/components/CompanyFundraiseParagraph/CompanyFundraiseParagraph';

jest.mock('@/services/demo-day/hooks/useUpdateFundraiseDescription', () => ({
  useUpdateFundraiseDescription: jest.fn(() => ({ mutateAsync: jest.fn(), isPending: false })),
}));

describe('CompanyFundraiseParagraph', () => {
  it('linkifies urls and opens them in a separate tab', () => {
    render(<CompanyFundraiseParagraph paragraph="Learn more about us at https://protocol.ai/blog for more details." />);

    const link = screen.getByRole('link', { name: 'https://protocol.ai/blog' });

    expect(link).toHaveAttribute('href', 'https://protocol.ai/blog');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noreferrer noopener');
  });
});
