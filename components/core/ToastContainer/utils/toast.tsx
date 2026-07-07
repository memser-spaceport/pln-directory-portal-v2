import { ReactNode } from 'react';
import { toast as rtToast, ToastOptions, TypeOptions } from 'react-toastify';

import { Toast } from '../components/Toast';

type ToastFn = (content: ReactNode, options?: ToastOptions) => void;
type ToastWithMethods = ToastFn & Record<TypeOptions, ToastFn>;

export const toast = ((content: ReactNode, options?: ToastOptions) => {
  rtToast((props) => <Toast {...props}>{content}</Toast>, options);
}) as ToastWithMethods;

(['info', 'success', 'warning', 'error', 'default'] as TypeOptions[]).forEach((type) => {
  toast[type] = (content: ReactNode, options?: ToastOptions) => {
    toast(content, { ...options, type });
  };
});
