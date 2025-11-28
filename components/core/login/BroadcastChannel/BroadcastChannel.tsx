'use client';

import { useEffect } from 'react';

/**
 * Creates a BroadcastChannel for logout synchronization across tabs
 */
export const createLogoutChannel = () => {
  try {
    return new BroadcastChannel('logout');
  } catch (err) {
    console.log('BroadcastChannel error:', err);
    return null;
  }
};

/**
 * Sets up listener for logout events from other tabs
 */
export const logoutAllTabs = () => {
  const channel = createLogoutChannel();
  if (channel) {
    channel.onmessage = async () => {
      localStorage.clear();
      window.location.reload();
      channel.close();
    };
  }
};

/**
 * BroadcastChannel - Syncs logout across browser tabs
 *
 * This component sets up a BroadcastChannel listener that triggers
 * logout in all open tabs when one tab logs out.
 */
export function BroadcastChannel() {
  useEffect(() => {
    logoutAllTabs();
  }, []);

  return null;
}
