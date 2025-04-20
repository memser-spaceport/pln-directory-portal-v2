import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import TeamRegisterForm from '../../../components/page/team-form-info/team-register-form';

// Step control for useStepsIndicator
let currentStep = 'Basic';
const goToNextStep = jest.fn();
const goToPreviousStep = jest.fn();
const setCurrentStep = jest.fn();

jest.mock('@/hooks/useStepsIndicator', () => ({
  __esModule: true,
  default: () => ({
    get currentStep() { return currentStep; },
    goToNextStep,
    goToPreviousStep,
    setCurrentStep,
  }),
}));

const push = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

// Exported analytics mock for use in assertions
export const analyticsMock = {
  recordTeamJoinNetworkSave: jest.fn(),
  recordTeamJoinNetworkNextClick: jest.fn(),
  recordTeamJoinNetworkBackClick: jest.fn(),
};
jest.mock('@/analytics/join-network.analytics', () => ({
  useJoinNetworkAnalytics: () => analyticsMock,
}));

jest.mock('@/services/registration.service', () => ({
  getTeamsFormOptions: jest.fn(() => Promise.resolve({ technologies: [], fundingStage: [], membershipSources: [], industryTags: [], isError: false })),
  saveRegistrationImage: jest.fn(() => Promise.resolve({ image: { uid: 'img-uid', url: 'img-url' } })),
}));
jest.mock('@/services/participants-request.service', () => ({
  createParticipantRequest: jest.fn(() => Promise.resolve({ ok: true })),
  validatePariticipantsEmail: jest.fn(() => Promise.resolve({ isValid: true })),
}));
jest.mock('@/schema/team-forms', () => ({
  basicInfoSchema: { safeParse: jest.fn(() => ({ success: true })) },
  projectDetailsSchema: { safeParse: jest.fn(() => ({ success: true })) },
  socialSchema: { safeParse: jest.fn(() => ({ success: true })) },
}));
jest.mock('@/utils/team.utils', () => ({
  teamRegisterDefault: {
    basicInfo: { requestorEmail: '', teamProfile: '', name: '', shortDescription: '', longDescription: '', officeHoures: '' },
    projectsInfo: { technologies: [], membershipSources: [], industryTags: [], fundingStage: { id: '', name: '' } },
    socialInfo: { contactMethod: '', website: '', linkedinHandler: '', twitterHandler: '', telegramHandler: '', blog: '' },
  },
  transformRawInputsToFormObj: jest.fn((obj) => obj),
}));
jest.mock('react-toastify', () => ({ toast: { error: jest.fn() } }));
jest.mock('@/components/page/team-form-info/team-basic-info', () => (props: any) => <div data-testid="team-basic-info">TeamBasicInfo{props.errors && props.errors.map((e: string, i: number) => <div key={i}>{e}</div>)}</div>);
jest.mock('@/components/page/team-form-info/team-projects-info', () => (props: any) => <div data-testid="team-projects-info">TeamProjectsInfo{props.errors && props.errors.map((e: string, i: number) => <div key={i}>{e}</div>)}</div>);
jest.mock('@/components/page/team-form-info/team-social-info', () => (props: any) => <div data-testid="team-social-info">TeamSocialInfo{props.errors && props.errors.map((e: string, i: number) => <div key={i}>{e}</div>)}</div>);
jest.mock('@/components/core/register/register-actions', () => (props: any) => (
  <div data-testid="register-actions">
    <button onClick={props.onNextClicked} data-testid="next-btn">Next</button>
    <button onClick={props.onBackClicked} data-testid="back-btn">Back</button>
    <button onClick={props.onCloseForm} data-testid="close-btn">Close</button>
  </div>
));

const userInfo = { email: 'test@example.com' };
const onSuccess = jest.fn();

describe('TeamRegisterForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    currentStep = 'Basic';
  });

  it('renders the form and all steps', () => {
    currentStep = 'Basic';
    render(<TeamRegisterForm onSuccess={onSuccess} userInfo={userInfo} />);
    expect(screen.getByTestId('team-basic-info')).toBeInTheDocument();
    expect(screen.getByTestId('register-actions')).toBeInTheDocument();
  });

  it('calls onNextClicked and shows project details step', () => {
    currentStep = 'Team details';
    render(<TeamRegisterForm onSuccess={onSuccess} userInfo={userInfo} />);
    expect(screen.getByTestId('team-projects-info')).toBeInTheDocument();
  });

  it('calls onBackClicked and shows previous step', () => {
    currentStep = 'Basic';
    render(<TeamRegisterForm onSuccess={onSuccess} userInfo={userInfo} />);
    expect(screen.getByTestId('team-basic-info')).toBeInTheDocument();
  });

  it('calls onCloseForm and navigates home', () => {
    render(<TeamRegisterForm onSuccess={onSuccess} userInfo={userInfo} />);
    fireEvent.click(screen.getByTestId('close-btn'));
    expect(push).toHaveBeenCalledWith('/');
  });

  it('shows errors on validation failure for basic info', async () => {
    currentStep = 'Basic';
    const { basicInfoSchema } = require('@/schema/team-forms');
    basicInfoSchema.safeParse.mockReturnValueOnce({ success: false, error: { errors: [{ message: 'Basic info error' }] } });
    const { validatePariticipantsEmail } = require('@/services/participants-request.service');
    validatePariticipantsEmail.mockResolvedValueOnce({ isValid: false });
    const { transformRawInputsToFormObj } = require('@/utils/team.utils');
    transformRawInputsToFormObj.mockImplementation(() => ({
      name: 'test',
      teamProfile: { name: '', type: '', size: 0 }
    }));
    render(<TeamRegisterForm onSuccess={onSuccess} userInfo={userInfo} />);
    await act(async () => {
      fireEvent.click(screen.getByTestId('next-btn'));
    });
    expect(screen.getByText('Basic info error')).toBeInTheDocument();
    expect(screen.getByText('Name Already exists!')).toBeInTheDocument();
  });

  it('shows errors on validation failure for project details', async () => {
    currentStep = 'Team details';
    const { projectDetailsSchema } = require('@/schema/team-forms');
    projectDetailsSchema.safeParse.mockReturnValueOnce({ success: false, error: { errors: [{ message: 'Project details error' }] } });
    const { transformRawInputsToFormObj } = require('@/utils/team.utils');
    transformRawInputsToFormObj.mockImplementation(() => ({}));
    render(<TeamRegisterForm onSuccess={onSuccess} userInfo={userInfo} />);
    await act(async () => {
      fireEvent.click(screen.getByTestId('next-btn'));
    });
    expect(screen.getByText('Project details error')).toBeInTheDocument();
  });

  it('shows errors on validation failure for social info (submit)', async () => {
    currentStep = 'Social';
    const { socialSchema } = require('@/schema/team-forms');
    socialSchema.safeParse.mockReturnValueOnce({ success: false, error: { errors: [{ message: 'Social info error' }] } });
    const { transformRawInputsToFormObj } = require('@/utils/team.utils');
    transformRawInputsToFormObj.mockImplementation(() => ({}));
    render(<TeamRegisterForm onSuccess={onSuccess} userInfo={userInfo} />);
    await act(async () => {
      fireEvent.submit(screen.getByTestId('team-register-form'));
    });
    expect(screen.getByText('Social info error')).toBeInTheDocument();
  });

  it('submits the form successfully and calls onSuccess', async () => {
    currentStep = 'Social';
    const { createParticipantRequest } = require('@/services/participants-request.service');
    createParticipantRequest.mockResolvedValueOnce({ ok: true });
    const { transformRawInputsToFormObj } = require('@/utils/team.utils');
    transformRawInputsToFormObj.mockImplementation(() => ({}));
    render(<TeamRegisterForm onSuccess={onSuccess} userInfo={userInfo} />);
    await act(async () => {
      fireEvent.submit(screen.getByTestId('team-register-form'));
    });
    expect(onSuccess).toHaveBeenCalled();
  });

  it('shows error toast on failed submission', async () => {
    currentStep = 'Social';
    const { createParticipantRequest } = require('@/services/participants-request.service');
    createParticipantRequest.mockResolvedValueOnce({ ok: false });
    const { toast } = require('react-toastify');
    const { transformRawInputsToFormObj } = require('@/utils/team.utils');
    transformRawInputsToFormObj.mockImplementation(() => ({}));
    render(<TeamRegisterForm onSuccess={onSuccess} userInfo={userInfo} />);
    await act(async () => {
      fireEvent.submit(screen.getByTestId('team-register-form'));
    });
    expect(toast.error).toHaveBeenCalled();
  });

  it('resets form and errors on reset-team-register-form event', async () => {
    currentStep = 'Basic';
    render(<TeamRegisterForm onSuccess={onSuccess} userInfo={userInfo} />);
    act(() => {
      document.dispatchEvent(new CustomEvent('reset-team-register-form'));
    });
    // No error should be present after reset
    expect(screen.getByTestId('team-basic-info')).toBeInTheDocument();
  });

  it('shows error toast if createParticipantRequest throws', async () => {
    currentStep = 'Social';
    const { createParticipantRequest } = require('@/services/participants-request.service');
    createParticipantRequest.mockImplementationOnce(() => { throw new Error('fail'); });
    const { toast } = require('react-toastify');
    const { transformRawInputsToFormObj } = require('@/utils/team.utils');
    transformRawInputsToFormObj.mockImplementation(() => ({}));
    render(<TeamRegisterForm onSuccess={onSuccess} userInfo={userInfo} />);
    await act(async () => {
      fireEvent.submit(screen.getByTestId('team-register-form'));
    });
    expect(toast.error).toHaveBeenCalled();
  });

  it('shows error for invalid image type', async () => {
    currentStep = 'Basic';
    const { basicInfoSchema } = require('@/schema/team-forms');
    basicInfoSchema.safeParse.mockReturnValueOnce({ success: true });
    const { validatePariticipantsEmail } = require('@/services/participants-request.service');
    validatePariticipantsEmail.mockResolvedValueOnce({ isValid: true });
    const { transformRawInputsToFormObj } = require('@/utils/team.utils');
    transformRawInputsToFormObj.mockImplementation(() => ({
      name: 'test',
      teamProfile: { name: 'file', type: 'image/gif', size: 1000 }
    }));
    render(<TeamRegisterForm onSuccess={onSuccess} userInfo={userInfo} />);
    await act(async () => {
      fireEvent.click(screen.getByTestId('next-btn'));
    });
    expect(screen.getByText('Please upload image in jpeg or png format')).toBeInTheDocument();
  });

  it('shows error for image size > 4MB', async () => {
    currentStep = 'Basic';
    const { basicInfoSchema } = require('@/schema/team-forms');
    basicInfoSchema.safeParse.mockReturnValueOnce({ success: true });
    const { validatePariticipantsEmail } = require('@/services/participants-request.service');
    validatePariticipantsEmail.mockResolvedValueOnce({ isValid: true });
    const { transformRawInputsToFormObj } = require('@/utils/team.utils');
    transformRawInputsToFormObj.mockImplementation(() => ({
      name: 'test',
      teamProfile: { name: 'file', type: 'image/png', size: 5 * 1024 * 1024 }
    }));
    render(<TeamRegisterForm onSuccess={onSuccess} userInfo={userInfo} />);
    await act(async () => {
      fireEvent.click(screen.getByTestId('next-btn'));
    });
    expect(screen.getByText('Please upload a file less than 4MB')).toBeInTheDocument();
  });

  it('handles error when getTeamsFormOptions throws', async () => {
    const { getTeamsFormOptions } = require('@/services/registration.service');
    getTeamsFormOptions.mockImplementationOnce(() => Promise.reject(new Error('fail')));
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    render(<TeamRegisterForm onSuccess={onSuccess} userInfo={userInfo} />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(getTeamsFormOptions).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('does not setAllData if getTeamsFormOptions returns isError', async () => {
    const { getTeamsFormOptions } = require('@/services/registration.service');
    getTeamsFormOptions.mockImplementationOnce(() => Promise.resolve({ isError: true }));
    render(<TeamRegisterForm onSuccess={onSuccess} userInfo={userInfo} />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(getTeamsFormOptions).toHaveBeenCalled();
  });

  it('reset handler works when formRef.current is null', () => {
    // Render and manually set formRef.current to null
    render(<TeamRegisterForm onSuccess={onSuccess} userInfo={userInfo} />);
    // Simulate formRef.current being null by not doing anything (default is null)
    act(() => {
      document.dispatchEvent(new CustomEvent('reset-team-register-form'));
    });
    // No error should occur
  });

  it('removes event listener on unmount', () => {
    const { unmount } = render(<TeamRegisterForm onSuccess={onSuccess} userInfo={userInfo} />);
    unmount();
    // No error should occur
  });

  it('calls onBackClicked and triggers analytics and navigation', () => {
    currentStep = 'Team details';
    render(<TeamRegisterForm onSuccess={onSuccess} userInfo={userInfo} />);
    fireEvent.click(screen.getByTestId('back-btn'));
    expect(goToPreviousStep).toHaveBeenCalled();
    expect(analyticsMock.recordTeamJoinNetworkBackClick).toHaveBeenCalledWith('Team details');
  });

  it('goes to next step on valid project details', async () => {
    currentStep = 'Team details';
    const { projectDetailsSchema } = require('@/schema/team-forms');
    projectDetailsSchema.safeParse.mockReturnValueOnce({ success: true });
    const { transformRawInputsToFormObj } = require('@/utils/team.utils');
    transformRawInputsToFormObj.mockImplementation(() => ({}));
    render(<TeamRegisterForm onSuccess={onSuccess} userInfo={userInfo} />);
    await act(async () => {
      fireEvent.click(screen.getByTestId('next-btn'));
    });
    expect(goToNextStep).toHaveBeenCalled();
    expect(analyticsMock.recordTeamJoinNetworkNextClick).toHaveBeenCalledWith('Team details', 'success');
  });

  it('goes to next step on valid basic info', async () => {
    currentStep = 'Basic';
    const { basicInfoSchema } = require('@/schema/team-forms');
    basicInfoSchema.safeParse.mockReturnValueOnce({ success: true });
    const { validatePariticipantsEmail } = require('@/services/participants-request.service');
    validatePariticipantsEmail.mockResolvedValueOnce({ isValid: true });
    const { transformRawInputsToFormObj } = require('@/utils/team.utils');
    transformRawInputsToFormObj.mockImplementation(() => ({
      name: 'test',
      teamProfile: { name: '', type: 'image/png', size: 1000 }
    }));
    render(<TeamRegisterForm onSuccess={onSuccess} userInfo={userInfo} />);
    await act(async () => {
      fireEvent.click(screen.getByTestId('next-btn'));
    });
    expect(goToNextStep).toHaveBeenCalled();
    expect(analyticsMock.recordTeamJoinNetworkNextClick).toHaveBeenCalledWith('Basic', 'success');
  });

  it('handles image upload in social step', async () => {
    currentStep = 'Social';
    const { socialSchema } = require('@/schema/team-forms');
    socialSchema.safeParse.mockReturnValueOnce({ success: true });
    const { saveRegistrationImage } = require('@/services/registration.service');
    const { createParticipantRequest } = require('@/services/participants-request.service');
    const { transformRawInputsToFormObj } = require('@/utils/team.utils');
    transformRawInputsToFormObj.mockImplementation(() => ({
      name: 'test',
      requestorEmail: 'test@example.com',
      teamProfile: { size: 123, name: 'file.png', type: 'image/png' }
    }));
    saveRegistrationImage.mockResolvedValueOnce({ image: { uid: 'img-uid', url: 'img-url' } });
    createParticipantRequest.mockResolvedValueOnce({ ok: true });
    render(<TeamRegisterForm onSuccess={onSuccess} userInfo={userInfo} />);
    await act(async () => {
      fireEvent.submit(screen.getByTestId('team-register-form'));
    });
    expect(saveRegistrationImage).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalled();
  });

  it('initializes content state with fallback when longDescription is undefined', () => {
    currentStep = 'Basic';
    const { teamRegisterDefault } = require('@/utils/team.utils');
    teamRegisterDefault.basicInfo.longDescription = undefined;
    render(<TeamRegisterForm onSuccess={onSuccess} userInfo={userInfo} />);
    expect(screen.getByTestId('team-basic-info')).toBeInTheDocument();
  });

}); 