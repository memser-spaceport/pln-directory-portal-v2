'use client';
import { useState } from 'react';
import s from './AdvisorsPrototypePage.module.scss';
import { ScreenOnboardingWelcome } from './screens/ScreenOnboardingWelcome';
import { ScreenOnboardingConnect } from './screens/ScreenOnboardingConnect';
import { ScreenOnboardingAvailability } from './screens/ScreenOnboardingAvailability';
import { ScreenOnboardingSuccess } from './screens/ScreenOnboardingSuccess';
import { ScreenEditAvailability } from './screens/ScreenEditAvailability';
import { ScreenAdvisorsDirectory } from './screens/ScreenAdvisorsDirectory';
import { ScreenAdvisorProfileSlots } from './screens/ScreenAdvisorProfileSlots';
import { ScreenAdvisorProfileRequest } from './screens/ScreenAdvisorProfileRequest';
import { ScreenMembersAdvisor } from './screens/ScreenMembersAdvisor';

const NAV_GROUPS = [
  {
    label: 'Onboarding',
    screens: [
      { id: 0, name: 'Welcome', description: 'Invited advisor entry point' },
      { id: 1, name: 'Connect Provider', description: 'Cal.com or Calendly selection' },
      { id: 2, name: 'Set Availability', description: 'Weekly window editor' },
      { id: 3, name: 'Success', description: 'Setup complete' },
    ],
  },
  {
    label: 'Settings',
    screens: [
      { id: 4, name: 'Edit Availability', description: 'Post-onboarding settings' },
    ],
  },
  {
    label: 'Discovery',
    screens: [
      { id: 5, name: 'Directory', description: 'Advisor grid + filters' },
      { id: 6, name: 'Profile · Available Slots', description: 'Direct booking flow' },
      { id: 7, name: 'Profile · Request a Time', description: 'No calendar connected' },
    ],
  },
  {
    label: 'Integration',
    screens: [
      { id: 8, name: 'Members · Advisor Visible', description: 'Advisor badge in main feed' },
    ],
  },
];

const ALL_SCREENS = NAV_GROUPS.flatMap((g) => g.screens);

export function AdvisorsPrototypePage() {
  const [activeId, setActiveId] = useState(0);

  const current = ALL_SCREENS.find((sc) => sc.id === activeId)!;
  const currentIdx = ALL_SCREENS.findIndex((sc) => sc.id === activeId);

  const goTo = (id: number) => setActiveId(id);
  const goPrev = () => {
    if (currentIdx > 0) setActiveId(ALL_SCREENS[currentIdx - 1].id);
  };
  const goNext = () => {
    if (currentIdx < ALL_SCREENS.length - 1) setActiveId(ALL_SCREENS[currentIdx + 1].id);
  };

  return (
    <div className={s.hubRoot}>
      {/* Left navigation */}
      <nav className={s.leftNav}>
        <div className={s.navHeader}>
          <span className={s.navBrand}>Advisors MVP · v0</span>
          <span className={s.navSubtitle}>9 screens · {ALL_SCREENS.length} flows</span>
        </div>

        {NAV_GROUPS.map((group) => (
          <div key={group.label} className={s.navGroup}>
            <div className={s.navGroupLabel}>{group.label}</div>
            {group.screens.map((screen) => {
              const isActive = screen.id === activeId;
              return (
                <div
                  key={screen.id}
                  className={`${s.navItem} ${isActive ? s.navItemActive : ''}`}
                  onClick={() => goTo(screen.id)}
                >
                  <div className={`${s.navItemNum} ${isActive ? s.navItemNumActive : ''}`}>
                    {screen.id + 1}
                  </div>
                  <div>
                    <div className={`${s.navItemLabel} ${isActive ? s.navItemLabelActive : ''}`}>
                      {screen.name}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Screen frame */}
      <div className={s.screenFrame}>
        {/* Top bar */}
        <div className={s.screenTopBar}>
          <div className={s.screenTopBarLeft}>
            <span className={s.screenBadge}>Prototype</span>
            <span className={s.screenName}>{current.name}</span>
            <span className={s.screenCounter}>Screen {currentIdx + 1} of {ALL_SCREENS.length}</span>
          </div>
          <div className={s.screenTopBarRight}>
            <button className={s.navBtn} onClick={goPrev} disabled={currentIdx === 0}>← Prev</button>
            <button
              className={`${s.navBtn} ${currentIdx < ALL_SCREENS.length - 1 ? s.navBtnPrimary : ''}`}
              onClick={goNext}
              disabled={currentIdx === ALL_SCREENS.length - 1}
            >
              Next →
            </button>
          </div>
        </div>

        {/* Screen content */}
        <div className={s.screenContent}>
          {activeId === 0 && <ScreenOnboardingWelcome onNext={() => goTo(1)} />}
          {activeId === 1 && <ScreenOnboardingConnect onNext={() => goTo(2)} onBack={() => goTo(0)} />}
          {activeId === 2 && <ScreenOnboardingAvailability onNext={() => goTo(3)} onBack={() => goTo(1)} />}
          {activeId === 3 && <ScreenOnboardingSuccess onViewProfile={() => goTo(6)} onEditAvailability={() => goTo(4)} />}
          {activeId === 4 && <ScreenEditAvailability onBack={() => goTo(3)} />}
          {activeId === 5 && <ScreenAdvisorsDirectory onSelectAdvisor={(id) => goTo(id === 'advisor-003' ? 7 : 6)} />}
          {activeId === 6 && <ScreenAdvisorProfileSlots onBack={() => goTo(5)} />}
          {activeId === 7 && <ScreenAdvisorProfileRequest onBack={() => goTo(5)} />}
          {activeId === 8 && <ScreenMembersAdvisor />}
        </div>
      </div>
    </div>
  );
}
