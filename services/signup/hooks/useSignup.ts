import { useMutation } from '@tanstack/react-query';
import { signUpFormAction } from '@/app/actions/sign-up.actions';

async function mutation({ payload, reCAPTCHAToken }: { payload: any; reCAPTCHAToken: string | undefined }) {
  return await signUpFormAction(payload, reCAPTCHAToken);
}

export function useSignup() {
  return useMutation({
    mutationFn: mutation,
  });
}
