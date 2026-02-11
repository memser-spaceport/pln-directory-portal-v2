'use client';
import { createContext } from 'react';

import { PushNotificationsContextValue } from './types';

export const PushNotificationsContext = createContext<PushNotificationsContextValue | null>(null);
