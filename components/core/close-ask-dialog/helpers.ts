import * as yup from 'yup';
import { AskCloseReasons } from '@/components/core/close-ask-dialog/types';

export const closeAskFormSchema = yup.object({
  reason: yup.string().required('Reason is required'),
  resolvedBy: yup.string().required('Resolved by is required'),
  comments: yup.string().required('Required'),
});

export const REASON_OPTIONS = [
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
