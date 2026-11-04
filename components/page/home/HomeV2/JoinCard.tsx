import clsx from 'clsx';

import { Button } from '@/components/common/Button';
import { prefetchPrivyLayer } from '@/components/core/login/components/PrivyLayer/prefetch';
import { PL_NETWORK_ORGANIZATIONS_LABEL } from '@/services/explore-pl-network/constants';

import s from './HomeV2.module.scss';

/**
 * The Join the network card beside the hero's mission (prototype `JoinCard`, home-v2/StoryIntro.tsx). The doors follow
 * the mock, not the navbar pair: Sign up first and filled ("Sign up for free"), an "or" rule, Sign in outlined. This
 * page's reader is mostly new (993 of 1,100 signed-out visitors have no account), so Sign up leads.
 */
export function JoinCard({
  id,
  onSignIn,
  onSignUp,
  faces,
  className,
}: {
  id: string;
  onSignIn: () => void;
  onSignUp: () => void;
  /** Image URLs for the pile under the doors. */
  faces: string[];
  className?: string;
}) {
  return (
    <aside className={clsx(s.joinCard, className)} aria-labelledby={id}>
      <div className={s.joinHead}>
        <h2 id={id} className={s.joinTitle}>
          Join the network
        </h2>
        <p className={s.joinText}>Access the directory to find people, roles, deals, and what teams are shipping.</p>
      </div>
      {/* The product's glossy primary (follow-shared `.glossy`, the three-shadow
          highlight production hand-rolls on its headline presses) at size m. */}
      <Button size="m" style="fill" variant="primary" className={clsx(s.joinBtn, s.glossy)} onClick={onSignUp}>
        Sign up for free
      </Button>
      <div className={s.joinOr} aria-hidden>
        or
      </div>
      {/* Hover, focus or touch start loading the sign-in system, as the navbar's Sign in does (LAB-3092). */}
      <Button
        size="m"
        style="border"
        variant="neutral"
        className={s.joinBtn}
        onClick={onSignIn}
        onMouseEnter={prefetchPrivyLayer}
        onFocus={prefetchPrivyLayer}
        onTouchStart={prefetchPrivyLayer}
      >
        Sign in
      </Button>
      <p className={s.joinProof}>
        <span className={s.subAvatars} aria-hidden>
          {faces.map((src) => (
            <img key={src} className={clsx(s.subAvatar, s.joinFace)} src={src} alt="" loading="lazy" />
          ))}
        </span>
        {PL_NETWORK_ORGANIZATIONS_LABEL} organizations in the network
      </p>
    </aside>
  );
}
