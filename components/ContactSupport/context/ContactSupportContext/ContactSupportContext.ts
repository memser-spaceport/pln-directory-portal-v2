'use client';

import { createContext } from 'react';
import { Metadata } from '@/components/ContactSupport/types';

export interface IContactSupportContext {
  open: boolean;
  openModal: (metadata?: Metadata) => void;
  closeModal: () => void;
  metadata?: Metadata;
}

export const ContactSupportContext = createContext<IContactSupportContext>({
  open: false,
  openModal: (metadata?: Metadata) => {},
  closeModal: () => {},
  metadata: {},
});
