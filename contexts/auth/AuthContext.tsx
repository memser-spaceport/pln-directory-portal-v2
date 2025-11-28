'use client';

import { createContext, useContext, useCallback, useState, ReactNode } from 'react';
import { User } from '@privy-io/react-auth';

// Error types for auth modals
export type AuthErrorType =
  | 'linked_to_another_user'
  | 'exited_link_flow'
  | 'invalid_credentials'
  | 'unexpected_error'
  | 'rejected_access_level'
  | 'email_changed'
  | null;

export interface AuthError {
  type: AuthErrorType;
  message: string;
  description?: string;
  variant: 'regular' | 'access_denied_demo_day';
}

export interface AuthState {
  isLoading: boolean;
  error: AuthError | null;
  linkAccountModalOpen: boolean;
}

export interface AuthActions {
  setLoading: (loading: boolean) => void;
  showError: (error: AuthError) => void;
  clearError: () => void;
  showLinkAccountModal: () => void;
  hideLinkAccountModal: () => void;
}

interface AuthContextValue {
  state: AuthState;
  actions: AuthActions;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const ERROR_MESSAGES: Record<string, AuthError> = {
  linked_to_another_user: {
    type: 'linked_to_another_user',
    message: 'Email already used. Connect social account for login',
    description:
      'The email you provided is already used or linked to another account. If this is your email id, then login with the email id and connect this social account in profile settings page. After that you can use any of your linked accounts for subsequent logins.',
    variant: 'regular',
  },
  unexpected_error: {
    type: 'unexpected_error',
    message: 'We are unable to authenticate you at the moment due to technical issues. Please try again later',
    description: '',
    variant: 'regular',
  },
  rejected_access_level: {
    type: 'rejected_access_level',
    message: 'Your application to join the Protocol Labs network was not approved.',
    description: 'Your application to join the Protocol Labs network was not approved. You may reapply in the future.',
    variant: 'regular',
  },
  default: {
    type: null,
    message: 'Email not available',
    description: 'Your email is either invalid or not available in our directory. Please try again with valid email.',
    variant: 'regular',
  },
};

export function getErrorConfig(errorType: string | null, customConfig?: Partial<AuthError>): AuthError {
  const baseError = ERROR_MESSAGES[errorType || 'default'] || ERROR_MESSAGES.default;
  return { ...baseError, ...customConfig };
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    isLoading: false,
    error: null,
    linkAccountModalOpen: false,
  });

  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, isLoading: loading }));
  }, []);

  const showError = useCallback((error: AuthError) => {
    setState((prev) => ({ ...prev, error, isLoading: false }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const showLinkAccountModal = useCallback(() => {
    setState((prev) => ({ ...prev, linkAccountModalOpen: true }));
  }, []);

  const hideLinkAccountModal = useCallback(() => {
    setState((prev) => ({ ...prev, linkAccountModalOpen: false }));
  }, []);

  const actions: AuthActions = {
    setLoading,
    showError,
    clearError,
    showLinkAccountModal,
    hideLinkAccountModal,
  };

  return <AuthContext.Provider value={{ state, actions }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useAuthState(): AuthState {
  return useAuth().state;
}

export function useAuthActions(): AuthActions {
  return useAuth().actions;
}
