import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import FeatureAgentDemoPage from '@/app/feature-agent-demo/page';

describe('FeatureAgentDemoPage', () => {
  it('renders the hello message', () => {
    render(<FeatureAgentDemoPage />);

    expect(screen.getByRole('heading', { name: 'Hello from autonomous coding agent' })).toBeInTheDocument();
  });
});
