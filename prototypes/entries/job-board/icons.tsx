/**
 * Transcribed verbatim from the Demo Day "Make an intro" modal's local EnvelopeIcon
 * (ReferCompanyModal.tsx) — same 32px glyph, same hardcoded brand fill. It isn't
 * exported there, so this is a copy rather than an import.
 */
export const EnvelopeIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path
      d="M28 6H4C3.73478 6 3.48043 6.10536 3.29289 6.29289C3.10536 6.48043 3 6.73478 3 7V24C3 24.5304 3.21071 25.0391 3.58579 25.4142C3.96086 25.7893 4.46957 26 5 26H27C27.5304 26 28.0391 25.7893 28.4142 25.4142C28.7893 25.0391 29 24.5304 29 24V7C29 6.73478 28.8946 6.48043 28.7071 6.29289C28.5196 6.10536 28.2652 6 28 6ZM27 24H5V9.27375L15.3237 18.7375C15.5082 18.9069 15.7496 19.0008 16 19.0008C16.2504 19.0008 16.4918 18.9069 16.6763 18.7375L27 9.27375V24Z"
      fill="#1B4DFF"
    />
  </svg>
);

/** Local icons for the referral flow. Sized to inherit `currentColor` like the
 *  production jobs icons (ReferRoleRow/components/Icons.tsx). */
export const MailIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="1.75" y="3.25" width="12.5" height="9.5" rx="2" stroke="currentColor" strokeWidth="1.3" />
    <path d="M2.5 4.5 8 8.5l5.5-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

/**
 * The match mark's bolt. The repo holds two, both PLAA banner assets with baked-in
 * colour, and they are not the same drawing:
 *
 *  - `zap-outline-white.svg` is Feather's `zap` — a plain sharp zigzag.
 *  - `zap-yellow.svg` is Phosphor's `Lightning` — the angled shoulder and rounded
 *    joins, which is the family `components/icons/` is drawn from (UsersThree,
 *    NotePencil, PushPin, CaretLeft, MagicSparkles are all Phosphor).
 *
 * So this is the second one's geometry: a house-family glyph beside house-family
 * icons, rather than a Feather bolt sitting in a Phosphor set. Only the paint
 * changes — the asset is stroked in hardcoded `#EEFF00` for a dark banner, this
 * takes `currentColor` so it wears the Badge variant's brand tone.
 *
 * Filled, and that needs no second drawing: Phosphor's regular weight *strokes the
 * silhouette*, so filling the identical path is its fill weight. Same coordinates
 * as the asset, `fill` instead of `stroke`. A hand-copied fill path would have
 * been a different bolt pretending to be this one.
 *
 * Solid is right at this size anyway — a ~0.9px outline at 12px is lighter than the
 * 500-weight text it sits beside, and the mark should read at a glance.
 */
export const BoltIcon = () => (
  <svg width="12" height="12" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path
      d="M10.0662 14.7858H9.5307C7.79968 14.7858 6.93417 14.7858 6.56524 14.2152C6.19632 13.6445 6.54783 12.8494 7.25087 11.2593L9.36445 6.47877C10.0037 5.033 10.3233 4.31011 10.9433 3.90506C11.5633 3.5 12.3502 3.5 13.9241 3.5H16.3618C18.2737 3.5 19.2297 3.5 19.5902 4.12458C19.9508 4.74915 19.4765 5.58352 18.5279 7.25227L17.2774 9.45219C16.8058 10.2818 16.57 10.6966 16.5733 11.0361C16.5776 11.4774 16.8123 11.8839 17.1913 12.1065C17.4829 12.2779 17.9582 12.2779 18.9086 12.2779C20.1102 12.2779 20.711 12.2779 21.0239 12.4859C21.4304 12.7561 21.6432 13.2396 21.5686 13.7237C21.5112 14.0964 21.1071 14.5432 20.2988 15.437L13.8412 22.5777C12.5728 23.9802 11.9386 24.6815 11.5127 24.4596C11.0869 24.2377 11.2914 23.3125 11.7004 21.4622L12.5016 17.8379C12.8131 16.429 12.9688 15.7245 12.5943 15.2552C12.2198 14.7858 11.5019 14.7858 10.0662 14.7858Z"
      fill="currentColor"
    />
  </svg>
);
