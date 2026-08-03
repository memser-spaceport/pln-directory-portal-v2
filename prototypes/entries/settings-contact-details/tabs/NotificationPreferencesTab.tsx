'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { clsx } from 'clsx';
import { Switch } from '@base-ui-components/react/switch';
import { Field } from '@base-ui-components/react/field';

// Production's own section frames for this tab.
import formCss from '@/components/page/email-preferences/components/EmailPreferencesForm/EmailPreferencesForm.module.scss';
import digestCss from '@/components/page/email-preferences/components/ForumDigest/ForumDigest.module.scss';
import toggleCss from '@/components/page/email-preferences/components/Newsletter/Newsletter.module.scss';

// react-select is client-only, exactly as production's ForumDigest loads it.
const Select = dynamic(() => import('react-select'), {
  ssr: false,
  loading: () => <div style={{ width: '100%', height: 50 }} />,
});

interface FreqOption {
  label: string;
  value: string;
  description: string;
}

/** Production's frequency options and their descriptions, verbatim. */
const FREQ_OPTIONS: FreqOption[] = [
  { label: 'No Digest', value: 'no_digest', description: 'Don’t receive digest emails.' },
  { label: 'Daily Digest', value: 'daily_digest', description: 'A summary of what’s new every day.' },
  { label: 'Weekly Digest', value: 'weekly_digest', description: 'A summary of what’s new every week.' },
];

/** react-select styling, copied from production ForumDigest. */
const selectStyles = {
  container: (base: any) => ({ ...base, width: '100%' }),
  control: (base: any) => ({
    ...base,
    alignItems: 'center',
    gap: '8px',
    alignSelf: 'stretch',
    borderRadius: '8px',
    border: '1px solid rgba(203, 213, 225, 0.50)',
    background: '#fff',
    outline: 'none',
    minWidth: '140px',
    width: '100%',
    borderColor: 'rgba(203, 213, 225, 0.50) !important',
    position: 'relative' as const,
    fontSize: '16px',
    color: '#455468',
    boxShadow: 'none !important',
    '&:hover': {
      border: '1px solid #5E718D',
      boxShadow: '0 0 0 4px rgba(27, 56, 96, 0.12) !important',
      borderColor: '#5E718D !important',
    },
    '&:focus-visible, &:focus': {
      borderColor: '#5E718D !important',
      boxShadow: '0 0 0 4px rgba(27, 56, 96, 0.12) !important',
    },
  }),
  input: (base: any) => ({ ...base, height: '42px', padding: 0, fontSize: 16 }),
  option: (base: any) => ({
    ...base,
    fontSize: '14px',
    fontWeight: 300,
    color: '#455468',
    '&:hover': { background: 'rgba(27, 56, 96, 0.12)' },
  }),
  menuList: (base: any) => ({ ...base, width: '100%' }),
  menu: (base: any) => ({
    ...base,
    outline: 'none',
    zIndex: 3,
    display: 'flex',
    padding: '8px',
    flexDirection: 'column' as const,
    alignItems: 'flex-start',
  }),
  placeholder: (base: any) => ({ ...base, color: '#CBD5E1' }),
  indicatorSeparator: () => ({ display: 'none' }),
};

function ToggleRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className={toggleCss.toggleSection}>
      <label className={clsx(toggleCss.Label, toggleCss.toggle)}>
        {label}
        <Switch.Root className={toggleCss.Switch} checked={checked} onCheckedChange={onChange}>
          <Switch.Thumb className={toggleCss.Thumb}>
            <div className={toggleCss.dot} />
          </Switch.Thumb>
        </Switch.Root>
      </label>
      <div className={toggleCss.desc}>{desc}</div>
    </div>
  );
}

/**
 * COPY-SIMPLIFY of `EmailPreferencesForm` and its four sections. Production
 * fetches forum / investor / demo-day settings server-side and writes each
 * toggle through its own mutation; here every control is local state.
 *
 * Reproduced as production ships it today, with one change and one change only:
 * the tab is renamed from "Email Preferences" to "Notification Preferences".
 * That name is wrong door #2 — it is the item a member picks when they want to
 * change their email address, and it has never held one. (The separate
 * `email-preferences` prototype proposes splitting the digest's contents; that
 * proposal is deliberately NOT folded in here, so this page stays a truthful
 * picture of what shipping looks like.)
 */
export function NotificationPreferencesTab() {
  const [freq, setFreq] = useState<FreqOption>(FREQ_OPTIONS[1]);
  const [forumActivity, setForumActivity] = useState(true);
  const [newsletter, setNewsletter] = useState(true);
  const [demoDay, setDemoDay] = useState(true);
  const [showInvestor, setShowInvestor] = useState(false);

  const digestOn = freq.value !== 'no_digest';

  return (
    <div className={formCss.root}>
      <h5 className={formCss.title}>Notification Preferences</h5>

      <div className={digestCss.root}>
        <div className={digestCss.header}>Digest</div>
        <div className={digestCss.content}>
          <Field.Root className={digestCss.field}>
            <Field.Label className={digestCss.label}>Email me a digest:</Field.Label>
            <Select
              instanceId="digest-frequency"
              menuPlacement="auto"
              placeholder="Select frequency"
              options={FREQ_OPTIONS}
              value={freq}
              defaultValue={freq}
              onChange={(v) => setFreq(v as FreqOption)}
              styles={selectStyles}
              components={{
                Option: (props: any) => {
                  const d = props.data as FreqOption;
                  return (
                    <div onClick={() => props.selectOption(d)} className={digestCss.option}>
                      <div className={digestCss.optionLabel}>{d.label}</div>
                      {d.description && <div className={digestCss.optionDesc}>{d.description}</div>}
                    </div>
                  );
                },
              }}
            />
          </Field.Root>

          {digestOn && (
            <ToggleRow
              label="Forum activity"
              desc="Include new forum posts and replies in your digest."
              checked={forumActivity}
              onChange={setForumActivity}
            />
          )}
        </div>
      </div>

      <div className={toggleCss.root}>
        <div className={toggleCss.header}>Newsletter</div>
        <div className={toggleCss.content}>
          <ToggleRow
            label="Subscribe to PL Newsletter"
            desc="Get newsletter straight to your inbox"
            checked={newsletter}
            onChange={setNewsletter}
          />
        </div>
      </div>

      <div className={toggleCss.root}>
        <div className={toggleCss.header}>Demo Day Updates</div>
        <div className={toggleCss.content}>
          <ToggleRow
            label="Receive Demo Day Updates"
            desc="Get notified when registration opens, demo day begins and other relevant reminders."
            checked={demoDay}
            onChange={setDemoDay}
          />
        </div>
      </div>

      <div className={toggleCss.root}>
        <div className={toggleCss.header}>Investor Communications</div>
        <div className={toggleCss.content}>
          <ToggleRow
            label="Show Investor Profile on my public member page"
            desc="Toggle to make your investor information visible to other network members and eligible for Demo Day invitations."
            checked={showInvestor}
            onChange={setShowInvestor}
          />
        </div>
      </div>
    </div>
  );
}
