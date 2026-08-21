/** Newspaper glyph for the team-updates badge. Same 16px box + `currentColor`
 *  stroke convention as the production jobs icons (ReferRoleRow/components/Icons.tsx). */
export const NewsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path
      d="M2 4.25A1.25 1.25 0 0 1 3.25 3h7.5A1.25 1.25 0 0 1 12 4.25v7.5A1.25 1.25 0 0 0 13.25 13H3.25A1.25 1.25 0 0 1 2 11.75v-7.5Z"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
    <path
      d="M12 6.5h1.75A.25.25 0 0 1 14 6.75v5a1.25 1.25 0 0 1-2.5 0"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M4.25 5.75h5.5M4.25 8h5.5M4.25 10.25h3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);
