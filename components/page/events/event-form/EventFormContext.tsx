'use client';

import { createContext, useContext } from 'react';

export interface EventFormContextValue {
  /** The submit page or the edit page. */
  variant: 'submit' | 'edit';
  /** A request is running: every control is disabled. */
  busy: boolean;
}

const EventFormContext = createContext<EventFormContextValue>({ variant: 'submit', busy: false });

export const EventFormProvider = EventFormContext.Provider;

/** What a form section needs to know about the form around it. */
export const useEventFormContext = () => useContext(EventFormContext);
