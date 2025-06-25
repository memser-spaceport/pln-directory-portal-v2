'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';
import { getAnalyticsUserInfo, triggerLoader } from '@/utils/common.utils';
import { decodeToken } from '@/utils/auth.utils';
import { useRouter } from 'next/navigation';
import { updateUserDirectoryEmail } from '@/services/members.service';
import { useAuthAnalytics } from '@/analytics/auth.analytics';
import { getUserInfo } from '@/utils/third-party.helper';
function SelfEmailUpdate(props: any) {
  const email = props.email;
  const uid = props.uid;
  const [currentEmail, setCurrentEmail] = useState(email);
  const router = useRouter();
  const userInfo = getUserInfo();
  const analytics = useAuthAnalytics();

  const onEmailEdit = (e: any) => {
    e.stopPropagation();
    e.preventDefault();

    analytics.onUpdateEmailClicked(getAnalyticsUserInfo(userInfo));
    const authToken = Cookies.get('authToken');
    if (!authToken) {
      return;
    }

    document.dispatchEvent(new CustomEvent('auth-link-account', { detail: 'updateEmail' }));
  };

  useEffect(() => {
    setCurrentEmail(email);
  }, [email]);

  useEffect(() => {
    async function updateUserEmail(e: any) {
      try {
        const newEmail = e.detail.newEmail;
        const oldAccessToken = Cookies.get('authToken');
        if (!oldAccessToken) {
          return;
        }
        const header = {
          Authorization: `Bearer ${JSON.parse(oldAccessToken)}`,
          'Content-Type': 'application/json',
        };
        if (newEmail === email) {
          analytics.onUpdateSameEmailProvided({newEmail, oldEmail:currentEmail})
          triggerLoader(false);
          toast.error('New and current email cannot be same');
          return;
        }
        const result = await updateUserDirectoryEmail({ newEmail }, uid, header);
        triggerLoader(false);
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
          analytics.onUpdateEmailSuccess({newEmail, oldEmail:currentEmail})
          toast.success('Email Updated Successfully');
          window.location.reload();
        }
      } catch (err) {
        const newEmail = e.detail.newEmail;
        analytics.onUpdateEmailFailure({newEmail, oldEmail:currentEmail})
        document.dispatchEvent(new CustomEvent('app-loader-status'));
        toast.error('Email Update Failed');
      }
    }

    document.addEventListener('directory-update-email', updateUserEmail);
    return function () {
      document.removeEventListener('directory-update-email', updateUserEmail);
    };
  }, []);

  return (
    <>
      <div className="eu">
        <div className="eu__head">
          <label className="eu__head__label">Email*</label>
          <button className="eu__head__btn" onClick={onEmailEdit} type="button">
            Edit Email
          </button>
        </div>
        <p className="eu__input">{email}</p>
        <input name="email" type="email" hidden value={currentEmail} readOnly/>
      </div>
      <style jsx>
        {`
          .eu {
            padding: 12px 0;
          }
          .eu__head {
            display: flex;
            justify-content: space-between;
          }
          .eu__head__btn {
            background: white;
            color: #156ff7;
            font-weight: 500;
          }
          .eu__head__label {
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 12px;
          }
          .eu__input {
            border: 1px solid lightgrey;
            height: 40px;
            padding: 8px 12px;
            font-size: 14px;
            display: flex;
            align-items: center;
            border-radius: 8px;
            background: #eaeaea;
          }
        `}
      </style>
    </>
  );
}

export default SelfEmailUpdate;
