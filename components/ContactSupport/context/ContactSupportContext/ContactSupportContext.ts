'use client';

import { createContext } from 'react';

export interface IContactSupportContext {
  open: boolean;
  openModal: (metadata?: Record<string, string>) => void;
  closeModal: () => void;
  metadata?: Record<string, string>;
}

export const ContactSupportContext = createContext<IContactSupportContext>({
  open: false,
  openModal: (metadata?: Record<string, string>) => {},
  closeModal: () => {},
  metadata: {},
});
