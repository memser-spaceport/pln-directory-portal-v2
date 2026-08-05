import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import FeatureAgentDemo from '@/app/feature-agent-demo/page';

describe('Feature agent demo page', () => {
  test('renders the greeting heading', () => {
    render(<FeatureAgentDemo />);

    expect(
      screen.getByRole('heading', {
        name: /hello from autonomous coding agent/i,
      }),
    ).toBeInTheDocument();
  });

  test('is public — renders without any auth cookies or redirect', () => {
    const { container } = render(<FeatureAgentDemo />);

    expect(container).not.toBeEmptyDOMElement();
    expect(screen.getByText('Hello from autonomous coding agent')).toBeInTheDocument();
  });
});
