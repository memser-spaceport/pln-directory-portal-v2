'use client';

import { useEffect } from 'react';

const LOGOUT_CHANNEL_NAME = 'logout';

// Reference to native BroadcastChannel API
const NativeBroadcastChannel = typeof window !== 'undefined' ? window.BroadcastChannel : undefined;

/**
 * Fallback for browsers that don't support BroadcastChannel
 * Uses localStorage events for cross-tab communication
 */
class LocalStorageFallback {
  private key: string;
  public onmessage: ((event: { data: string }) => void) | null = null;

  constructor(name: string) {
    this.key = `broadcast_${name}`;
    this.setupListener();
  }

  private setupListener() {
    if (typeof window === 'undefined') return;

    window.addEventListener('storage', (e) => {
      if (e.key === this.key && e.newValue && this.onmessage) {
        this.onmessage({ data: e.newValue });
      }
    });
  }

  postMessage(message: string) {
    if (typeof window === 'undefined') return;

    // Set and immediately remove to trigger storage event in other tabs
    localStorage.setItem(this.key, message);
    localStorage.removeItem(this.key);
  }

  close() {
    // No cleanup needed for localStorage fallback
  }
}

type LogoutChannel = BroadcastChannel | LocalStorageFallback | null;

/**
 * Creates a BroadcastChannel for logout synchronization across tabs
 * Falls back to localStorage for unsupported browsers
 */
export const createLogoutChannel = (): LogoutChannel => {
  if (typeof window === 'undefined') return null;

  try {
    // Try native BroadcastChannel first
    if (NativeBroadcastChannel) {
      return new NativeBroadcastChannel(LOGOUT_CHANNEL_NAME);
    }

    // Fallback to localStorage-based communication
    console.log('BroadcastChannel not supported, using localStorage fallback');
    return new LocalStorageFallback(LOGOUT_CHANNEL_NAME);
  } catch (err) {
    console.log('Failed to create logout channel:', err);
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

      // Close native BroadcastChannel if applicable
      if (NativeBroadcastChannel && channel instanceof NativeBroadcastChannel) {
        channel.close();
      }
    };
  }

  // Return cleanup function
  return () => {
    if (NativeBroadcastChannel && channel instanceof NativeBroadcastChannel) {
      channel.close();
    }
  };
};

/**
 * Broadcast logout to all tabs
 */
export const broadcastLogout = () => {
  const channel = createLogoutChannel();
  if (channel) {
    channel.postMessage('logout');

    // Close native BroadcastChannel after sending
    if (NativeBroadcastChannel && channel instanceof NativeBroadcastChannel) {
      channel.close();
    }
  }
};

/**
 * LogoutBroadcastChannel - Syncs logout across browser tabs
 *
 * This component sets up a BroadcastChannel listener that triggers
 * logout in all open tabs when one tab logs out.
 * Falls back to localStorage events for browsers without BroadcastChannel support.
 */
export function BroadcastChannel() {
  useEffect(() => {
    const cleanup = logoutAllTabs();
    return cleanup;
  }, []);

  return null;
}
