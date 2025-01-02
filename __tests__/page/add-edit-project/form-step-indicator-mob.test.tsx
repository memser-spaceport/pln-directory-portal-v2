// __tests__/FormStepIndicatorMob.test.tsx
import { render, screen } from '@testing-library/react';
import FormStepIndicatorMob from '@/components/page/add-edit-project/form-step-indicator-mob';
import useStepsIndicator from '@/hooks/useStepsIndicator';  // Mock this hook to control its output
import '@testing-library/jest-dom';

// Mock the PROJECT_FORM_STEPS constant
jest.mock('@/utils/constants', () => ({
  PROJECT_FORM_STEPS: ['General', 'Contributors', 'KPIs', 'More Details'],  // Example steps
}));

// Mock the useStepsIndicator hook
jest.mock('@/hooks/useStepsIndicator', () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe('FormStepIndicatorMob', () => {
  it('renders the component with the correct step and information', () => {
    // Mock useStepsIndicator hook return value
    (useStepsIndicator as jest.Mock).mockReturnValue({
      currentStep: 'General',
    });

    // Render the component
    render(<FormStepIndicatorMob />);

    // Test that the current step is rendered correctly
    expect(screen.getByText('General')).toBeInTheDocument();

    // Test that the current step info is displayed (Step 1 of 3)
    expect(screen.getByText('Step 1 of 4')).toBeInTheDocument();

    // Test the step index is displayed correctly in the icon
    expect(screen.getByText('1')).toBeInTheDocument();

    // Test the title and description are displayed correctly
    expect(screen.getByText('Add Project')).toBeInTheDocument();
    expect(screen.getByText('Share your project details')).toBeInTheDocument();
  });

  it('renders the correct step number for different steps', () => {
    (useStepsIndicator as jest.Mock).mockReturnValue({
      currentStep: 'Contributors',
    });

    render(<FormStepIndicatorMob />);

    // Verify the correct step info is shown (Step 2 of 3)
    expect(screen.getByText('Step 2 of 4')).toBeInTheDocument();

    // Verify the step index is displayed correctly in the icon
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});
