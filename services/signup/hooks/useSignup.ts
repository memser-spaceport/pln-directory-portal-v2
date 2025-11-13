import { useMutation } from '@tanstack/react-query';
import { signUpFormAction } from '@/app/actions/sign-up.actions';
import { toast } from '@/components/core/ToastContainer';

async function mutation({ payload, reCAPTCHAToken }: { payload: any; reCAPTCHAToken: string | undefined }) {
  return await signUpFormAction(payload, reCAPTCHAToken);
}

export function useSignup() {
  return useMutation({
    mutationFn: mutation,
  });
}

interface SignupV2Params {
  uniqueIdentifier: string;
  role: string;
  isTeamNew: boolean;
  team: {
    uid?: string;
    name?: string;
    website?: string;
  };
  newData: {
    name: string;
    email: string;
    linkedinHandler?: string;
    githubHandler?: string;
    bio?: string;
    imageUid?: string;
    imageUrl?: string;
    isSubscribedToNewsletter?: boolean;
    isUserConsent?: boolean;
  };
  signUpSource?: string;
  signUpMedium?: string;
  signUpCampaign?: string;
}

async function mutationV2(params: SignupV2Params) {
  const payload = {
    participantType: 'MEMBER',
    uniqueIdentifier: params.uniqueIdentifier,
    role: params.role,
    isTeamNew: params.isTeamNew,
    team: params.team,
    newData: params.newData,
    ...(params.signUpSource && { signUpSource: params.signUpSource }),
    ...(params.signUpMedium && { signUpMedium: params.signUpMedium }),
    ...(params.signUpCampaign && { signUpCampaign: params.signUpCampaign }),
  };

  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/participants-request/member`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (response?.ok) {
    const data = await response.json();
    toast.success('Sign up request submitted successfully');
    return { success: true, data };
  } else {
    const errorData = await response.json().catch(() => ({}));
    toast.error(errorData?.message || 'Failed to submit sign up request');
    return { success: false, message: errorData?.message || 'Failed to submit sign up request' };
  }
}

export function useSignupV2() {
  return useMutation({
    mutationFn: mutationV2,
  });
}
