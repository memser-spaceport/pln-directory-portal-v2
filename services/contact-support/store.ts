import { create } from 'zustand';
import { Metadata } from '@/components/ContactSupport/types';
import { CONTACT_SUPPORT_TOPICS, type ContactSupportDialogParam } from '@/components/ContactSupport/constants';

type DialogParam = ContactSupportDialogParam;

/**
 * Derived from the topic list rather than typed out beside it — the two used to
 * be parallel lists of the same five things, and a topic added to one but not
 * the other would have been a deep link with no door, or a door with no link.
 */
export const DIALOG_TO_TOPIC_MAP: Record<string, string> = Object.fromEntries(
  CONTACT_SUPPORT_TOPICS.map((topic) => [topic.dialogParam, topic.value]),
);

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
