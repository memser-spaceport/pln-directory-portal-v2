import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { SidebarProvider, useSidebar } from '@/components/page/husky/sidebar';

const RailState = () => {
  const { state } = useSidebar();
  return <span data-testid="rail-state">{state}</span>;
};

describe('LAB-2774: ⌘B on the AI Search page', () => {
  it('collapses and expands the History rail on desktop', () => {
    render(
      <SidebarProvider defaultOpen>
        <RailState />
      </SidebarProvider>,
    );

    expect(screen.getByTestId('rail-state')).toHaveTextContent('expanded');

    act(() => {
      fireEvent.keyDown(window, { key: 'b', metaKey: true });
    });
    expect(screen.getByTestId('rail-state')).toHaveTextContent('collapsed');

    act(() => {
      fireEvent.keyDown(window, { key: 'b', ctrlKey: true });
    });
    expect(screen.getByTestId('rail-state')).toHaveTextContent('expanded');
  });
});
