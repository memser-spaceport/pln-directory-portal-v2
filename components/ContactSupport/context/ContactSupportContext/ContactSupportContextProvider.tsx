'use client';

import { useToggle } from 'react-use';
import { useRouter, useSearchParams } from 'next/navigation';
import { PropsWithChildren, useEffect, useMemo, useState } from 'react';

import { ContactSupportContext } from './ContactSupportContext';
import { Metadata } from '@/components/ContactSupport/types';

const CONTACT_SUPPORT_QUERY_PARAM_NAME = 'dialog';
const CONTACT_SUPPORT_QUERY_PARAM_VALUE = 'contactSupport';

export function ContactSupportContextProvider(props: PropsWithChildren<{}>) {
  const { children } = props;

  const router = useRouter();
  const searchParams = useSearchParams();

  const [open, toggleOpen] = useToggle(false);
  const [metadata, setMetadata] = useState<Metadata>();

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    const dialog = params.get('dialog');

    if (!open && dialog === CONTACT_SUPPORT_QUERY_PARAM_VALUE) {
      toggleOpen(true);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (open) {
      params.set(CONTACT_SUPPORT_QUERY_PARAM_NAME, CONTACT_SUPPORT_QUERY_PARAM_VALUE);
    } else {
      params.delete(CONTACT_SUPPORT_QUERY_PARAM_NAME);
    }

    router.replace(`?${params.toString()}`);
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
