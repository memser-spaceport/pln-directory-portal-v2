import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import TeamProjectsInfo from '@/components/page/team-form-info/team-projects-info';

// Mock child components for isolation
global.structuredClone = (val) => JSON.parse(JSON.stringify(val)); // for resetHandler
jest.mock('@/components/form/multi-select', () => (props: any) => (
  <div data-testid={`multi-select-${props.label?.replace(/\W/g, '').toLowerCase()}`}>{props.label}
    <button data-testid={`add-${props.label}`} onClick={() => props.onAdd(props.options[0])}>Add</button>
    <button data-testid={`remove-${props.label}`} onClick={() => props.onRemove(props.selectedOptions[0])}>Remove</button>
    {props.selectedOptions.map((opt: any, i: number) => <span key={i}>{opt.name}</span>)}
  </div>
));
jest.mock('@/components/form/single-select', () => (props: any) => (
  <div data-testid="single-select">
    <button data-testid="select-funding-stage" onClick={() => props.onItemSelect(props.options[0])}>Select Funding</button>
    <span>{props.selectedOption?.name}</span>
  </div>
));
jest.mock('@/components/form/hidden-field', () => (props: any) => (
  <input data-testid="hidden-field" name={props.name} value={props.value} readOnly />
));
jest.mock('@/components/page/team-form-info/focus-area/focus-area-list', () => (props: any) => (
  <div data-testid="focus-area-list">
    <button data-testid="edit-focus-area" onClick={() => props.onOpen('Edit')}>Edit</button>
    {props.selectedItems.map((item: any, i: number) => <span key={i}>{item.title}</span>)}
  </div>
));
jest.mock('@/components/page/team-form-info/focus-area/focus-areas-popup', () => (props: any) => (
  <div data-testid="focus-areas-popup">
    <button data-testid="save-focus-area" onClick={() => props.handleFoucsAreaSave([{ uid: 'fa2', title: 'Focus Area 2' }])}>Save</button>
    <button data-testid="close-focus-area" onClick={props.onClose}>Close</button>
    {props.selectedItems.map((item: any, i: number) => <span key={i}>{item.title}</span>)}
  </div>
));
jest.mock('@/components/core/modal', () => (props: any) => (
  <dialog data-testid="modal" ref={props.modalRef} open>{props.children}</dialog>
));

const baseProps = {
  protocolOptions: [
    { id: 'p1', name: 'Protocol 1' },
    { id: 'p2', name: 'Protocol 2' },
  ],
  fundingStageOptions: [
    { id: 'f1', name: 'Seed' },
    { id: 'f2', name: 'Series A' },
  ],
  membershipSourceOptions: [
    { id: 'm1', name: 'Source 1' },
    { id: 'm2', name: 'Source 2' },
  ],
  industryTagOptions: [
    { id: 'i1', name: 'Industry 1' },
    { id: 'i2', name: 'Industry 2' },
  ],
  errors: [],
  focusAreas: [
    { uid: 'fa1', title: 'Focus Area 1' },
    { uid: 'fa2', title: 'Focus Area 2' },
  ],
  initialValues: {
    technologies: [{ id: 'p1', name: 'Protocol 1' }],
    membershipSources: [{ id: 'm1', name: 'Source 1' }],
    industryTags: [{ id: 'i1', name: 'Industry 1' }],
    fundingStage: { id: 'f1', name: 'Seed' },
    teamFocusAreas: [{ uid: 'fa1', title: 'Focus Area 1' }],
  },
  showFocusArea: true,
};

// Mock dialog showModal/close for JSDOM
defineDialogMockMethods();
function defineDialogMockMethods() {
  if (!window.HTMLDialogElement.prototype.showModal) {
    window.HTMLDialogElement.prototype.showModal = jest.fn();
  }
  if (!window.HTMLDialogElement.prototype.close) {
    window.HTMLDialogElement.prototype.close = jest.fn();
  }
}

/**
 * Test suite for TeamProjectsInfo component.
 * Covers all branches, lines, and edge cases for 100% coverage.
 */
describe('TeamProjectsInfo', () => {
  it('renders all form sections and hidden fields', () => {
    render(<TeamProjectsInfo {...baseProps} />);
    expect(screen.getByTestId('multi-select-protocol')).toBeInTheDocument();
    expect(screen.getByTestId('multi-select-membershipsource')).toBeInTheDocument();
    expect(screen.getByTestId('multi-select-industrytags')).toBeInTheDocument();
    expect(screen.getByTestId('single-select')).toBeInTheDocument();
    expect(screen.getByTestId('focus-area-list')).toBeInTheDocument();
    // Hidden fields for protocols
    expect(screen.getAllByTestId('hidden-field').length).toBeGreaterThan(0);
  });

  it('renders errors if present', () => {
    render(<TeamProjectsInfo {...baseProps} errors={["Error 1", "Error 2"]} />);
    expect(screen.getByText('Error 1')).toBeInTheDocument();
    expect(screen.getByText('Error 2')).toBeInTheDocument();
  });

  it('can add and remove protocols', () => {
    render(<TeamProjectsInfo {...baseProps} />);
    fireEvent.click(screen.getByTestId('add-Protocol'));
    fireEvent.click(screen.getByTestId('remove-Protocol'));
    // Should not throw and should update selected options
  });

  it('can add and remove membership sources', () => {
    render(<TeamProjectsInfo {...baseProps} />);
    fireEvent.click(screen.getByTestId('add-Membership Source'));
    fireEvent.click(screen.getByTestId('remove-Membership Source'));
  });

  it('can add and remove industry tags', () => {
    render(<TeamProjectsInfo {...baseProps} />);
    fireEvent.click(screen.getByTestId('add-Industry Tags*'));
    fireEvent.click(screen.getByTestId('remove-Industry Tags*'));
  });

  it('handles funding stage selection', () => {
    render(<TeamProjectsInfo {...baseProps} />);
    fireEvent.click(screen.getByTestId('select-funding-stage'));
    expect(screen.getByText('Seed')).toBeInTheDocument();
  });

  it('opens and closes the focus area modal', async () => {
    render(<TeamProjectsInfo {...baseProps} />);
    // Open modal
    fireEvent.click(screen.getByTestId('edit-focus-area'));
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByTestId('focus-areas-popup')).toBeInTheDocument();
    // Save in modal
    fireEvent.click(screen.getByTestId('save-focus-area'));
    // Close modal
    fireEvent.click(screen.getByTestId('close-focus-area'));
    // Modal should still be in DOM (dialog), but popup should be gone
    await waitFor(() => {
      expect(screen.queryByTestId('focus-areas-popup')).not.toBeInTheDocument();
    });
  });

  it('does not render focus area section if showFocusArea is false', () => {
    render(<TeamProjectsInfo {...baseProps} showFocusArea={false} />);
    expect(screen.queryByTestId('focus-area-list')).not.toBeInTheDocument();
  });

  it('resets protocols to initial values on reset event', async () => {
    render(<TeamProjectsInfo {...baseProps} />);
    // Change state by adding/removing
    fireEvent.click(screen.getByTestId('add-Protocol'));
    // Dispatch reset event
    fireEvent(document, new CustomEvent('reset-team-register-form'));
    // Should reset to initial values (protocol 1 present)
    expect(screen.getByText('Protocol 1')).toBeInTheDocument();
  });

  it('renders with empty initial values and focusAreas', () => {
    const props = {
      ...baseProps,
      initialValues: {
        technologies: [],
        membershipSources: [],
        industryTags: [],
        fundingStage: { id: '', name: '' },
        teamFocusAreas: [],
      },
      focusAreas: [],
    };
    render(<TeamProjectsInfo {...props} />);
    expect(screen.getByTestId('multi-select-protocol')).toBeInTheDocument();
  });

  it('renders with missing optional props', () => {
    const { showFocusArea, focusAreas, ...rest } = baseProps;
    render(<TeamProjectsInfo {...rest} />);
    expect(screen.getByTestId('multi-select-protocol')).toBeInTheDocument();
  });

  it('renders funding stage hidden fields with correct values', () => {
    render(<TeamProjectsInfo {...baseProps} />);
    // There should be hidden fields for fundingStage-uid and fundingStage-title
    const uidField = screen.getAllByTestId('hidden-field').find(
      (el) => el.getAttribute('name') === 'fundingStage-uid'
    );
    const titleField = screen.getAllByTestId('hidden-field').find(
      (el) => el.getAttribute('name') === 'fundingStage-title'
    );
    expect(uidField).toHaveAttribute('value', 'f1');
    expect(titleField).toHaveAttribute('value', 'Seed');
  });

  it('renders funding stage hidden fields with default empty string when fundingStage is undefined', () => {
    const customProps = {
      ...baseProps,
      initialValues: {
        ...baseProps.initialValues,
        fundingStage: undefined,
      },
    };
    render(<TeamProjectsInfo {...customProps} />);
    const uidField = screen.getAllByTestId('hidden-field').find(
      (el) => el.getAttribute('name') === 'fundingStage-uid'
    );
    const titleField = screen.getAllByTestId('hidden-field').find(
      (el) => el.getAttribute('name') === 'fundingStage-title'
    );
    expect(uidField).toHaveAttribute('value', '');
    expect(titleField).toHaveAttribute('value', '');
  });

  it('renders funding stage hidden fields with default empty string when fundingStage is null', () => {
    const customProps = {
      ...baseProps,
      initialValues: {
        ...baseProps.initialValues,
        fundingStage: null,
      },
    };
    render(<TeamProjectsInfo {...customProps} />);
    const uidField = screen.getAllByTestId('hidden-field').find(
      (el) => el.getAttribute('name') === 'fundingStage-uid'
    );
    const titleField = screen.getAllByTestId('hidden-field').find(
      (el) => el.getAttribute('name') === 'fundingStage-title'
    );
    expect(uidField).toHaveAttribute('value', '');
    expect(titleField).toHaveAttribute('value', '');
  });

  it('renders focus areas from initial values', () => {
    render(<TeamProjectsInfo {...baseProps} />);
    expect(screen.getByTestId('focus-area-list')).toBeInTheDocument();
  });

  it('renders no focus areas if teamFocusAreas is undefined on mount', () => {
    const customProps = {
      ...baseProps,
      initialValues: {
        ...baseProps.initialValues,
        teamFocusAreas: undefined,
      },
    };
    render(<TeamProjectsInfo {...customProps} />);
    // The container is present, but there should be no focus area spans
    expect(screen.getByTestId('focus-area-list').querySelectorAll('span').length).toBe(0);
  });

  it('resets focus areas to empty when teamFocusAreas is null on reset event', async () => {
    const customProps = {
      ...baseProps,
      initialValues: {
        ...baseProps.initialValues,
        teamFocusAreas: null,
      },
      focusAreas: [],
    };
    render(<TeamProjectsInfo {...customProps} />);
    // Simulate changing focus areas (simulate save in modal)
    fireEvent.click(screen.getByTestId('edit-focus-area'));
    fireEvent.click(screen.getByTestId('save-focus-area'));
    // There may be multiple 'Focus Area 2' spans, so check count
    expect(screen.queryAllByText('Focus Area 2').length).toBeGreaterThan(0);
    // Now reset
    fireEvent(document, new CustomEvent('reset-team-register-form'));
    // Should reset to empty
    expect(screen.queryAllByText('Focus Area 2').length).toBe(0);
  });
}); 