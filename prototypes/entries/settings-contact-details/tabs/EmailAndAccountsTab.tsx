'use client';

import { useState } from 'react';
import Image from 'next/image';
import { clsx } from 'clsx';
import { FormProvider, useForm } from 'react-hook-form';

import { Button } from '@/components/common/Button';
import { FormField } from '@/components/form/FormField';
import { FormSwitch } from '@/components/form/FormSwitch';
import { getContactLogoByProvider } from '@/utils/profile/getContactLogoByProvider';

// Production's settings form frame.
import formCss from '@/components/page/email-preferences/components/EmailPreferencesForm/EmailPreferencesForm.module.scss';
// Production's settings section card (bordered, header + content) — the same
// vocabulary the Notification preferences tab uses for Digest / Newsletter / etc.
import cardCss from '@/components/page/email-preferences/components/Newsletter/Newsletter.module.scss';
// Production contact rows: `.body`, `.row`, `.center`, switch labels.
import contactCss from '@/components/page/member-details/ContactDetails/components/EditContactForm/EditContactForm.module.scss';

import { EmailIdentityRow } from '../EmailIdentityRow';
import { LINKED_ACCOUNTS, MOCK_MEMBER } from '../mocks';
import s from '../SettingsContactDetails.module.scss';

/** The five handles production renders below email, in production's order. */
const HANDLES = [
  {
    name: 'linkedin',
    provider: 'linkedin',
    label: 'LinkedIn',
    placeholder: 'eg., johndoe or https://linkedin.com/in/johndoe',
  },
  { name: 'telegram', provider: 'telegram', label: 'Telegram', placeholder: 'eg., @username or https://t.me/username' },
  { name: 'github', provider: 'github', label: 'Github', placeholder: 'eg., username or https://github.com/username' },
  {
    name: 'twitter',
    provider: 'twitter',
    label: 'X (Twitter)',
    placeholder: 'eg., @protocollabs or https://twitter.com/protocollabs',
  },
  {
    name: 'discord',
    provider: 'discord',
    label: 'Discord',
    placeholder: 'eg., username or https://discord.com/users/username',
  },
];

/** Production's `LinkAuthAccounts` list, verbatim. */
const SIGN_IN_METHODS = [
  { img: '/icons/google.svg', name: 'google', title: 'Google' },
  { img: '/icons/mdi_github.svg', name: 'github', title: 'GitHub' },
  { img: '/icons/wallet-cards.svg', name: 'siwe', title: 'Wallet' },
];

/**
 * Email & accounts — one tab for everything that identifies a member, replacing
 * the two adjacent tabs this prototype used to have (Contact details and
 * Connected Accounts).
 *
 * Why one: two neighbouring items that both sound like "where my identity lives"
 * reproduce the dithering the whole change is meant to remove. A member hunting
 * for their email address should have exactly one plausible door, not two. The
 * separation between "how you sign in" and "how people reach you" is real, so it
 * moves from tab level down to section level — a scroll instead of a navigation.
 *
 * COPY-SIMPLIFY of `EditContactForm` + `ConnectedAccounts`/`LinkAuthAccounts`.
 * Production's data layer (react-query, cookies, analytics, the Privy auth bus)
 * is dropped for local state; markup, classes, measurements and field copy are
 * production's.
 *
 * One restyle, deliberate: production wraps the sign-in methods in a grey `lc`
 * panel holding white rows. Inside a settings section card that would be a card
 * within a card, so the rows are bordered directly on the card surface instead.
 * Their padding (12px 16px), gap (16px) and colors are unchanged.
 */
export function EmailAndAccountsTab({
  email,
  onEmailChanged,
}: {
  email: string;
  onEmailChanged: (next: string) => void;
}) {
  const [saved, setSaved] = useState(false);
  const [linked, setLinked] = useState<string[]>(LINKED_ACCOUNTS);

  const methods = useForm({ defaultValues: MOCK_MEMBER });
  const { formState, reset, handleSubmit } = methods;

  const onSubmit = (values: typeof MOCK_MEMBER) => {
    reset(values); // clears dirty state, standing in for a successful save
    setSaved(true);
  };

  return (
    <FormProvider {...methods}>
      <form className={formCss.root} noValidate onSubmit={handleSubmit(onSubmit)}>
        <h5 className={formCss.title}>Email &amp; Accounts</h5>

        {/* 1. Identity. Your email is also your login, so it leads and stands alone. */}
        <div className={cardCss.root}>
          <div className={cardCss.header}>Email</div>
          <div className={clsx(contactCss.body, s.cardBody)}>
            <EmailIdentityRow
              email={email}
              onChanged={(next) => {
                onEmailChanged(next);
                setSaved(false);
              }}
            />
          </div>
        </div>

        {/* 2. The other ways into the same account. Production's "Connected
            Accounts" tab, re-housed — its heading was "Link your account for
            login", which is exactly what this section is. */}
        <div className={cardCss.root}>
          <div className={cardCss.header}>Sign-in methods</div>
          <div className={cardCss.content}>
            {SIGN_IN_METHODS.map((account) => {
              const isLinked = linked.includes(account.name);
              return (
                <div key={account.name} className={s.methodRow}>
                  <img width="20" height="20" alt="" src={account.img} />
                  <p className={s.methodTitle}>{account.title}</p>
                  {isLinked ? (
                    <p className={s.methodLinked}>
                      <img src="/icons/tick_green.svg" alt="" />
                      <span>Linked</span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      className={s.methodBtn}
                      aria-label={`Link your ${account.title} account`}
                      onClick={() => setLinked((prev) => [...prev, account.name])}
                    >
                      Link account
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. How other members reach you — a different job, so its own section,
            with the save bar scoped to it since it holds the only editable fields. */}
        <div className={cardCss.root}>
          <div className={cardCss.header}>Contact handles</div>
          <div className={clsx(contactCss.body, s.cardBody)}>
            {HANDLES.map((handle) => (
              <div key={handle.name} className={contactCss.row}>
                <Image src={getContactLogoByProvider(handle.provider)} alt="" height={24} width={24} />
                <FormField name={handle.name} label={handle.label} placeholder={handle.placeholder} />
              </div>
            ))}

            <div className={contactCss.separator} />

            {/* Production's exact copy and switch. */}
            <div className={clsx(contactCss.row, contactCss.center)}>
              <div className={contactCss.switchLabelWrapper}>
                <div className={contactCss.switchLabel}>Show contact details to PL network members</div>
                <div className={contactCss.switchDesc}>Contact details are never displayed publicly</div>
              </div>
              <FormSwitch name="shareContacts" />
            </div>

            <div className={s.saveBar}>
              {saved && !formState.isDirty && (
                <p className={clsx(s.hint, s.savedNote)} role="status" aria-live="polite">
                  Contact handles saved.
                </p>
              )}
              <Button
                type="button"
                size="m"
                style="border"
                variant="neutral"
                disabled={!formState.isDirty}
                onClick={() => reset(MOCK_MEMBER)}
              >
                Cancel
              </Button>
              <Button type="submit" size="m" style="fill" variant="primary" disabled={!formState.isDirty}>
                Save changes
              </Button>
            </div>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
