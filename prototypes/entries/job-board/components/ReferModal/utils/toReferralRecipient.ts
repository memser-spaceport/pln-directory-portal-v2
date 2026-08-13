import { IJobReferralRecipient } from '@/types/jobs.types';

import { RecipientOption } from '../types';

import { isEmailAddress } from './isEmailAddress';

/** The picker's options carry either a member uid or a typed address; the API takes
 *  both, and resolves member addresses itself so the browser never holds them. */
export function toReferralRecipient(option: RecipientOption): IJobReferralRecipient {
  if (option.isEmail || isEmailAddress(option.value)) {
    return { email: option.value };
  }

  return { memberUid: option.value, name: option.label };
}
