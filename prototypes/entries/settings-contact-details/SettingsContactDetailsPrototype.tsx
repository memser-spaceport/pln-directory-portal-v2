'use client';

import { useEffect, useState } from 'react';

// Production settings shell, reused wholesale: `.privacy`, `.privacy__backbtn`,
// `.privacy__main`, `.privacy__main__aside`, `.privacy__main__content`.
import shellCss from '@/app/settings/email/page.module.css';
// Production's `/settings` mobile menu page frame.
import rootCss from '@/app/settings/page.module.css';

import { SettingsBackButtonMock } from './SettingsBackButtonMock';
import { SettingsMenuMock } from './SettingsMenuMock';
import { EmailAndAccountsTab } from './tabs/EmailAndAccountsTab';
import { NotificationPreferencesTab } from './tabs/NotificationPreferencesTab';
import { JobAlertTab } from './tabs/JobAlertTab';
import { MOCK_MEMBER } from './mocks';

/**
 * Titles match production's `SettingsBackButton title` prop per route, which is
 * Title Case even though the rail renders lowercase + `text-transform: capitalize`.
 */
const TAB_TITLES: Record<string, string> = {
  'email & accounts': 'Email & Accounts',
  'notification preferences': 'Notification Preferences',
  'job alert': 'Job Alert',
};

/** The 1024px line where production's rail appears and the back bar disappears. */
const DESKTOP_QUERY = '(min-width: 1024px)';

/**
 * Settings — the full member surface, walkable.
 *
 * Production splits this across routes (`/settings` is the mobile menu page,
 * `/settings/<tab>` is each tab) and navigates between them by dispatching a
 * `settings-navigate` CustomEvent that the active tab's content component turns
 * into a `router.push`. A prototype is one route, so the same structure is
 * reproduced with local state — but the layout, chrome and breakpoint behaviour
 * are production's:
 *
 * - desktop (>=1024px): rail always visible, no back bar, content swaps in place
 * - mobile: the menu is its own page; picking an item opens that tab with the
 *   back bar; back returns to the menu
 *
 * The design changes under review are both in the rail (see SettingsMenuMock):
 * a new "contact details" item placed first, and "email preferences" renamed to
 * "notification preferences". Every other tab is reproduced as it ships, so the
 * two wrong doors a member tries today — Connected Accounts, which is where
 * "Account settings" actually lands and which omits email entirely, and the old
 * "Email preferences" — can be walked in context.
 *
 * Not reproduced: the Admin Settings group (`manage members` / `manage teams`).
 * Those are admin surfaces, not part of a member changing their own email. The
 * rail renders the group correctly when `isAdmin` / `isTeamLead` are passed;
 * only the two tab bodies are missing.
 */
export default function SettingsContactDetailsPrototype() {
  // base-ui + react-hook-form + react-select are client-only; gate so
  // SSR === first client render on this server-rendered prototype route.
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia(DESKTOP_QUERY);
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const [email, setEmail] = useState(MOCK_MEMBER.email);
  // `null` is the mobile menu page. Desktop always has a tab open.
  const [activeItem, setActiveItem] = useState<string | null>(null);

  if (!mounted) return <div className={shellCss.privacy} />;

  const currentTab = isDesktop ? (activeItem ?? 'email & accounts') : activeItem;

  // Mobile menu page — production's `/settings` root.
  if (!currentTab) {
    return (
      <div className={rootCss.settings}>
        <div className={rootCss.settings__title}>
          <h2 className={rootCss.settings__title__text}>Account Settings</h2>
        </div>
        <div>
          <SettingsMenuMock activeItem="" onSelect={setActiveItem} />
        </div>
      </div>
    );
  }

  const renderTab = () => {
    switch (currentTab) {
      case 'notification preferences':
        return <NotificationPreferencesTab />;
      case 'job alert':
        return <JobAlertTab />;
      default:
        return <EmailAndAccountsTab email={email} onEmailChanged={setEmail} />;
    }
  };

  return (
    <div className={shellCss.privacy}>
      <div className={shellCss.privacy__backbtn}>
        <SettingsBackButtonMock title={TAB_TITLES[currentTab] ?? ''} onBack={() => setActiveItem(null)} />
      </div>

      <div className={shellCss.privacy__main}>
        <aside className={shellCss.privacy__main__aside}>
          <SettingsMenuMock activeItem={currentTab} onSelect={setActiveItem} />
        </aside>

        {/* No mobile heading here on purpose: production hides `formCss.title`
            below tablet-landscape precisely because the sticky back bar above
            carries the title instead. */}
        <div className={shellCss.privacy__main__content}>{renderTab()}</div>
      </div>
    </div>
  );
}
