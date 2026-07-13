import type { Variants } from 'framer-motion';

export const CARD_STAGGER_SECONDS = 0.05;
export const CARD_TRANSITION = { duration: 0.28, ease: [0.4, 0, 0.2, 1] as const };

export function getContainerVariants(shouldReduceMotion: boolean): Variants {
  return {
    hidden: {},
    show: shouldReduceMotion ? {} : { transition: { staggerChildren: CARD_STAGGER_SECONDS } },
  };
}

// AddAiAppCard is a CTA, not content — a lighter, fade-only entrance sets it apart from the cards.
export function getAddCardVariants(): Variants {
  return {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: CARD_TRANSITION },
  };
}

export function getCardVariants(shouldReduceMotion: boolean): Variants {
  return {
    hidden: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: CARD_TRANSITION },
  };
}
