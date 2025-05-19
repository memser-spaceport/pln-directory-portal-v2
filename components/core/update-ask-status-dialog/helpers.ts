import * as yup from 'yup';
import { AskCloseReasons, CloseAskForm } from '@/components/core/update-ask-status-dialog/types';

export const closeAskFormSchema = yup.object({
  reason: yup.string().required('Reason is required'),
  resolvedBy: yup
    .object<CloseAskForm['resolvedBy']>()
    .nullable()
    .when('reason', {
      is: (reason: string) => reason === AskCloseReasons.FULLY_ADDRESSED || reason === AskCloseReasons.PARTIALLY_ADDRESSED,
      then: () => yup.object().required('Required'),
      otherwise: () => yup.object().nullable(),
    }),
  comments: yup.string().when('reason', {
    is: (reason: string) => reason === AskCloseReasons.ACTIVE,
    then: () => yup.string(),
    otherwise: () =>
      yup
        .string()
        .required('Required')
        .test('not-only-spaces', 'This field cannot be only spaces', (value) => value != null && value.trim().length > 0),
  }),
  disabled: yup.boolean(),
}) as yup.ObjectSchema<CloseAskForm>;

export const closeAskInitialData: CloseAskForm = {
  reason: AskCloseReasons.ACTIVE,
  resolvedBy: null,
  comments: '',
};
export const REASON_OPTIONS = [
  {
    label: AskCloseReasons.ACTIVE,
    value: AskCloseReasons.ACTIVE,
  },
  {
    label: AskCloseReasons.FULLY_ADDRESSED,
    value: AskCloseReasons.FULLY_ADDRESSED,
  },
  {
    label: AskCloseReasons.PARTIALLY_ADDRESSED,
    value: AskCloseReasons.PARTIALLY_ADDRESSED,
  },
  {
    label: AskCloseReasons.NO_LONGER_NEEDED,
    value: AskCloseReasons.NO_LONGER_NEEDED,
  },
  {
    label: AskCloseReasons.UNADRESSABLE,
    value: AskCloseReasons.UNADRESSABLE,
  },
  {
    label: AskCloseReasons.DUPLICATE,
    value: AskCloseReasons.DUPLICATE,
  },
  {
    label: AskCloseReasons.OTHER,
    value: AskCloseReasons.OTHER,
  },
];

export function getDependantLabel(reason: string) {
  switch (reason) {
    case AskCloseReasons.PARTIALLY_ADDRESSED: {
      return "What's left unresolved?*";
    }
    case AskCloseReasons.FULLY_ADDRESSED:
    case AskCloseReasons.NO_LONGER_NEEDED:
    case AskCloseReasons.UNADRESSABLE:
    case AskCloseReasons.DUPLICATE: {
      return 'Additional information*';
    }
    case AskCloseReasons.OTHER:
    default: {
      return 'Specify other reason(s)*';
    }
  }
}
