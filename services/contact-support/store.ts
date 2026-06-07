import { create } from 'zustand';
import { Metadata } from '@/components/ContactSupport/types';

type DialogParam = 'contactSupport' | 'askQuestion' | 'giveFeedback' | 'shareIdea' | 'reportBug';

const DIALOG_PARAM_VALUES = {
  contactSupport: 'contactSupport',
  askQuestion: 'askQuestion',
  giveFeedback: 'giveFeedback',
  shareIdea: 'shareIdea',
  reportBug: 'reportBug',
} as const;

export const DIALOG_TO_TOPIC_MAP: Record<string, string> = {
  [DIALOG_PARAM_VALUES.contactSupport]: 'Contact support',
  [DIALOG_PARAM_VALUES.askQuestion]: 'Ask a question',
  [DIALOG_PARAM_VALUES.giveFeedback]: 'Give feedback',
  [DIALOG_PARAM_VALUES.shareIdea]: 'Share an idea',
  [DIALOG_PARAM_VALUES.reportBug]: 'Report a bug',
};

interface ContactSupportState {
  readonly open: boolean;
  readonly metadata?: Metadata;
  readonly topic?: string;
  readonly prefillMessage?: string;
  readonly actions: {
    openModal: (metadata?: Metadata, dialogParam?: DialogParam, prefillMessage?: string) => void;
    closeModal: () => void;
    updateTopic: (topic: string) => void;
  };
}

export const useContactSupportStore = create<ContactSupportState>((set) => ({
  open: false,
  metadata: undefined,
  topic: undefined,
  prefillMessage: undefined,
  actions: {
    openModal: (metadata, dialogParam = 'contactSupport', prefillMessage) =>
      set({
        open: true,
        metadata,
        topic: DIALOG_TO_TOPIC_MAP[dialogParam],
        prefillMessage,
      }),
    closeModal: () =>
      set({
        open: false,
        metadata: undefined,
        topic: undefined,
        prefillMessage: undefined,
      }),
    updateTopic: (topic) => set({ topic }),
  },
}));
