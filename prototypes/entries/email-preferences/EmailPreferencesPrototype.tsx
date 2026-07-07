'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { clsx } from 'clsx';
import { Switch } from '@base-ui-components/react/switch';
import { Field } from '@base-ui-components/react/field';

// Reuse the production email-preferences styling 1:1.
import shellCss from '@/app/settings/email/page.module.css';
import formCss from '@/components/page/email-preferences/components/EmailPreferencesForm/EmailPreferencesForm.module.scss';
import digestCss from '@/components/page/email-preferences/components/ForumDigest/ForumDigest.module.scss';
import toggleCss from '@/components/page/email-preferences/components/Newsletter/Newsletter.module.scss';

import { SettingsMenuMock } from './SettingsMenuMock';

// react-select is client-only, exactly as production's ForumDigest loads it.
const Select = dynamic(() => import('react-select'), { ssr: false, loading: () => <div style={{ width: '100%', height: 50 }} /> });

type FreqValue = 'no_digest' | 'daily_digest' | 'weekly_digest';
interface FreqOption {
  label: string;
  value: FreqValue;
  description: string;
}

// Same frequency model as production's ForumDigest, reworded for a digest that
// now carries forum activity AND network news (not forum only).
const FREQ_OPTIONS: FreqOption[] = [
  { label: 'No Digest', value: 'no_digest', description: 'Don’t receive a digest by email.' },
  { label: 'Daily Digest', value: 'daily_digest', description: 'A roundup of new activity every day.' },
  { label: 'Weekly Digest', value: 'weekly_digest', description: 'The week’s highlights, once a week.' },
];

// react-select inline styling, copied from production ForumDigest so the
// dropdown matches the rest of the settings surface.
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

const selectComponents = {
  Option: (props: any) => {
    const d = props.data as FreqOption;
    return (
      <div onClick={() => props.selectOption(d)} className={digestCss.option}>
        <div className={digestCss.optionLabel}>{d.label}</div>
        {d.description && <div className={digestCss.optionDesc}>{d.description}</div>}
      </div>
    );
  },
};

/** One bordered toggle row (label + Switch + helper) — production's exact shape. */
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
 * COPY-SIMPLIFY of the production Email Preferences tab (settings shell + the
 * EmailPreferencesForm sections). All data hooks / analytics are dropped for
 * local mocked state. The one design change: the old "Forum Digest" is renamed
 * to "Digest" (it actually carries forum activity + network news) and gains
 * per-content toggles, so a member can keep the digest but switch network news
 * off — the ask that motivated this.
 */
export default function EmailPreferencesPrototype() {
  // react-select + base-ui Switch are client-only; gate so SSR === first render.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [freq, setFreq] = useState<FreqOption>(FREQ_OPTIONS[1]); // Daily, matching the screenshot
  const [includeForum, setIncludeForum] = useState(true);
  const [includeNews, setIncludeNews] = useState(true);
  const [newsletter, setNewsletter] = useState(true);
  const [demoDay, setDemoDay] = useState(true);
  const [showInvestor, setShowInvestor] = useState(false);

  if (!mounted) return <div className={shellCss.privacy} />;

  const digestOn = freq.value !== 'no_digest';

  return (
    <div className={shellCss.privacy}>
      <div className={shellCss.privacy__main}>
        <aside className={shellCss.privacy__main__aside}>
          <SettingsMenuMock activeItem="email preferences" />
        </aside>
        <div className={shellCss.privacy__main__content}>
          <div className={formCss.root}>
            <h5 className={formCss.title}>Email Preferences</h5>

            {/* Digest (was "Forum Digest") — now a digest of forum + news, with
                per-content toggles so news can be switched off independently. */}
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
                    components={selectComponents}
                  />
                </Field.Root>

                {digestOn && (
                  <>
                    <ToggleRow
                      label="Forum activity"
                      desc="Discussions, replies, and trending posts from the forum."
                      checked={includeForum}
                      onChange={setIncludeForum}
                    />
                    <ToggleRow
                      label="Network news"
                      desc="Funding, launches, partnerships, and milestones from teams across the network."
                      checked={includeNews}
                      onChange={setIncludeNews}
                    />
                  </>
                )}
              </div>
            </div>

            {/* Newsletter */}
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

            {/* Demo Day Updates */}
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

            {/* Investor Communications */}
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
        </div>
      </div>
    </div>
  );
}
