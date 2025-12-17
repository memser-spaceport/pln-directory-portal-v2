'use client';

import { useToggle } from 'react-use';
import { PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ContactSupportContext } from './ContactSupportContext';
import { Metadata } from '@/components/ContactSupport/types';

const CONTACT_SUPPORT_QUERY_PARAM_NAME = 'dialog';

const DIALOG_PARAM_VALUES = {
  contactSupport: 'contactSupport',
  askQuestion: 'askQuestion',
  giveFeedback: 'giveFeedback',
  shareIdea: 'shareIdea',
  reportBug: 'reportBug',
} as const;

const DIALOG_TO_TOPIC_MAP: Record<string, string> = {
  [DIALOG_PARAM_VALUES.contactSupport]: 'Contact support',
  [DIALOG_PARAM_VALUES.askQuestion]: 'Ask a question',
  [DIALOG_PARAM_VALUES.giveFeedback]: 'Give feedback',
  [DIALOG_PARAM_VALUES.shareIdea]: 'Share an idea',
  [DIALOG_PARAM_VALUES.reportBug]: 'Report a bug',
};

export function ContactSupportContextProvider(props: PropsWithChildren<{}>) {
  const { children } = props;

  const [open, toggleOpen] = useToggle(false);
  const [metadata, setMetadata] = useState<Metadata>();
  const [topic, setTopic] = useState<string>();
  const isInitializedRef = useRef(false);
  const expectedDialogRef = useRef<string | null>(null);

  useEffect(() => {
    if (isInitializedRef.current) return;

    const params = new URLSearchParams(window.location.search);
    const dialog = params.get(CONTACT_SUPPORT_QUERY_PARAM_NAME);

    if (dialog && DIALOG_TO_TOPIC_MAP[dialog]) {
      expectedDialogRef.current = dialog;
      const mappedTopic = DIALOG_TO_TOPIC_MAP[dialog];
      setTopic(mappedTopic);
      toggleOpen(true);
    }
    isInitializedRef.current = true;
  }, [toggleOpen]);

  useEffect(() => {
    if (!isInitializedRef.current) return;

    const url = new URL(window.location.href);
    const currentDialog = url.searchParams.get(CONTACT_SUPPORT_QUERY_PARAM_NAME);

    if (open && topic) {
      const dialogParam = Object.keys(DIALOG_TO_TOPIC_MAP).find((key) => DIALOG_TO_TOPIC_MAP[key] === topic);
      if (dialogParam) {
        if (currentDialog !== dialogParam) {
          expectedDialogRef.current = dialogParam;
          url.searchParams.set(CONTACT_SUPPORT_QUERY_PARAM_NAME, dialogParam);
          window.history.replaceState({}, '', url);
        } else {
          expectedDialogRef.current = dialogParam;
        }
      }
    } else if (!open && currentDialog) {
      expectedDialogRef.current = null;
      url.searchParams.delete(CONTACT_SUPPORT_QUERY_PARAM_NAME);
      window.history.replaceState({}, '', url);
    }
  }, [open, topic]);

  const openModal = useCallback(
    (metadata?: Metadata, dialogParam?: keyof typeof DIALOG_PARAM_VALUES) => {
      if (metadata) {
        setMetadata(metadata);
      }

      const dialog = dialogParam || 'contactSupport';
      if (DIALOG_TO_TOPIC_MAP[DIALOG_PARAM_VALUES[dialog]]) {
        setTopic(DIALOG_TO_TOPIC_MAP[DIALOG_PARAM_VALUES[dialog]]);
      }

      toggleOpen(true);
    },
    [toggleOpen],
  );

  const closeModal = useCallback(() => {
    toggleOpen(false);
    setMetadata(undefined);
    setTopic(undefined);
  }, [toggleOpen]);

  const updateTopic = useCallback((newTopic: string) => {
    setTopic(newTopic);
  }, []);

  const value = useMemo(
    () => ({
      open,
      metadata,
      topic,
      openModal,
      closeModal,
      updateTopic,
    }),
    [open, metadata, topic, openModal, closeModal, updateTopic],
  );

  return <ContactSupportContext.Provider value={value}>{children}</ContactSupportContext.Provider>;
}
