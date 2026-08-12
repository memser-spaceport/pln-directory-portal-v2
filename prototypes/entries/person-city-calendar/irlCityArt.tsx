/* Line-art city illustrations for the IRL location cards.
   Production serves these as per-location `icon` images (falling back to
   /images/irl/defaultCity.svg); the prototype draws equivalents inline so the
   strip reads like dev without inventing asset URLs. Single blue stroke,
   no fill — matching the production artwork's weight. */

const wrap = (children: React.ReactNode) => (
  <svg viewBox="0 0 120 96" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <g stroke="#3B7BFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </g>
  </svg>
);

/** Brandenburg-ish gate — Berlin. */
export const BerlinArt = () =>
  wrap(
    <>
      <path d="M30 78V44h60v34" />
      <path d="M24 44h72" />
      <path d="M38 78V56h10v22M56 78V56h8v22M72 78V56h10v22" />
      <path d="M42 44V34M54 44V34M66 44V34M78 44V34" />
      <path d="M46 26h28v8H46z" />
      <path d="M56 26v-6M64 26v-6" />
      <path d="M18 78h84" />
    </>,
  );

/** Torre de Belém-ish tower — Lisbon. */
export const LisbonArt = () =>
  wrap(
    <>
      <path d="M44 78V40h20v38" />
      <path d="M44 40l10-12 10 12" />
      <path d="M50 52h8M50 62h8" />
      <path d="M70 78V54h14v24" />
      <path d="M74 62h6" />
      <path d="M34 78V60h10v18" />
      <path d="M18 78h84" />
      <path d="M22 68q6-6 12 0" />
    </>,
  );

/** Merlion + skyline — Singapore. */
export const SingaporeArt = () =>
  wrap(
    <>
      <path d="M40 78V52q0-10 10-10t10 10v26" />
      <path d="M50 42V32q0-6 6-6h4" />
      <path d="M60 26a3 3 0 106 0 3 3 0 10-6 0" />
      <path d="M66 78V46h18v32" />
      <path d="M72 56h6M72 66h6" />
      <path d="M28 78V62h12v16" />
      <path d="M18 78h84" />
      <path d="M40 52q8 6 16 0" />
    </>,
  );

/** Pagoda / temple — Tokyo. */
export const TokyoArt = () =>
  wrap(
    <>
      <path d="M60 20l22 12H38z" />
      <path d="M44 32v8M76 32v8" />
      <path d="M34 40h52" />
      <path d="M42 48v8M78 48v8" />
      <path d="M32 56h56" />
      <path d="M46 64v14M74 64v14" />
      <path d="M40 78h40" />
      <path d="M56 64h8v14h-8z" />
      <path d="M18 78h84" />
    </>,
  );

export const CITY_ART: Record<string, () => React.ReactElement> = {
  Berlin: BerlinArt,
  Lisbon: LisbonArt,
  Singapore: SingaporeArt,
  Tokyo: TokyoArt,
};
