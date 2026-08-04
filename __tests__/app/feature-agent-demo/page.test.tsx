import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import FeatureAgentDemo, { metadata } from '@/app/feature-agent-demo/page';

describe('Feature Agent Demo page', () => {
  it('renders the greeting heading', () => {
    render(<FeatureAgentDemo />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hello from autonomous coding agent');
  });

  it('exposes page metadata', () => {
    expect(metadata.title).toBe('Feature Agent Demo | Protocol Labs Directory');
    expect(metadata.description).toBe('Hello from autonomous coding agent');
  });
});
