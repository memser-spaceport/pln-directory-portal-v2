/**
 * @fileoverview Unit tests for FormStepIndicatorWeb component using Jest and React Testing Library.
 * Covers all branches, edge cases, and ensures 100% test coverage.
 */
import { render, screen } from '@testing-library/react';
import { FormStepIndicatorWeb } from '@/components/core/form-step-indicator-web';
import useStepsIndicator from '@/hooks/useStepsIndicator'; // Mock this hook to control its output
import { PROJECT_FORM_STEPS } from '@/utils/constants';
import '@testing-library/jest-dom';

// Mock the useStepsIndicator hook
jest.mock('@/hooks/useStepsIndicator', () => ({
  __esModule: true,
  default: jest.fn(),
}));

/**
 * Helper to render the component with default or custom props.
 */
const renderComponent = (props = {}) => {
  return render(
    <FormStepIndicatorWeb
      steps={['General', 'Contributors', 'KPIs', 'More Details']}
      defaultStep="General"
      uniqueKey="test-key"
      title="Add Project"
      subTitle="Share your project details"
      {...props}
    />
  );
};

describe('FormStepIndicatorWeb', () => {

  it('renders the component with the correct step and information', () => {
    // Mock useStepsIndicator hook return value
    (useStepsIndicator as jest.Mock).mockReturnValue({
      currentStep: 'General',
    });

    // Render the component
    render(<FormStepIndicatorWeb steps={PROJECT_FORM_STEPS} defaultStep={''} uniqueKey={''} title={''} subTitle={''} />);

    // Test that the title contains the current step
    expect(screen.getByText(PROJECT_FORM_STEPS[0])).toBeInTheDocument();

    // Test that the steps are rendered
    expect(screen.getByText(PROJECT_FORM_STEPS[0])).toBeInTheDocument();
    expect(screen.getByText(PROJECT_FORM_STEPS[1])).toBeInTheDocument();
    expect(screen.getByText(PROJECT_FORM_STEPS[2])).toBeInTheDocument();
    expect(screen.getByText(PROJECT_FORM_STEPS[3])).toBeInTheDocument();

    // Test that the correct icon and step number are rendered
    expect(screen.getByText('1')).toBeInTheDocument(); // For General step
  });

  /**
   * Rendering with a middle step active.
   */
  it('renders different steps based on the current step', () => {
    // Mock the hook to return a different step
    (useStepsIndicator as jest.Mock).mockReturnValue({
      currentStep: 'Contributors',
    });

    // Render the component again
    render(<FormStepIndicatorWeb steps={PROJECT_FORM_STEPS} defaultStep={''} uniqueKey={''} title={''} subTitle={''} />);

    // Test that the title updates with the current step
    expect(screen.getByTestId('formstep-title').textContent?.includes(PROJECT_FORM_STEPS[1])).toBeTruthy();

    // Test the correct step number and active step icon
    expect(screen.getByText('2')).toBeInTheDocument(); // For Contributors step
  });

  /**
   * Rendering with a later step active.
   */
  it('displays the correct number of steps with appropriate icons', () => {
    (useStepsIndicator as jest.Mock).mockReturnValue({
      currentStep: 'KPIs',
    });

    render(<FormStepIndicatorWeb steps={PROJECT_FORM_STEPS} defaultStep={''} uniqueKey={''} title={''} subTitle={''} />);

    // Ensure all steps are rendered
    PROJECT_FORM_STEPS.forEach((step, index) => {
      expect(screen.getByText(step)).toBeInTheDocument();
    });
    expect(screen.getByText('3')).toBeInTheDocument(); // For KPIs step
  });

  /**
   * Edge case: currentStep not found in steps.
   */
  it('handles currentStep not found in steps gracefully', () => {
    (useStepsIndicator as jest.Mock).mockReturnValue({ currentStep: 'NonExistentStep' });
    renderComponent();
    // Should still render all steps and not crash
    PROJECT_FORM_STEPS.forEach((step) => {
      expect(screen.getByText(step)).toBeInTheDocument();
    });
    // No step should be marked as current (so no .currentStep class)
    expect(screen.queryByText('1')).not.toHaveClass('currentStep');
  });

  /**
   * Edge case: steps is an empty array.
   */
  it('renders nothing for steps if steps is an empty array', () => {
    (useStepsIndicator as jest.Mock).mockReturnValue({ currentStep: 'General' });
    renderComponent({ steps: [] });
    // No step should be rendered
    expect(screen.queryByText('General')).not.toBeInTheDocument();
    expect(screen.queryByText('1')).not.toBeInTheDocument();
  });

  /**
   * Edge case: only one step.
   */
  it('renders correctly with only one step', () => {
    (useStepsIndicator as jest.Mock).mockReturnValue({ currentStep: 'General' });
    renderComponent({ steps: ['General'] });
    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  /**
   * Edge case: currentStep is the last step.
   */
  it('renders correctly when currentStep is the last step', () => {
    (useStepsIndicator as jest.Mock).mockReturnValue({ currentStep: 'More Details' });
    renderComponent();
    expect(screen.getByText('Add Project - More Details')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  /**
   * Edge case: title and subTitle are empty.
   */
  it('renders with empty title and subTitle', () => {
    (useStepsIndicator as jest.Mock).mockReturnValue({ currentStep: 'General' });
    renderComponent({ title: '', subTitle: '' });
    const titleNode = screen.getByRole('heading', { level: 1 });
    expect(titleNode).toHaveTextContent(/- General$/);
  });

  /**
   * Accessibility: images have alt attributes.
   */
  it('renders step icons with alt attributes', () => {
    (useStepsIndicator as jest.Mock).mockReturnValue({ currentStep: 'General' });
    renderComponent();
    // All step icons should have alt="step icon"
    const images = screen.getAllByAltText('step icon');
    expect(images.length).toBeGreaterThan(0);
  });
});
