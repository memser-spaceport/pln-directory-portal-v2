'use client';

import React, { useState } from 'react';
import Image from 'next/image';

import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { useUpdateEmail } from '@/services/members/hooks/useUpdateEmail';
import { IUserInfo } from '@/types/shared.types';
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
 * What it replaces (`EditContactForm.tsx`): email rendered through `FormField` with
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
 * The flow itself — the Privy handoff and the directory write it answers with — lives in
 * `useUpdateEmail`, shared with the other places a member can change their address. This
 * component owns only how that flow is presented; the panel below is what makes the consequence
 * visible before the handoff, and `onFailure` is what puts the reason inline instead of in a
 * toast that outlives the row.
 */
export function EmailIdentityRow({ uid, email, userInfo }: Props) {
  const [isChanging, setIsChanging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { requestEmailChange } = useUpdateEmail({
    uid,
    email,
    userInfo,
    onFailure: ({ message }) => {
      // Reopen the panel: the message is about the change the member was making, so it has to
      // appear next to the flow they will retry, not on its own.
      setIsChanging(true);
      setError(message);
    },
  });

  const onStartChange = () => {
    setError(null);
    setIsChanging(true);
  };

  const onCancel = () => {
    setError(null);
    setIsChanging(false);
  };

  const onContinue = () => {
    setError(null);
    requestEmailChange();
  };

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
