'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Cookies from 'js-cookie';

import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { toast } from '@/components/core/ToastContainer';
import { authEvents } from '@/components/core/login/utils';
import { useAuthAnalytics } from '@/analytics/auth.analytics';
import { updateUserDirectoryEmail } from '@/services/members.service';
import { IUserInfo } from '@/types/shared.types';
import { decodeToken } from '@/utils/auth.utils';
import { getAnalyticsUserInfo, triggerLoader } from '@/utils/common.utils';
import { getContactLogoByProvider } from '@/utils/profile/getContactLogoByProvider';

import s from './EmailIdentityRow.module.scss';

interface Props {
  uid: string;
  email: string;
  userInfo: IUserInfo;
}

/**
 * The email row, treated as identity rather than as one more contact handle. Shipped: Settings ›
 * Connected accounts renders this component, and the prototype route renders the same one — like
 * `job-board/components/ReferModal`, whose home is also here. There is no mocked copy, so the
 * reviewed behaviour and what a member gets cannot drift apart.
 *
 * What it replaces (`EditContactForm.tsx:189`): email rendered through `FormField` with
 * `disabled={isOwner}`, its only affordance an unlabeled, tooltip-less grey pencil inside the
 * greyed-out box, which jumps straight into Privy's OTP modal with no warning.
 *
 * Instead:
 * - read-only presentation, not `disabled` — a value the member can see is theirs, with a
 *   labeled "Change" button and a "Verified" badge
 * - the consequence is stated before any code is sent, in the description slot production
 *   already supports and never passes
 * - the cause is named when the address is refused, inline, next to the thing that failed
 *
 * Privy owns the two steps in the middle — entering the new address and the 6-digit code
 * (`updateEmail` in PrivyModals). "Continue" hands over to it; Privy answers with
 * `auth:update-email`, which is where the directory record actually changes. Because that
 * handoff is real, completing it from the prototype route changes a real Privy email: the guard
 * below stops it dead when there is no session, which is the state prototypes are reviewed in.
 */
export function EmailIdentityRow({ uid, email, userInfo }: Props) {
  const analytics = useAuthAnalytics();
  const [isChanging, setIsChanging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // `auth:update-email` arrives long after this row rendered, from a modal outside it. Refs
  // keep the handler on the current values without resubscribing on every render (neither
  // `useAuthAnalytics()` nor `userInfo` is referentially stable).
  const latest = useRef({ email, userInfo, analytics });
  latest.current = { email, userInfo, analytics };

  const onStartChange = () => {
    setError(null);
    setIsChanging(true);
  };

  const onCancel = () => {
    setError(null);
    setIsChanging(false);
  };

  const onContinue = () => {
    latest.current.analytics.onUpdateEmailClicked(getAnalyticsUserInfo(userInfo));

    if (!Cookies.get('authToken')) {
      return;
    }

    setError(null);
    authEvents.emit('auth:link-account', 'updateEmail');
  };

  useEffect(() => {
    async function updateUserEmail({ newEmail }: { newEmail: string }) {
      const { email: currentEmail, analytics: currentAnalytics } = latest.current;
      const oldAccessToken = Cookies.get('authToken');

      if (!oldAccessToken) {
        return;
      }

      // Privy raises the app loader before handing back; every exit below has to lower it.
      const fail = (message: string) => {
        triggerLoader(false);
        setIsChanging(true);
        setError(message);
      };

      if (newEmail === currentEmail) {
        currentAnalytics.onUpdateSameEmailProvided({ newEmail, oldEmail: currentEmail });
        fail('That’s already your email address. Enter the one you want to switch to.');
        return;
      }

      try {
        const result = await updateUserDirectoryEmail({ newEmail }, uid, {
          Authorization: `Bearer ${JSON.parse(oldAccessToken)}`,
          'Content-Type': 'application/json',
        });

        const { refreshToken, accessToken, userInfo: newUserInfo, isError, message } = result;

        if (isError || !refreshToken || !accessToken) {
          currentAnalytics.onUpdateEmailFailure({ newEmail, oldEmail: currentEmail });
          fail(
            message
              ? `We couldn’t switch your email to ${newEmail}: ${message}`
              : `We couldn’t switch your email to ${newEmail}. Try again, or contact support if it keeps failing.`,
          );
          return;
        }

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

        currentAnalytics.onUpdateEmailSuccess({ newEmail, oldEmail: currentEmail });
        toast.success('Email Updated Successfully');
        // Reload rather than refresh: the whole app reads identity from these cookies.
        window.location.reload();
      } catch {
        currentAnalytics.onUpdateEmailFailure({ newEmail, oldEmail: currentEmail });
        fail(`We couldn’t switch your email to ${newEmail}. Try again, or contact support if it keeps failing.`);
      }
    }

    return authEvents.on('auth:update-email', updateUserEmail);
  }, [uid]);

  return (
    <div className={s.row}>
      <Image className={s.providerIcon} src={getContactLogoByProvider('email')} alt="" height={24} width={24} />

      <div className={s.field}>
        {/* No field label: the section card this sits in is already headed "Email", and
            repeating it stutters. The value carries its own accessible name instead, since
            there is no form control to attach a <label> to. */}
        <div className={s.value}>
          <div className={s.address} aria-label="Email address">
            {email}
          </div>
          {/* Only claim verified when there is an address to claim it for — the record can
              fail to load, and a badge over an empty box would be a lie. */}
          {!!email && <Badge variant="success">Verified</Badge>}
          {!isChanging && (
            <Button
              size="xs"
              style="border"
              variant="neutral"
              aria-label="Change email address"
              onClick={onStartChange}
            >
              Change
            </Button>
          )}
        </div>

        <p className={s.description}>You sign in with this address. Changing it changes how you sign in.</p>

        {isChanging && (
          <div className={s.panel}>
            <p className={s.panelTitle}>Change your email address</p>
            <p className={s.panelText}>
              We’ll ask for the new address and send it a 6-digit code to confirm it’s yours. Your current address keeps
              working until you enter the code.
            </p>

            {error && (
              <p className={s.errorText} role="alert">
                {error}
              </p>
            )}

            <div className={s.panelActions}>
              <Button size="s" style="fill" variant="primary" onClick={onContinue}>
                Continue
              </Button>
              <Button size="s" style="border" variant="neutral" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
