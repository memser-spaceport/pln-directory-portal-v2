import { render, screen } from '@testing-library/react';
import FeatureAgentDemo from '@/app/feature-agent-demo/page';

describe('FeatureAgentDemo page', () => {
  test('renders the hello message', () => {
    render(<FeatureAgentDemo />);

    expect(screen.getByText('Hello from autonomous coding agent')).toBeInTheDocument();
  });
});
