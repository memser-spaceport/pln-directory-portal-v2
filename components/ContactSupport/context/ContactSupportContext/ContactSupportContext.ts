'use client';

import { createContext } from 'react';
import { Metadata } from '@/components/ContactSupport/types';

export interface IContactSupportContext {
  open: boolean;
  openModal: (
    metadata?: Metadata,
    dialogParam?: 'contactSupport' | 'askQuestion' | 'giveFeedback' | 'shareIdea' | 'reportBug',
    prefillMessage?: string,
  ) => void;
  closeModal: () => void;
  metadata?: Metadata;
  topic?: string;
  prefillMessage?: string;
  updateTopic: (topic: string) => void;
}

export const ContactSupportContext = createContext<IContactSupportContext>({
  open: false,
  openModal: (
    metadata?: Metadata,
    dialogParam?: 'contactSupport' | 'askQuestion' | 'giveFeedback' | 'shareIdea' | 'reportBug',
    prefillMessage?: string,
  ) => {},
  closeModal: () => {},
  metadata: {},
  topic: undefined,
  prefillMessage: undefined,
  updateTopic: () => {},
});
