'use client';

import { useContext } from 'react';
import { ContactSupportContext } from './ContactSupportContext';

export function useContactSupportContext() {
  return useContext(ContactSupportContext);
}
