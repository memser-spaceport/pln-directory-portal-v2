import { useContext } from 'react';

import { PushNotificationsContextValue } from './types';

import { PushNotificationsContext } from './PushNotificationsContext';

export function usePushNotificationsContext(): PushNotificationsContextValue {
  const context = useContext(PushNotificationsContext);

  if (!context) {
    throw new Error('usePushNotificationsContext must be used within a PushNotificationsProvider');
  }

  return context;
}
