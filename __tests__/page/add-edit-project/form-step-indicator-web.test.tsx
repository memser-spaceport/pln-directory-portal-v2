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

describe('FormStepIndicatorWeb', () => {
  it('renders the component with the correct step and information', () => {
    // Mock useStepsIndicator hook return value
    (useStepsIndicator as jest.Mock).mockReturnValue({
      currentStep: 'General',
    });

    // Render the component
    render(
      <FormStepIndicatorWeb steps={PROJECT_FORM_STEPS} defaultStep={''} uniqueKey={''} title={''} subTitle={''} />,
    );

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

  it('renders different steps based on the current step', () => {
    // Mock the hook to return a different step
    (useStepsIndicator as jest.Mock).mockReturnValue({
      currentStep: 'Contributors',
    });

    // Render the component again
    render(
      <FormStepIndicatorWeb steps={PROJECT_FORM_STEPS} defaultStep={''} uniqueKey={''} title={''} subTitle={''} />,
    );

    // Test that the title updates with the current step
    expect(screen.getByTestId('formstep-title').textContent?.includes(PROJECT_FORM_STEPS[1])).toBeTruthy();

    // Test the correct step number and active step icon
    expect(screen.getByText('2')).toBeInTheDocument(); // For Contributors step
  });

  it('displays the correct number of steps with appropriate icons', () => {
    (useStepsIndicator as jest.Mock).mockReturnValue({
      currentStep: 'KPIs',
    });

    render(
      <FormStepIndicatorWeb steps={PROJECT_FORM_STEPS} defaultStep={''} uniqueKey={''} title={''} subTitle={''} />,
    );

    // Ensure all steps are rendered
    PROJECT_FORM_STEPS.forEach((step, index) => {
      expect(screen.getByText(step)).toBeInTheDocument();
    });

    // Ensure the correct step index is displayed for 'KPIs'
    expect(screen.getByText('3')).toBeInTheDocument(); // For KPIs step
  });
});
