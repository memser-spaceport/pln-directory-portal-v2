import React from 'react';

/**
 * House glyph for the "Home" nav item. Neither navbar icon set ships one, so
 * this is Phosphor's House (Regular) — the same family the rest of the bar is
 * drawn from — kept at its native 256 viewBox so the curves stay exact at both
 * sizes rather than being hand-rescaled.
 *
 * It's a house, not the newspaper this started as: the destination is Home (see
 * ./home.ts). A newspaper names the cargo, and the feed already carries jobs and
 * events — the glyph would go stale the moment the mix changes.
 *
 * `size` exists because the two navbars disagree: the desktop set draws at 20,
 * the mobile bottom-bar set at 24. Passing the size keeps one glyph rather than
 * two copies that can drift apart.
 *
 * `currentColor` rather than the desktop set's hard-coded `#475569`, because
 * the mobile bar tints its active item — its icons are all `currentColor`, and
 * a hard-coded fill would leave Home the one item whose glyph stays grey next
 * to its own blue label. Desktop is unaffected: `.Trigger` sets
 * `--Text-text-menu, #475569`, the very colour that would have been hard-coded.
 */
export const HomeIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M218.83,103.77l-80-75.48a1.14,1.14,0,0,1-.11-.11,16,16,0,0,0-21.53,0l-.11.11L37.17,103.77A16,16,0,0,0,32,115.55V208a16,16,0,0,0,16,16H96a16,16,0,0,0,16-16V160h32v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V115.55A16,16,0,0,0,218.83,103.77ZM208,208H160V160a16,16,0,0,0-16-16H112a16,16,0,0,0-16,16v48H48V115.55l.11-.1L128,40l79.9,75.43.11.1Z"
      fill="currentColor"
    />
  </svg>
);

/** Static stand-in for the service-wired `NotificationBell`. */
export const BellIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M20.6156 17.2472C20.0681 16.3038 19.25 13.6397 19.25 10.1553C19.25 8.16621 18.4598 6.25856 17.0533 4.85203C15.6468 3.44551 13.7391 2.65533 11.75 2.65533C9.76088 2.65533 7.85322 3.44551 6.4467 4.85203C5.04018 6.25856 4.25 8.16621 4.25 10.1553C4.25 13.6406 3.43096 16.3038 2.88348 17.2472C2.74564 17.4837 2.67253 17.7524 2.67155 18.0262C2.67057 18.3 2.74175 18.5692 2.87789 18.8067C3.01403 19.0442 3.21031 19.2416 3.44694 19.379C3.68357 19.5164 3.95221 19.5889 4.22574 19.5892H8.06861C8.24177 20.4363 8.70201 21.1976 9.37164 21.7444C10.0413 22.2911 10.8791 22.5898 11.7434 22.5898C12.6078 22.5898 13.4456 22.2911 14.1152 21.7444C14.7848 21.1976 15.2451 20.4363 15.4182 19.5892H19.2743C19.5477 19.5886 19.8162 19.516 20.0526 19.3785C20.289 19.241 20.4851 19.0435 20.621 18.8061C20.757 18.5686 20.828 18.2996 20.827 18.0259C20.826 17.7523 20.7531 17.4837 20.6156 17.2472ZM11.75 20.8392C11.3417 20.839 10.9435 20.7115 10.6109 20.4744C10.2783 20.2372 10.0276 19.9022 9.89398 19.516H13.606C13.4724 19.9022 13.2217 20.2372 12.8891 20.4744C12.5565 20.7115 12.1583 20.839 11.75 20.8392ZM4.5359 17.8392C5.13887 16.5651 5.875 13.9057 5.875 10.1553C5.875 8.59794 6.49353 7.10425 7.59467 6.00311C8.69582 4.90196 10.1895 4.28345 11.7469 4.28345C13.3043 4.28345 14.798 4.90196 15.8991 6.00311C17.0003 7.10425 17.6188 8.59794 17.6188 10.1553C17.6188 13.9028 18.353 16.5622 18.9578 17.8392H4.5359Z"
      fill="#475569"
    />
  </svg>
);

/**
 * Static stand-in for the service-wired `ApplicationSearch` trigger.
 *
 * Stroked rather than a filled outline, with `non-scaling-stroke`, so the ring
 * stays 1.5px whether the bar draws it at 20 (mobile icon box) or 16 (the
 * desktop field). The filled version it replaces thinned to ~1px when the
 * field shrank it, reading lighter than MoreIcon, the bell and the (?) beside
 * it — which all sit at about 1.5px.
 */
export const SearchGlyph = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8.75" cy="8.75" r="6" stroke="#475569" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    <path
      d="M13.25 13.25L17.5 17.5"
      stroke="#475569"
      strokeWidth="1.5"
      strokeLinecap="round"
      vectorEffect="non-scaling-stroke"
    />
  </svg>
);
