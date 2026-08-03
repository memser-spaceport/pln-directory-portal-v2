'use client';

import { useState } from 'react';
import Image from 'next/image';
import { clsx } from 'clsx';

import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { getContactLogoByProvider } from '@/utils/profile/getContactLogoByProvider';

// Reuse the production field chrome (label, 50px input box, helper/error slots)
// instead of hand-writing matching CSS, so this row tracks FormField's look.
import fieldCss from '@/components/form/FormField/FormField.module.scss';
import contactCss from '@/components/page/member-details/ContactDetails/components/EditContactForm/EditContactForm.module.scss';

import { ALREADY_TAKEN_EMAIL } from './mocks';
import s from './SettingsContactDetails.module.scss';

type Step = 'idle' | 'address' | 'code' | 'done';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Props {
  email: string;
  onChanged: (nextEmail: string) => void;
}

/**
 * The email row, treated as identity rather than as one more contact handle.
 *
 * What production does today (EditContactForm.tsx:189-198): renders email through
 * `FormField` with `disabled={isOwner}` and `placeholder="Enter your email"`, and
 * hides the only affordance — an unlabeled, tooltip-less grey pencil — inside the
 * greyed-out box. Clicking it jumps straight into Privy's OTP modal with no
 * warning, and every outcome collapses into one of three toasts.
 *
 * What this row does instead:
 * - read-only presentation, not `disabled` — a value the member can see is theirs,
 *   with a labeled "Change" button and a "Verified" badge
 * - states the consequence before the code is sent, using the `description` slot
 *   production already supports and never passes
 * - names the cause and the way out when the address is refused
 * - says the quiet part out loud at the end: the change signs you out
 *
 * Simplified vs production: the 6-digit step is mocked inline. In production Privy
 * owns the code entry (`updateEmail` in PrivyModals.tsx), so only the copy and the
 * before/after framing are being reviewed here — not that exact input.
 */
export function EmailIdentityRow({ email, onChanged }: Props) {
  const [step, setStep] = useState<Step>('idle');
  const [nextEmail, setNextEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setStep('idle');
    setNextEmail('');
    setCode('');
    setError(null);
  };

  const onSendCode = () => {
    const value = nextEmail.trim();

    if (!EMAIL_RE.test(value)) {
      setError('Enter a valid email address, like name@example.com.');
      return;
    }
    if (value.toLowerCase() === email.toLowerCase()) {
      setError('That’s already your email address. Enter the one you want to switch to.');
      return;
    }
    if (value.toLowerCase() === ALREADY_TAKEN_EMAIL) {
      setError('That address is already linked to another LabOS account. Try another address, or contact support.');
      return;
    }

    setError(null);
    setStep('code');
  };

  const onConfirm = () => {
    if (!/^\d{6}$/.test(code)) {
      setError('That code isn’t right. Enter the 6 digits from the email, or send a new code.');
      return;
    }
    setError(null);
    onChanged(nextEmail.trim());
    setStep('done');
  };

  return (
    <div className={clsx(contactCss.row, s.emailRow)}>
      <Image src={getContactLogoByProvider('email')} alt="" height={24} width={24} />

      <div className={fieldCss.field}>
        {/* No field label: the section card this sits in is already headed "Email",
            and repeating it stutters. The value carries its own accessible name
            instead, since there is no form control to attach a <label> to. */}
        <div className={clsx(fieldCss.input, s.readonlyInput)}>
          <div className={s.readonlyValue} aria-label="Email address">
            {email}
          </div>
          <Badge variant="success">Verified</Badge>
          {step === 'idle' && (
            <Button
              size="xs"
              style="border"
              variant="neutral"
              aria-label="Change email address"
              onClick={() => setStep('address')}
            >
              Change
            </Button>
          )}
        </div>

        <div className={fieldCss.sub}>
          <span className={fieldCss.fieldDescription}>
            You sign in with this address. Changing it changes how you sign in.
          </span>
        </div>

        {step === 'address' && (
          <div className={s.panel}>
            <p className={s.panelTitle}>Change your email address</p>
            <p className={s.panelText}>
              We’ll send a 6-digit code to the new address to confirm it’s yours. Your current address keeps working
              until you enter it.
            </p>

            <label className={s.panelLabel} htmlFor="new-email">
              New email address
            </label>
            <div className={clsx(fieldCss.input, s.panelInput)}>
              <input
                id="new-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                className={fieldCss.inputElement}
                placeholder="name@example.com"
                value={nextEmail}
                onChange={(e) => {
                  setNextEmail(e.target.value);
                  setError(null);
                }}
              />
            </div>

            {error && (
              <p className={s.errorText} role="alert">
                {error}
              </p>
            )}

            <div className={s.panelActions}>
              <Button size="s" style="fill" variant="primary" onClick={onSendCode}>
                Send code
              </Button>
              <Button size="s" style="border" variant="neutral" onClick={reset}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {step === 'code' && (
          <div className={s.panel}>
            <p className={s.panelTitle}>Enter the code we sent to {nextEmail}</p>
            <p className={s.panelText}>
              Once you confirm, {nextEmail} becomes your sign-in address and you’ll be asked to sign in again.
            </p>

            <label className={s.panelLabel} htmlFor="otp">
              6-digit code
            </label>
            <div className={clsx(fieldCss.input, s.panelInput, s.codeInput)}>
              <input
                id="otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                className={fieldCss.inputElement}
                placeholder="000000"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, ''));
                  setError(null);
                }}
              />
            </div>

            {error && (
              <p className={s.errorText} role="alert">
                {error}
              </p>
            )}

            <div className={s.panelActions}>
              <Button size="s" style="fill" variant="primary" onClick={onConfirm}>
                Confirm
              </Button>
              <Button size="s" style="link" variant="primary" onClick={() => setStep('address')}>
                Use a different address
              </Button>
            </div>
            <p className={s.hint}>Prototype: any 6 digits are accepted.</p>
          </div>
        )}

        {step === 'done' && (
          <div className={clsx(s.panel, s.panelDone)} role="status" aria-live="polite">
            <p className={s.panelTitle}>Email updated</p>
            <p className={s.panelText}>
              You’ll sign in with <strong>{email}</strong> from now on. For security you’ve been signed out everywhere —
              sign in again with your new address.
            </p>
            <div className={s.panelActions}>
              <Button size="s" style="fill" variant="primary" onClick={reset}>
                Sign in
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
