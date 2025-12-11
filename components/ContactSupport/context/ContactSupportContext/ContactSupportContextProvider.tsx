'use client';

import { useToggle } from 'react-use';
import { PropsWithChildren, useEffect, useMemo, useState } from 'react';

import { ContactSupportContext } from './ContactSupportContext';
import { Metadata } from '@/components/ContactSupport/types';

export function ContactSupportContextProvider(props: PropsWithChildren<{}>) {
  const { children } = props;

  const [open, toggleOpen] = useToggle(false);
  const [metadata, setMetadata] = useState<Metadata>();

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const dialog = searchParams.get('dialog');

    if (dialog === 'contactSupport') {
      toggleOpen(true);
    }
  }, []);

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
