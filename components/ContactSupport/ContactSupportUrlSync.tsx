'use client';

import { useEffect, useRef } from 'react';
import { useContactSupportStore, DIALOG_TO_TOPIC_MAP } from '@/services/contact-support/store';
import { useFeedbackDrawerStore } from '@/services/feedback/store';

const CONTACT_SUPPORT_QUERY_PARAM_NAME = 'dialog';

interface Props {
  isLoggedIn?: boolean;
}

export function ContactSupportUrlSync({ isLoggedIn }: Props) {
  const open = useContactSupportStore((s) => s.open);
  const topic = useContactSupportStore((s) => s.topic);
  const { openModal } = useContactSupportStore((s) => s.actions);
  const { openDrawer: openFeedbackDrawer } = useFeedbackDrawerStore((s) => s.actions);

  const isInitializedRef = useRef(false);
  const expectedDialogRef = useRef<string | null>(null);

  // On mount: read ?dialog= from URL and open modal if valid
  useEffect(() => {
    if (isInitializedRef.current) return;

    const params = new URLSearchParams(window.location.search);
    const dialog = params.get(CONTACT_SUPPORT_QUERY_PARAM_NAME);

    if (dialog === 'giveFeedback' && isLoggedIn) {
      // LAB-2879: members get the AI Apps feedback drawer. The drawer keeps no
      // URL state, so the link parameter is spent here.
      params.delete(CONTACT_SUPPORT_QUERY_PARAM_NAME);
      const query = params.toString();
      window.history.replaceState(
        {},
        '',
        `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`,
      );
      openFeedbackDrawer();
    } else if (dialog && DIALOG_TO_TOPIC_MAP[dialog]) {
      expectedDialogRef.current = dialog;
      openModal(undefined, dialog as Parameters<typeof openModal>[1]);
    }
    isInitializedRef.current = true;
  }, [openModal, openFeedbackDrawer, isLoggedIn]);

  // Sync store state to URL
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

  return null;
}
