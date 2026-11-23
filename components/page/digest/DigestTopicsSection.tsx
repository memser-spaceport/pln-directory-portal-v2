import { DigestTopicsCard, type DigestTopicsCardProps } from './DigestTopicsCard';

import s from './DigestSidebar.module.scss';

export type DigestPersonalizeProps = {
  /** Signed out (from the server until the auth store hydrates): the card says what this reader is seeing. */
  signedOut: boolean;
  /** "Sign in to personalize" (LAB-3347). */
  onSignIn: () => void;
};

/**
 * The topics section (LAB-3348, LAB-3346 R1): "How personalization works" first, as the explainer of Add topics,
 * then the Add topics card. From 1100px it opens the side column; under that it sits right after the page header
 * (`top`), so a reader on a phone sees it before the stories. Signed out (LAB-3347) the explainer says what this reader
 * sees instead, since the signed-in sentence would be false for them, and ends with Sign in to personalize.
 */
export function DigestTopicsSection({
  variant,
  topics,
  personalize,
}: {
  variant: 'rail' | 'top';
  topics: DigestTopicsCardProps;
  personalize: DigestPersonalizeProps;
}) {
  return (
    <>
      <section className={s.card} aria-labelledby={`how-${variant}`}>
        <h2 id={`how-${variant}`} className={s.cardTitle}>
          How personalization works
        </h2>
        {personalize.signedOut ? (
          <>
            <p className={s.cardText}>
              You’re seeing the network’s top stories. Signed in, your digest leads with your topics, then the teams you
              follow.
            </p>
            <div className={s.actions}>
              <button type="button" className={s.link} onClick={personalize.onSignIn}>
                Sign in to personalize
              </button>
            </div>
          </>
        ) : (
          <p className={s.cardText}>
            Stories come from your topics first, then the teams you follow, then the network’s top stories.
          </p>
        )}
      </section>
      <DigestTopicsCard headingId={`topics-${variant}`} {...topics} />
    </>
  );
}
