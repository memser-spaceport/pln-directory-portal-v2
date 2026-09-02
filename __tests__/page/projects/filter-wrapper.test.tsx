import '@testing-library/jest-dom';
import { act, render, screen, within } from '@testing-library/react';

import FilterWrapper from '@/components/page/projects/filter-wrapper';
import { EVENTS } from '@/utils/constants';

jest.mock('@/components/page/projects/project-filter', () => ({
  __esModule: true,
  default: () => <div data-testid="project-filter">Project filter</div>,
}));

const props = {
  userInfo: { name: 'Test', email: 'test@example.com', uid: '1' },
  searchParams: {},
  focusAreas: {},
  selectedTeam: { label: '', value: '', logo: '' },
  initialTeams: [],
  filters: {},
};

describe('Projects FilterWrapper', () => {
  it('portals the mobile filter overlay to document.body so it is visible when the sidebar is hidden', () => {
    const { container } = render(
      <div style={{ display: 'none' }} data-testid="hidden-sidebar">
        <FilterWrapper {...props} />
      </div>,
    );

    expect(screen.queryByTestId('projects-mobile-filter')).not.toBeInTheDocument();

    act(() => {
      document.dispatchEvent(new CustomEvent(EVENTS.SHOW_PROJECTS_FILTER, { detail: true }));
    });

    const overlay = screen.getByTestId('projects-mobile-filter');
    expect(within(overlay).getByTestId('project-filter')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="hidden-sidebar"]')).not.toContainElement(overlay);
    expect(document.body).toContainElement(overlay);
  });

  it('closes the mobile filter overlay', () => {
    render(<FilterWrapper {...props} />);

    act(() => {
      document.dispatchEvent(new CustomEvent(EVENTS.SHOW_PROJECTS_FILTER, { detail: true }));
    });
    expect(screen.getByTestId('projects-mobile-filter')).toBeInTheDocument();

    act(() => {
      document.dispatchEvent(new CustomEvent(EVENTS.SHOW_PROJECTS_FILTER, { detail: false }));
    });
    expect(screen.queryByTestId('projects-mobile-filter')).not.toBeInTheDocument();
  });
});
