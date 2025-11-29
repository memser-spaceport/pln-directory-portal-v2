import { useLinkAccount, useLogin, usePrivy, useLogout, useUpdateAccount } from '@privy-io/react-auth';
import { authEvents } from '../utils';

function usePrivyWrapper() {
  const { authenticated, unlinkEmail, ready, linkGoogle, linkWallet, user, getAccessToken } = usePrivy();

  const { logout } = useLogout({
    onSuccess: () => {
      authEvents.emit('auth:logout-success');
    },
  });

  const { updateEmail } = useUpdateAccount({
    onSuccess: (user, linkMethod, linkedAccount) => {
      authEvents.emit('auth:link-success', { user, linkMethod, linkedAccount });
    },
    onError: (error) => {
      authEvents.emit('auth:link-error', { error });
    },
  });

  /*****  SETUP FOR PRIVY LOGIN POPUP *******/
  const { login } = useLogin({
    onComplete: (user) => {
      authEvents.emit('auth:login-success', { user });
    },
    onError: (error) => {
      if (error === 'linked_to_another_user') {
        // Remove the Privy error modal for 'linked_to_another_user' error
        document.getElementById('privy-dialog')?.remove();
      }
      authEvents.emit('auth:login-error', { error });
    },
  });

  /*****  SETUP FOR PRIVY LINK ACCOUNT POPUP *******/
  const { linkEmail, linkGithub } = useLinkAccount({
    onSuccess: (user, linkMethod, linkedAccount) => {
      authEvents.emit('auth:link-success', { user, linkMethod, linkedAccount });
    },
    onError: (error) => {
      authEvents.emit('auth:link-error', { error });
    },
  });

  return {
    login,
    linkEmail,
    unlinkEmail,
    linkGithub,
    linkGoogle,
    linkWallet,
    logout,
    updateEmail,
    getAccessToken,
    useLogout,
    user,
    authenticated,
    ready,
  };
}

export default usePrivyWrapper;
