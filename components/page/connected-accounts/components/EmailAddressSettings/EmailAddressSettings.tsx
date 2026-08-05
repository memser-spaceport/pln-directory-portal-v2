'use client';

import { useEffect } from 'react';
import Cookies from 'js-cookie';

import { EditButton } from '@/components/common/profile/EditButton';
import { toast } from '@/components/core/ToastContainer';
import { authEvents } from '@/components/core/login/utils';
import { useAuthAnalytics } from '@/analytics/auth.analytics';
import { updateUserDirectoryEmail } from '@/services/members.service';
import { decodeToken } from '@/utils/auth.utils';
import { getAnalyticsUserInfo } from '@/utils/common.utils';
import { IUserInfo } from '@/types/shared.types';

import s from './EmailAddressSettings.module.scss';

interface Props {
  userInfo: IUserInfo;
}

/**
 * Lets a member change the email address they sign in with.
 *
 * This control used to live inline in the Member Profile's "Edit Contact Details" form,
 * behind an unlabeled pencil icon next to a disabled input. It's moved here, into Account
 * Settings, next to Connected Accounts, where sign-in/identity controls belong and are
 * easier to find. The "Edit" affordance reuses the same labeled icon+text button used for
 * every other edit action across member/team profiles, so it reads as editable at a glance.
 */
export const EmailAddressSettings = ({ userInfo }: Props) => {
  const analytics = useAuthAnalytics();
  const email = userInfo.email ?? '';
  const uid = userInfo.uid ?? '';

  const onEditClicked = () => {
    analytics.onUpdateEmailClicked(getAnalyticsUserInfo(userInfo));

    const authToken = Cookies.get('authToken');
    if (!authToken) {
      return;
    }

    authEvents.emit('auth:link-account', 'updateEmail');
  };

  useEffect(() => {
    async function updateUserEmail(data: { newEmail: string }) {
      try {
        const { newEmail } = data;
        const oldAccessToken = Cookies.get('authToken');
        if (!oldAccessToken) {
          return;
        }
        const header = {
          Authorization: `Bearer ${JSON.parse(oldAccessToken)}`,
          'Content-Type': 'application/json',
        };
        if (newEmail === email) {
          analytics.onUpdateSameEmailProvided({ newEmail, oldEmail: email });
          toast.error('New and current email cannot be same');
          return;
        }
        const result = await updateUserDirectoryEmail({ newEmail }, uid, header);

        const { refreshToken, accessToken, userInfo: newUserInfo } = result;
        if (refreshToken && accessToken) {
          const accessTokenExpiry = decodeToken(accessToken);
          const refreshTokenExpiry = decodeToken(refreshToken);
          Cookies.set('authToken', JSON.stringify(accessToken), {
            expires: new Date(accessTokenExpiry.exp * 1000),
            domain: process.env.COOKIE_DOMAIN || '',
          });
          Cookies.set('refreshToken', JSON.stringify(refreshToken), {
            expires: new Date(refreshTokenExpiry.exp * 1000),
            domain: process.env.COOKIE_DOMAIN || '',
          });
          Cookies.set('userInfo', JSON.stringify(newUserInfo), {
            expires: new Date(refreshTokenExpiry.exp * 1000),
            domain: process.env.COOKIE_DOMAIN || '',
          });
          document.dispatchEvent(new CustomEvent('app-loader-status'));
          analytics.onUpdateEmailSuccess({ newEmail, oldEmail: email });
          toast.success('Email Updated Successfully');
          window.location.reload();
        }
      } catch {
        analytics.onUpdateEmailFailure({ newEmail: data.newEmail, oldEmail: email });
        document.dispatchEvent(new CustomEvent('app-loader-status'));
        toast.error('Email Update Failed');
      }
    }

    const unsubscribe = authEvents.on('auth:update-email', updateUserEmail);
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={s.root}>
      <h5 className={s.title}>Email Address</h5>
      <div className={s.card}>
        <span className={s.value} title={email}>
          {email}
        </span>
        <EditButton onClick={onEditClicked} />
      </div>
      <p className={s.hint}>You sign in with this address. Changing it changes how you sign in.</p>
    </div>
  );
};
