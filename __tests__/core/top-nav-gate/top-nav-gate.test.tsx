import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';

import { TopNavGate, useTopNavStore } from '@/components/core/TopNavGate';

describe('TopNavGate', () => {
  afterEach(() => useTopNavStore.setState({ hidden: false }));

  it('renders the top navigation by default', () => {
    render(
      <TopNavGate>
        <header>LabOS header</header>
      </TopNavGate>,
    );
    expect(screen.getByText('LabOS header')).toBeInTheDocument();
  });

  it('removes it while a page asks for full page, and brings it back after', () => {
    render(
      <TopNavGate>
        <header>LabOS header</header>
      </TopNavGate>,
    );

    act(() => useTopNavStore.getState().setHidden(true));
    expect(screen.queryByText('LabOS header')).toBeNull();

    act(() => useTopNavStore.getState().setHidden(false));
    expect(screen.getByText('LabOS header')).toBeInTheDocument();
  });
});
