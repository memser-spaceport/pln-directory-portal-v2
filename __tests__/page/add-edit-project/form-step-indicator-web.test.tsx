import { render, screen } from '@testing-library/react';
import { FormStepIndicatorWeb } from '@/components/page/add-edit-project/form-step-indicator-web';
import useStepsIndicator from '@/hooks/useStepsIndicator'; // Mock this hook to control its output
import { PROJECT_FORM_STEPS } from '@/utils/constants';
import '@testing-library/jest-dom';

// Mock the PROJECT_FORM_STEPS constant
jest.mock('@/utils/constants', () => ({
  PROJECT_FORM_STEPS: ['General', 'Contributors', 'KPIs', 'More Details'],
}));

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
    render(<FormStepIndicatorWeb />);

    // Test that the title contains the current step
    expect(screen.getByText(/Add Project General/i)).toBeInTheDocument();

    // Test that the description is displayed correctly
    expect(screen.getByText(/Share your project details/i)).toBeInTheDocument();

    // Test that the steps are rendered
    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('Contributors')).toBeInTheDocument();
    expect(screen.getByText('KPIs')).toBeInTheDocument();
    expect(screen.getByText('More Details')).toBeInTheDocument();

    // Test that the correct icon and step number are rendered
    expect(screen.getByText('1')).toBeInTheDocument(); // For General step
  });

  it('renders different steps based on the current step', () => {
    // Mock the hook to return a different step
    (useStepsIndicator as jest.Mock).mockReturnValue({
      currentStep: 'Contributors',
    });

    // Render the component again
    render(<FormStepIndicatorWeb />);

    // Test that the title updates with the current step
    expect(screen.getByText(/Add Project Contributors/i)).toBeInTheDocument();

    // Test the correct step number and active step icon
    expect(screen.getByText('2')).toBeInTheDocument(); // For Contributors step
  });

  it('displays the correct number of steps with appropriate icons', () => {
    (useStepsIndicator as jest.Mock).mockReturnValue({
      currentStep: 'KPIs',
    });

    render(<FormStepIndicatorWeb />);

    // Ensure all steps are rendered
    PROJECT_FORM_STEPS.forEach((step, index) => {
      expect(screen.getByText(step)).toBeInTheDocument();
    });

    // Ensure the correct step index is displayed for 'KPIs'
    expect(screen.getByText('3')).toBeInTheDocument(); // For KPIs step
  });
});
