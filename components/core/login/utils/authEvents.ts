/**
 * Typed event emitter for auth events
 * Replaces CustomEvents with a type-safe alternative
 */

export type AuthErrorCode =
  | 'unexpected_error'
  | 'rejected_access_level'
  | 'email_not_found'
  | 'linked_to_another_user'
  | 'exited_link_flow'
  | 'invalid_credentials'
  | 'email-changed'
  | '';

export type LinkMethod = 'github' | 'google' | 'siwe' | 'email' | 'updateEmail';

export interface AuthEventMap {
  'auth:init-login': void;
  'auth:login-success': { user: any };
  'auth:login-error': { error: string };
  'auth:link-success': { user: any; linkMethod: string; linkedAccount: any };
  'auth:link-error': { error: string };
  'auth:invalid-email': AuthErrorCode;
  'auth:link-account': LinkMethod;
  'auth:logout': void;
  'auth:logout-success': void;
  'auth:update-email': { newEmail: string };
  'auth:new-accounts': string;
}

type EventCallback<T> = (data: T) => void;

class AuthEventEmitter {
  private listeners: Map<string, Set<EventCallback<any>>> = new Map();

  /**
   * Subscribe to an auth event
   */
  on<K extends keyof AuthEventMap>(event: K, callback: EventCallback<AuthEventMap[K]>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  /**
   * Emit an auth event
   */
  emit<K extends keyof AuthEventMap>(event: K, data?: AuthEventMap[K]): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }

    // Also dispatch as CustomEvent for backward compatibility
    this.dispatchLegacyEvent(event, data);
  }

  /**
   * Dispatch legacy CustomEvent for backward compatibility
   */
  private dispatchLegacyEvent<K extends keyof AuthEventMap>(event: K, data?: AuthEventMap[K]): void {
    const legacyEventMap: Record<string, string> = {
      'auth:init-login': 'privy-init-login',
      'auth:invalid-email': 'auth-invalid-email',
      'auth:link-account': 'auth-link-account',
      'auth:logout': 'init-privy-logout',
      'auth:logout-success': 'privy-logout-success',
      'auth:update-email': 'directory-update-email',
      'auth:new-accounts': 'new-auth-accounts',
    };

    const legacyEvent = legacyEventMap[event];
    if (legacyEvent) {
      document.dispatchEvent(new CustomEvent(legacyEvent, { detail: data }));
    }
  }

  /**
   * Remove all listeners for an event
   */
  off<K extends keyof AuthEventMap>(event: K): void {
    this.listeners.delete(event);
  }

  /**
   * Remove all listeners
   */
  clear(): void {
    this.listeners.clear();
  }
}

// Singleton instance
export const authEvents = new AuthEventEmitter();

/**
 * Checks if a pathname is a demo day subpage (excludes /demoday and /demoday/)
 * @param pathname - The pathname to check
 * @returns true if the pathname matches /demoday/ followed by content
 */
export function isDemoDayScopePage(pathname: string | null | undefined, includeRoot: boolean = false): boolean {
  if (!pathname) return false;
  if (includeRoot) {
    return /^\/demoday\/.+/.test(pathname) || pathname === '/demoday';
  }
  return /^\/demoday\/.+/.test(pathname) && pathname !== '/demoday';
}
