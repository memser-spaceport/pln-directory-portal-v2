import { TypeOptions } from 'react-toastify';

import { ErrorCircle, InfoCircleIcon, SuccessCircleIcon } from '@/components/icons';

export function getToastIcon(type: TypeOptions) {
  switch (type) {
    case 'success':
      return SuccessCircleIcon;
    case 'error':
      return ErrorCircle;
    default:
      return InfoCircleIcon;
  }
}
