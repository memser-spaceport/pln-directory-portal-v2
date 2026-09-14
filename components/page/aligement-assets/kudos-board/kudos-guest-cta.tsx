'use client';

import { useRouter } from 'next/navigation';

import styles from './kudos-guest-cta.module.css';

/**
 * Shown to logged-out visitors in place of the board itself. The board and its
 * feed stay unmounted — this is the sign-in path, not a preview.
 */
export function KudosGuestCta() {
  const router = useRouter();

  return (
    <div className={styles.guest}>
      <div className={styles.card}>
        <h1 className={styles.title}>Sign in to see the Kudos board</h1>
        <p className={styles.desc}>
          Kudos are how the network recognises each other&apos;s work. Sign in with your LabOS account to read the board
          and give kudos of your own.
        </p>
        <button
          className={styles.btn}
          onClick={() => router.push(`${window.location.pathname}${window.location.search}#login`, { scroll: false })}
        >
          Sign in
        </button>
      </div>
    </div>
  );
}
