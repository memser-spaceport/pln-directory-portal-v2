import { ReactNode } from 'react';
import { toast as rtToast, ToastOptions, TypeOptions } from 'react-toastify';

import { Data, Toast } from '../components/Toast';

type ToastFn = (content: ReactNode, options?: ToastOptions<Data>) => void;
type ToastWithMethods = ToastFn & Record<TypeOptions, ToastFn>;

export const toast = ((content: ReactNode, options?: ToastOptions<Data>) => {
  rtToast<Data>((props) => <Toast {...props}>{content}</Toast>, options);
}) as ToastWithMethods;

(['info', 'success', 'warning', 'error', 'default'] as TypeOptions[]).forEach((type) => {
  toast[type] = (content: ReactNode, options?: ToastOptions<Data>) => {
    toast(content, { ...options, type });
  };
});
