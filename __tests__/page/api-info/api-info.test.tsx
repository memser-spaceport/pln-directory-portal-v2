import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import ApiInfo from '@/components/page/api-info/api-info';
import { IApiInfo } from '@/utils/api-info.utils';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const info: IApiInfo = {
  service: 'directory-portal-frontend',
  environment: 'development',
  version: 'plaa-v7.13',
  feature: 'agent-demo',
  timestamp: '2024-05-06T07:08:09.010Z',
};

describe('ApiInfo component', () => {
  it('renders every service detail with its label', () => {
    render(<ApiInfo info={info} />);

    const labels = ['Service', 'Environment', 'Version', 'Feature', 'Timestamp (UTC)'];
    labels.forEach((label) => expect(screen.getByText(label)).toBeInTheDocument());

    expect(screen.getByText('directory-portal-frontend')).toBeInTheDocument();
    expect(screen.getByText('development')).toBeInTheDocument();
    expect(screen.getByText('plaa-v7.13')).toBeInTheDocument();
    expect(screen.getByText('agent-demo')).toBeInTheDocument();
    expect(screen.getByText('2024-05-06T07:08:09.010Z')).toBeInTheDocument();
  });

  it('exposes an accessible heading for the section', () => {
    render(<ApiInfo info={info} />);

    expect(screen.getByRole('heading', { level: 1, name: 'API Info' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'API Info' })).toBeInTheDocument();
  });

  it('renders an accessible link back to the home page', () => {
    render(<ApiInfo info={info} />);

    const homeLink = screen.getByRole('link', { name: 'Back to home page' });
    expect(homeLink).toHaveAttribute('href', '/');
  });
});
