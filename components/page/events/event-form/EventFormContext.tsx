'use client';

import { createContext, useContext } from 'react';

export interface EventFormContextValue {
  /** The submit page, or the edit page (which adds Website Link and Social Handles). */
  variant: 'submit' | 'edit';
  /** Signed out: the form asks for a contact email, and the lookups go without a token. */
  signedIn: boolean;
  /** A request is running: every control is disabled. */
  busy: boolean;
}

const EventFormContext = createContext<EventFormContextValue>({ variant: 'submit', signedIn: false, busy: false });

export const EventFormProvider = EventFormContext.Provider;

/** What a form section needs to know about the form around it. */
export const useEventFormContext = () => useContext(EventFormContext);
