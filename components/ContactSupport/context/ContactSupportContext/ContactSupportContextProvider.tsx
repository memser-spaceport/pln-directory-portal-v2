'use client';

import { useToggle } from 'react-use';
import { PropsWithChildren, useEffect, useMemo, useState } from 'react';

import { ContactSupportContext } from './ContactSupportContext';
import { Metadata } from '@/components/ContactSupport/types';

const CONTACT_SUPPORT_QUERY_PARAM_NAME = 'dialog';
const CONTACT_SUPPORT_QUERY_PARAM_VALUE = 'contactSupport';

export function ContactSupportContextProvider(props: PropsWithChildren<{}>) {
  const { children } = props;

  const [open, toggleOpen] = useToggle(false);
  const [metadata, setMetadata] = useState<Metadata>();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dialog = params.get('dialog');

    if (!open && dialog === CONTACT_SUPPORT_QUERY_PARAM_VALUE) {
      toggleOpen(true);
    }
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);

    if (open) {
      url.searchParams.set(CONTACT_SUPPORT_QUERY_PARAM_NAME, CONTACT_SUPPORT_QUERY_PARAM_VALUE);
    } else {
      url.searchParams.delete(CONTACT_SUPPORT_QUERY_PARAM_NAME);
    }

    window.history.replaceState({}, '', url);
  }, [open]);

  function openModal(metadata?: Metadata) {
    if (metadata) {
      setMetadata(metadata);
    }

    toggleOpen(true);
  }

  function closeModal() {
    toggleOpen(false);
    setMetadata(undefined);
  }

  const value = useMemo(
    () => ({
      open,
      metadata,
      openModal,
      closeModal,
    }),
    [open, metadata],
  );

  return <ContactSupportContext.Provider value={value}>{children}</ContactSupportContext.Provider>;
}
