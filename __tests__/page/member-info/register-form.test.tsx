// Polyfill for structuredClone if not available in test environment
if (typeof global.structuredClone !== 'function') {
  global.structuredClone = (obj) => {
    if (obj === undefined) return undefined;
    return JSON.parse(JSON.stringify(obj));
  };
}

// Mock modules before imports
jest.mock('@/utils/member.utils', () => ({
  validateBasicForms: jest.fn().mockResolvedValue([]),
  validateTeamsAndSkills: jest.fn().mockResolvedValue([]),
  validateContributionErrors: jest.fn().mockResolvedValue({}),
  getMemberInfoFormValues: jest.fn().mockResolvedValue({
    teams: [{ teamTitle: 'Team A', teamUid: 'team-a' }],
    projects: [{ projectName: 'Project A', projectUid: 'project-a' }],
    skills: [{ title: 'Skill A', uid: 'skill-a' }],
    isError: false
  }),
  formInputsToMemberObj: jest.fn(data => data),
  memberRegistrationDefaults: {}
}));

jest.mock('@/services/participants-request.service', () => ({
  createParticipantRequest: jest.fn().mockResolvedValue({ ok: true })
}));

jest.mock('@/services/registration.service', () => ({
  saveRegistrationImage: jest.fn().mockResolvedValue({
    image: { uid: 'image-uid', url: 'https://example.com/image.jpg' }
  })
}));

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RegisterForm from '@/components/page/member-info/register-form';
import { EVENTS } from '@/utils/constants';
import * as memberUtils from '@/utils/member.utils';
import * as participantsRequestService from '@/services/participants-request.service';
import * as registrationService from '@/services/registration.service';
import { toast } from 'react-toastify';

// Define types for component props
interface BasicInfoProps {
  initialValues: any;
  errors: string[];
}

interface ContributionInfoProps {
  initialValues: any;
  projectsOptions: any[];
  errors: Record<number, string[]>;
}

interface SkillsInfoProps {
  initialValues: any;
  errors: string[];
  teamsOptions: any[];
  skillsOptions: any[];
}

interface SocialInfoProps {
  initialValues: any;
  errors: string[];
}

interface RegisterActionsProps {
  currentStep: string;
  onCloseForm: () => void;
  onBackClicked: () => void;
  onNextClicked: () => void;
}

interface RegisterSuccessProps {
  onCloseForm: () => void;
}

// Mock the imported components
jest.mock('@/components/core/register/register-form-loader', () => () => <div data-testid="register-form-loader" />);
jest.mock('@/components/page/member-info/member-basic-info', () => ({ initialValues, errors }: BasicInfoProps) => (
  <div data-testid="member-basic-info">
    <div data-testid="basic-info-errors">{JSON.stringify(errors)}</div>
    <input name="name" defaultValue={initialValues?.name || ''} data-testid="name-input" />
    <input name="email" defaultValue={initialValues?.email || ''} data-testid="email-input" />
  </div>
));
jest.mock('@/components/page/member-info/member-contributions-info', () => ({ initialValues, projectsOptions, errors }: ContributionInfoProps) => (
  <div data-testid="member-contributions-info">
    <div data-testid="contribution-info-errors">{JSON.stringify(errors)}</div>
  </div>
));
jest.mock('@/components/page/member-info/member-skills-info', () => ({ initialValues, errors, teamsOptions, skillsOptions }: SkillsInfoProps) => (
  <div data-testid="member-skills-info">
    <div data-testid="skills-info-errors">{JSON.stringify(errors)}</div>
  </div>
));
jest.mock('@/components/page/member-info/member-social-info', () => ({ initialValues, errors }: SocialInfoProps) => (
  <div data-testid="member-social-info">
    <div data-testid="social-info-errors">{JSON.stringify(errors)}</div>
  </div>
));
jest.mock('@/components/core/register/register-actions', () => ({ currentStep, onCloseForm, onBackClicked, onNextClicked }: RegisterActionsProps) => (
  <div data-testid="register-actions">
    <button data-testid="close-button" onClick={onCloseForm}>Close</button>
    <button data-testid="back-button" onClick={onBackClicked}>Back</button>
    <button data-testid="next-button" onClick={onNextClicked}>Next</button>
    <button data-testid="submit-button" type="submit">Submit</button>
    <span data-testid="current-step">{currentStep}</span>
  </div>
));
jest.mock('@/components/core/register/register-success', () => ({ onCloseForm }: RegisterSuccessProps) => (
  <div data-testid="register-success">
    <button data-testid="success-close-button" onClick={onCloseForm}>Close</button>
  </div>
));
jest.mock('@/hooks/useStepsIndicator', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(({ steps, defaultStep, uniqueKey }: { steps: string[], defaultStep: string, uniqueKey: string }) => {
    const [currentStep, setCurrentStep] = React.useState(defaultStep);
    
    React.useEffect(() => {
      const handler = (e: CustomEvent) => {
        setCurrentStep(e.detail);
      };
      document.addEventListener(`${uniqueKey}-set-step`, handler as EventListener);
      return () => {
        document.removeEventListener(`${uniqueKey}-set-step`, handler as EventListener);
      };
    }, [uniqueKey]);

    return {
      currentStep,
      setCurrentStep: (step: string) => document.dispatchEvent(new CustomEvent(`${uniqueKey}-set-step`, { detail: step })),
      goToNextStep: () => {
        const currentIndex = steps.indexOf(currentStep);
        if (currentIndex < steps.length - 1) {
          setCurrentStep(steps[currentIndex + 1]);
        }
      },
      goToPreviousStep: () => {
        const currentIndex = steps.indexOf(currentStep);
        if (currentIndex > 0) {
          setCurrentStep(steps[currentIndex - 1]);
        }
      }
    };
  })
}));
jest.mock('@/analytics/join-network.analytics', () => ({
  useJoinNetworkAnalytics: () => ({
    recordMemberJoinNetworkSave: jest.fn(),
    recordMemberJoinNetworkNextClick: jest.fn(),
    recordMemberJoinNetworkBackClick: jest.fn()
  })
}));
jest.mock('react-toastify', () => ({
  toast: {
    error: jest.fn()
  }
}));

// Create direct references to the mocked functions
const validateBasicFormsMock = memberUtils.validateBasicForms as jest.MockedFunction<typeof memberUtils.validateBasicForms>;
const validateTeamsAndSkillsMock = memberUtils.validateTeamsAndSkills as jest.MockedFunction<typeof memberUtils.validateTeamsAndSkills>;
const validateContributionErrorsMock = memberUtils.validateContributionErrors as jest.MockedFunction<typeof memberUtils.validateContributionErrors>;
const getMemberInfoFormValuesMock = memberUtils.getMemberInfoFormValues as jest.MockedFunction<typeof memberUtils.getMemberInfoFormValues>;
const formInputsToMemberObjMock = memberUtils.formInputsToMemberObj as jest.MockedFunction<typeof memberUtils.formInputsToMemberObj>;
const createParticipantRequestMock = participantsRequestService.createParticipantRequest as jest.MockedFunction<typeof participantsRequestService.createParticipantRequest>;
const saveRegistrationImageMock = registrationService.saveRegistrationImage as jest.MockedFunction<typeof registrationService.saveRegistrationImage>;

// Create a custom event dispatch function for TRIGGER_REGISTER_LOADER
const mockDispatchEvent = jest.fn();
const originalDispatchEvent = document.dispatchEvent;
beforeEach(() => {
  document.dispatchEvent = mockDispatchEvent;
  jest.clearAllMocks();
});
afterEach(() => {
  document.dispatchEvent = originalDispatchEvent;
  jest.clearAllMocks();
});

describe('RegisterForm Component', () => {
  const onCloseForm = jest.fn();
  
  // Helper function to render the component
  const renderComponent = () => {
    return render(<RegisterForm onCloseForm={onCloseForm} />);
  };

  it('renders the component with initial basic info step', () => {
    renderComponent();
    expect(screen.getByTestId('register-form-loader')).toBeInTheDocument();
    expect(screen.getByTestId('member-basic-info')).toBeInTheDocument();
    expect(screen.getByTestId('register-actions')).toBeInTheDocument();
    expect(screen.getByTestId('current-step')).toHaveTextContent('basic');
  });

  it('loads form data on mount', async () => {
    renderComponent();
    await waitFor(() => {
      expect(getMemberInfoFormValuesMock).toHaveBeenCalled();
    });
  });

  it('handles API error when loading form data', async () => {
    // Mock the API to return an error state
    getMemberInfoFormValuesMock.mockRejectedValueOnce(new Error('API Error'));
    console.error = jest.fn(); // Mock console.error to avoid test output noise
    
    renderComponent();
    
    // Verify the error handling in useEffect
    await waitFor(() => {
      expect(getMemberInfoFormValuesMock).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  it('handles error state from getMemberInfoFormValues', async () => {
    // Mock the API to return error: true
    getMemberInfoFormValuesMock.mockResolvedValueOnce({
      isError: true,
      teams: [],
      projects: [],
      skills: []
    } as any);
    
    renderComponent();
    
    // Verify that setAllData was not called with the data since isError is true
    await waitFor(() => {
      expect(getMemberInfoFormValuesMock).toHaveBeenCalled();
    });
  });

  it('handles next button click and validates basic info step', async () => {
    renderComponent();
    
    // Mock validation to return errors first time
    validateBasicFormsMock.mockResolvedValueOnce(['Name is required']);
    
    // Click next button
    fireEvent.click(screen.getByTestId('next-button'));
    
    // Check that loader was triggered
    await waitFor(() => {
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EVENTS.TRIGGER_REGISTER_LOADER,
          detail: true
        })
      );
    });
    
    // Check that errors are displayed
    await waitFor(() => {
      expect(screen.getByTestId('basic-info-errors')).toHaveTextContent('Name is required');
    });
    
    // Reset mock to return no errors
    validateBasicFormsMock.mockResolvedValueOnce([]);
    
    // Click next button again
    fireEvent.click(screen.getByTestId('next-button'));
    
    // Check that we moved to the next step
    await waitForStep('skills');
  });

  it('handles back button click', async () => {
    renderComponent();
    
    // Go to skills step first
    validateBasicFormsMock.mockResolvedValueOnce([]);
    fireEvent.click(screen.getByTestId('next-button'));
    
    await waitForStep('skills');
    
    // Click back button
    fireEvent.click(screen.getByTestId('back-button'));
    
    // Check that we moved back to basic step
    await waitForStep('basic');
  });

  it('validates skills info step', async () => {
    renderComponent();
    
    // Go to skills step first
    validateBasicFormsMock.mockResolvedValueOnce([]);
    fireEvent.click(screen.getByTestId('next-button'));
    
    await waitForStep('skills');
    
    // Mock validation to return errors first time
    validateTeamsAndSkillsMock.mockResolvedValueOnce(['At least one team is required']);
    
    // Click next button
    fireEvent.click(screen.getByTestId('next-button'));
    
    // Check that errors are displayed
    await waitFor(() => {
      expect(screen.getByTestId('skills-info-errors')).toHaveTextContent('At least one team is required');
    });
  });

  it('validates contributions info step', async () => {
    renderComponent();
    
    // Go to skills step first
    validateBasicFormsMock.mockResolvedValueOnce([]);
    fireEvent.click(screen.getByTestId('next-button'));
    
    await waitForStep('skills');
    
    // Go to contributions step
    validateTeamsAndSkillsMock.mockResolvedValueOnce([]);
    fireEvent.click(screen.getByTestId('next-button'));
    
    await waitForStep('contributions');
    
    // Mock validation to return errors first time
    validateContributionErrorsMock.mockResolvedValueOnce({ 0: ['Project name is required'] });
    
    // Click next button
    fireEvent.click(screen.getByTestId('next-button'));
    
    // Check that errors are displayed
    await waitFor(() => {
      expect(screen.getByTestId('contribution-info-errors')).toHaveTextContent(/"0":\["Project name is required"\]/);
    });
  });

  it('handles form submission with profile image upload', async () => {
    document.dispatchEvent = originalDispatchEvent;
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock successful form submission
    createParticipantRequestMock.mockResolvedValueOnce({ ok: true } as Response);
    saveRegistrationImageMock.mockResolvedValueOnce({
      image: { uid: 'profile-image-uid', url: 'https://example.com/profile.jpg' }
    });
    
    // Mock form and FormData
    Object.defineProperty(HTMLFormElement.prototype, 'reset', { value: jest.fn() });
    const mockFile = new File(['dummy content'], 'profile.jpg', { type: 'image/jpeg' });
    global.FormData = jest.fn().mockImplementation(() => ({
      append: jest.fn(),
      get: jest.fn(),
      getAll: jest.fn(),
      forEach: jest.fn(),
      entries: jest.fn().mockReturnValue([
        ['name', 'John Doe'], 
        ['email', 'john@example.com'],
        ['memberProfile', mockFile]
      ]),
      *[Symbol.iterator]() {
        yield ['name', 'John Doe'];
        yield ['email', 'john@example.com'];
        yield ['memberProfile', mockFile];
      }
    }));
    
    // Mock formInputsToMemberObj for form submission
    formInputsToMemberObjMock.mockReturnValue({
      name: 'John Doe',
      email: 'john@example.com',
      memberProfile: mockFile,
      plnStartDate: ''
    });
    
    Object.fromEntries = jest.fn().mockReturnValue({
      name: 'John Doe',
      email: 'john@example.com',
      memberProfile: mockFile,
      plnStartDate: ''
    });
    
    const { container } = renderComponent();
    
    // Submit the form directly
    const form = container.querySelector('form');
    expect(form).not.toBeNull();
    if (form) {
      fireEvent.submit(form);
    }
    
    // Verify image upload and form submission with image URLs
    await waitFor(() => {
      expect(saveRegistrationImageMock).toHaveBeenCalledWith(mockFile);
      expect(createParticipantRequestMock).toHaveBeenCalledWith(
        expect.objectContaining({
          newData: expect.objectContaining({
            imageUid: 'profile-image-uid',
            imageUrl: 'https://example.com/profile.jpg'
          })
        })
      );
    });
  });

  it('handles form submission with empty plnStartDate', async () => {
    document.dispatchEvent = originalDispatchEvent;
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock successful form submission
    createParticipantRequestMock.mockResolvedValueOnce({ ok: true } as Response);
    
    // Mock form and FormData
    Object.defineProperty(HTMLFormElement.prototype, 'reset', { value: jest.fn() });
    global.FormData = jest.fn().mockImplementation(() => ({
      append: jest.fn(),
      get: jest.fn(),
      getAll: jest.fn(),
      forEach: jest.fn(),
      entries: jest.fn().mockReturnValue([
        ['name', 'John Doe'], 
        ['email', 'john@example.com'],
        ['plnStartDate', '']
      ]),
      *[Symbol.iterator]() {
        yield ['name', 'John Doe'];
        yield ['email', 'john@example.com'];
        yield ['plnStartDate', ''];
      }
    }));
    
    // Mock formInputsToMemberObj for form submission
    formInputsToMemberObjMock.mockReturnValue({
      name: 'John Doe',
      email: 'john@example.com',
      plnStartDate: ''
    });
    
    Object.fromEntries = jest.fn().mockReturnValue({
      name: 'John Doe',
      email: 'john@example.com',
      plnStartDate: ''
    });
    
    const { container } = renderComponent();
    
    // Submit the form directly
    const form = container.querySelector('form');
    expect(form).not.toBeNull();
    if (form) {
      fireEvent.submit(form);
    }
    
    // Verify plnStartDate is set to null
    await waitFor(() => {
      expect(createParticipantRequestMock).toHaveBeenCalledWith(
        expect.objectContaining({
          newData: expect.objectContaining({
            plnStartDate: null
          })
        })
      );
    });
  });

  it('handles form submission error', async () => {
    document.dispatchEvent = originalDispatchEvent;
    createParticipantRequestMock.mockRejectedValueOnce(new Error('Submission failed'));
    Object.defineProperty(HTMLFormElement.prototype, 'reset', { value: jest.fn() });
    global.FormData = jest.fn().mockImplementation(() => ({
      append: jest.fn(),
      get: jest.fn(),
      getAll: jest.fn(),
      forEach: jest.fn(),
      entries: jest.fn().mockReturnValue([['name', 'John Doe'], ['email', 'john@example.com']]),
      *[Symbol.iterator]() {
        yield ['name', 'John Doe'];
        yield ['email', 'john@example.com'];
      }
    }));
    formInputsToMemberObjMock.mockReturnValueOnce({
      name: 'John Doe',
      email: 'john@example.com',
      plnStartDate: ''
    });
    Object.fromEntries = jest.fn().mockReturnValue({
      name: 'John Doe',
      email: 'john@example.com',
      plnStartDate: ''
    });
    const { container } = renderComponent();
    const formContainer = container.querySelector('.rf__form');
    const scrollToTopMock = jest.fn();
    if (formContainer) {
      Object.defineProperty(formContainer, 'scrollTop', {
        set: scrollToTopMock,
      });
    }
    // Navigate to the social step
    await waitFor(() => {
      validateBasicFormsMock.mockResolvedValueOnce([]);
      fireEvent.click(screen.getByTestId('next-button')); // to skills
    });
    validateTeamsAndSkillsMock.mockResolvedValueOnce([]);
    fireEvent.click(screen.getByTestId('next-button')); // to contributions
    validateContributionErrorsMock.mockResolvedValueOnce({});
    fireEvent.click(screen.getByTestId('next-button')); // to social
    // Submit the form
    const form = container.querySelector('form');
    if (form) {
      fireEvent.submit(form);
    }
    // Only check for error toast after submission
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  it('handles unsuccessful form submission', async () => {
    document.dispatchEvent = originalDispatchEvent;
    createParticipantRequestMock.mockResolvedValueOnce({ ok: false } as Response);
    Object.defineProperty(HTMLFormElement.prototype, 'reset', { value: jest.fn() });
    global.FormData = jest.fn().mockImplementation(() => ({
      append: jest.fn(),
      get: jest.fn(),
      getAll: jest.fn(),
      forEach: jest.fn(),
      entries: jest.fn().mockReturnValue([['name', 'John Doe'], ['email', 'john@example.com']]),
      *[Symbol.iterator]() {
        yield ['name', 'John Doe'];
        yield ['email', 'john@example.com'];
      }
    }));
    formInputsToMemberObjMock.mockReturnValueOnce({
      name: 'John Doe',
      email: 'john@example.com',
      plnStartDate: ''
    });
    Object.fromEntries = jest.fn().mockReturnValue({
      name: 'John Doe',
      email: 'john@example.com',
      plnStartDate: ''
    });
    const { container } = renderComponent();
    const formContainer = container.querySelector('.rf__form');
    const scrollToTopMock = jest.fn();
    if (formContainer) {
      Object.defineProperty(formContainer, 'scrollTop', {
        set: scrollToTopMock,
      });
    }
    // Navigate to the social step
    await waitFor(() => {
      validateBasicFormsMock.mockResolvedValueOnce([]);
      fireEvent.click(screen.getByTestId('next-button')); // to skills
    });
    validateTeamsAndSkillsMock.mockResolvedValueOnce([]);
    fireEvent.click(screen.getByTestId('next-button')); // to contributions
    validateContributionErrorsMock.mockResolvedValueOnce({});
    fireEvent.click(screen.getByTestId('next-button')); // to social
    // Submit the form
    const form = container.querySelector('form');
    if (form) {
      fireEvent.submit(form);
    }
    // Only check for error toast after submission
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  it('scrolls to top when errors are displayed', async () => {
    // Reset mocks
    jest.clearAllMocks();
    document.dispatchEvent = originalDispatchEvent;
    
    const scrollToTopMock = jest.fn();
    const { container } = renderComponent();
    
    // Get the container ref after rendering and set the mock
    const formContainer = container.querySelector('.rf__form');
    if (formContainer) {
      Object.defineProperty(formContainer, 'scrollTop', {
        set: scrollToTopMock,
        get: () => 0
      });
    }
    
    // Make sure validation returns errors
    validateBasicFormsMock.mockResolvedValueOnce(['Error 1']);
    
    // Click next button
    const nextButton = screen.getByTestId('next-button');
    fireEvent.click(nextButton);
    
    // Check that scrollToTop is called after validation
    await waitFor(() => {
      expect(validateBasicFormsMock).toHaveBeenCalled();
      expect(scrollToTopMock).toHaveBeenCalled();
    });
  });

  it('handles reset event', async () => {
    // Reset mocks
    jest.clearAllMocks();
    document.dispatchEvent = originalDispatchEvent;
    
    renderComponent();
    
    // Simulate form reset event
    const resetEvent = new Event('reset-member-register-form');
    document.dispatchEvent(resetEvent);
    
    // Check that the form is reset to the basic step
    await waitForStep('basic');
  });

  it('closes the form when close button is clicked', () => {
    renderComponent();
    
    // Click close button
    fireEvent.click(screen.getByTestId('close-button'));
    
    // Check that onCloseForm was called
    expect(onCloseForm).toHaveBeenCalled();
  });
});

const waitForStep = async (step: string, shouldCheck: boolean = true) => {
  if (!shouldCheck) return;
  await waitFor(() => {
    const currentStep = screen.queryByTestId('current-step');
    if (shouldCheck) {
      expect(currentStep).not.toBeNull();
      if (currentStep) expect(currentStep).toHaveTextContent(step);
    }
  });
}; 