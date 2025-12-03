'use client';

import { useToggle } from 'react-use';
import { PropsWithChildren, useMemo, useState } from 'react';

import { ContactSupportContext } from './ContactSupportContext';

export function ContactSupportContextProvider(props: PropsWithChildren<{}>) {
  const { children } = props;

  const [open, toggleOpen] = useToggle(false);
  const [metadata, setMetadata] = useState<Record<string, string>>();

  function openModal(metadata?: Record<string, string>) {
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
