import localFont from 'next/font/local';

/**
 * Aileron (CC0), the logo-islands site's typeface, self-hosted so the page
 * makes no third-party font request. Used by the portfolio panel only: it is
 * marketing's piece set into our page and keeps its own look.
 */
export const aileron = localFont({
  src: './fonts/aileron-latin-400-normal.woff2',
  weight: '400',
  style: 'normal',
  display: 'swap',
  variable: '--font-aileron',
});
