'use client';

import { useEffect, useState, type ReactNode } from 'react';

// Production's site-wide bar and the components that sit in it (SiteHeader, above the navbar).
import { HighlightsBar } from '@/components/core/navbar/components/HighlightsBar';
import { DemoDayBanner } from '@/components/core/navbar/components/DemoDayBanner/DemoDayBanner';
import { PlaaBuybackBannerBar } from '@/components/core/navbar/components/PlaaBuybackBanner/PlaaBuybackBanner';
import profileStyles from '@/components/core/navbar/components/CompleteYourProfile/CompleteYourProfile.module.scss';
import carouselStyles from '@/components/core/navbar/components/PlaaTopBannerCarousel/PlaaTopBannerCarousel.module.scss';

import { PrototypeNavBar } from '../nav-shared/PrototypeNavBar';
import { BackendTagsContext } from '../lab-2948-prototype-a-better-mcp-connect/shared';
import { LaunchBanner } from '../lab-2948-prototype-a-better-mcp-connect/LaunchBanner';

import s from './TopBarsInventoryPrototype.module.scss';

/**
 * Every bar production puts above the navbar, side by side with the MCP launch banner.
 * CompleteYourProfile reads the current-user store, so its markup is copied here with its own stylesheet.
 */
export default function TopBarsInventoryPrototype() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className={s.root} />;

  return (
    <BackendTagsContext.Provider value={false}>
      <div className={s.root}>
        <Example
          title="1. Complete your profile — live"
          note="Signed-in member whose access is not approved yet (rbac status PENDING). HighlightsBar variant=secondary. No button, no close."
        >
          <ProfileBar message="Limited access: verify your identity to proceed" />
        </Example>

        <Example
          title="1b. Complete your profile — live, under review"
          note="Status VERIFIED, or anyone who signed up through Demo Day."
        >
          <ProfileBar message="Profile under review — we'll notify you once approved" />
        </Example>

        <Example
          title="2. PLAA top banner carousel — live, /alignment-asset only"
          note="People with PLAA access. Rotates every 8s between the buyback auction bar (shown) and the snapshot bar; dots; no close; hidden under 960px."
        >
          <div className={carouselStyles.carousel}>
            <div className={carouselStyles.slide}>
              <PlaaBuybackBannerBar
                slide={{
                  debugNow: null,
                  progressPct: 42,
                  countdownLabel: '2d 14h left',
                  auctionEndLabel: 'Oct 30, 17:00 UTC',
                  onCtaClick: () => {},
                }}
              />
            </div>
          </div>
        </Example>

        <Example
          title="3. Demo Day banner — built, switched off"
          note="Commented out in SiteHeader. Same blue primary HighlightsBar the MCP banner uses. Hides itself on /demoday pages. No close."
        >
          <DemoDayBanner />
        </Example>

        <Example
          title="4. MCP launch banner — proposed (this prototype)"
          note="Primary HighlightsBar plus a New pill, a CTA and the first close button any top bar has had."
        >
          <LaunchBanner onSetUp={() => {}} />
        </Example>

        <Example
          title="5. Collision — pending member sees 4 and 1 together"
          note="Both bars stack inside the header, above the navbar."
        >
          <LaunchBanner onSetUp={() => {}} />
          <ProfileBar message="Limited access: verify your identity to proceed" />
        </Example>
      </div>
    </BackendTagsContext.Provider>
  );
}

function Example({ title, note, children }: { title: string; note: string; children: ReactNode }) {
  return (
    <section className={s.example}>
      <h2 className={s.title}>{title}</h2>
      <p className={s.note}>{note}</p>
      <div className={s.frame}>
        {children}
        <PrototypeNavBar hasUnreadNews={false} isLoggedIn />
      </div>
    </section>
  );
}

function ProfileBar({ message }: { message: string }) {
  return (
    <HighlightsBar variant="secondary">
      <div className={profileStyles.root}>
        <div className={profileStyles.left}>
          <UserIcon />
          <span className={profileStyles.description}>{message}</span>
        </div>
      </div>
    </HighlightsBar>
  );
}

/* Production's, verbatim (local to CompleteYourProfile.tsx). */
const UserIcon = () => (
  <svg width="26" height="21" viewBox="0 0 26 21" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M8.75 10.5C6.95312 10.5 5.3125 9.5625 4.41406 8C2.46094 4.67969 4.88281 0.5 8.75 0.5C10.5078 0.5 12.1484 1.47656 13.0469 3C15 6.35938 12.5781 10.5 8.75 10.5ZM6.95312 12.375H10.5078C10.7812 12.375 11.0156 12.4141 11.25 12.4141C11.25 12.6094 11.25 12.8047 11.25 13C11.25 16.4766 14.0234 19.25 17.5 19.25C17.5 19.2891 17.5 19.3281 17.5 19.3672C17.5 19.9922 16.9531 20.5 16.3281 20.5H1.13281C0.507812 20.5 0 19.9922 0 19.3672C0 15.5 3.08594 12.375 6.95312 12.375ZM17.5 9.91406C16.3672 9.91406 15.3516 10.5 14.7656 11.4766C13.5547 13.5469 15.0781 16.1641 17.5 16.1641C18.5938 16.1641 19.6094 15.5391 20.1953 14.6016C21.4062 12.4922 19.8828 9.91406 17.5 9.91406ZM17.5 18.0391H17.4609C14.7266 18.0391 12.4609 15.7734 12.4609 13.0391C12.4609 10.2656 14.7266 8.03906 17.4609 8.03906C20.2344 8.03906 22.4609 10.2656 22.4609 13.0391C22.4609 14.0547 22.1484 15.0312 21.6016 15.8516L24.6875 18.9375C25.0781 19.2891 25.0781 19.875 24.6875 20.2656C24.3359 20.6172 23.75 20.6172 23.3984 20.2656L20.2734 17.1406C19.4922 17.6875 18.5156 18.0391 17.5 18.0391Z"
      fill="#FF820E"
    />
  </svg>
);
