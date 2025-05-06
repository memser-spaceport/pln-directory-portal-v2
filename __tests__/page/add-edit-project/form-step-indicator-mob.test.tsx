import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PROJECT_FORM_STEPS } from '@/utils/constants';

// Mock the useStepsIndicator hook
jest.mock('@/hooks/useStepsIndicator', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockUseStepsIndicator = require('@/hooks/useStepsIndicator').default;
const FormStepIndicatorMob = require('@/components/core/form-step-indicator-mob').default;

describe('FormStepIndicatorMob', () => {
  const steps = ['General', 'Contributors', 'KPIs', 'More Details'];
  const defaultStep = 'General';
  const uniqueKey = 'test-key';
  const title = 'Add Project';
  const subTitle = 'Share your project details';

  it('renders the component with the correct step and information', () => {
    // Mock useStepsIndicator hook return value
    (useStepsIndicator as jest.Mock).mockReturnValue({
      currentStep: 'General',
    });

    // Render the component
    render(<FormStepIndicatorMob steps={PROJECT_FORM_STEPS} defaultStep={''} uniqueKey={''} title={'Add Project'} subTitle={'Share your project details'} />);

    // Test that the current step is rendered correctly
    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('Step 1 of 4')).toBeInTheDocument();
    expect(screen.getByText('Add Project')).toBeInTheDocument();
    expect(screen.getByText('Share your project details')).toBeInTheDocument();
  });

  it('renders the correct step number for different steps', () => {
    (useStepsIndicator as jest.Mock).mockReturnValue({
      currentStep: 'Contributors',
    });

    render(<FormStepIndicatorMob steps={PROJECT_FORM_STEPS} defaultStep={''} uniqueKey={''} title={''} subTitle={''}/>);

    // Verify the correct step info is shown (Step 2 of 3)
    expect(screen.getByText('Step 2 of 4')).toBeInTheDocument();

    // Verify the step index is displayed correctly in the icon
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});

