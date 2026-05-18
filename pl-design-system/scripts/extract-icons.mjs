/**
 * Extracts "regular" weight SVG paths from @phosphor-icons/react
 * and writes standalone SVG files to assets/icons/.
 *
 * Run once: node scripts/extract-icons.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DEFS = join(ROOT, 'node_modules/@phosphor-icons/react/dist/defs');
const OUT  = join(ROOT, 'assets/icons');

mkdirSync(OUT, { recursive: true });

// The 32 most-used icons in the PL design system
const ICONS = [
  'MagnifyingGlass',  // SearchInput, NavBar search
  'X',                // close buttons (Drawer, Sidebar, SearchInput)
  'Bell',             // NavBar notification
  'List',             // NavBar hamburger menu
  'MapPin',           // MemberCard location
  'CalendarBlank',    // OfficeHoursCard, schedule
  'Eye',              // ForumPostCard view count
  'ThumbsUp',         // ForumPostCard like count
  'ChatCircle',       // ForumPostCard comment count
  'ArrowRight',       // CTACard, FocusAreaCard stat rows
  'ArrowLeft',        // navigation back
  'CaretDown',        // Dropdown trigger, NavBar nav items
  'CaretRight',       // Accordion expand, sidebar items
  'CaretLeft',        // Accordion collapse
  'Check',            // Checkbox checked state
  'Plus',             // add actions
  'Minus',            // remove actions
  'ArrowSquareOut',   // TeamCard external link
  'Globe',            // TeamCard website link
  'Warning',          // Alert warning state
  'Info',             // Alert info state
  'CheckCircle',      // Alert success state
  'XCircle',          // Alert error state
  'User',             // generic profile / Avatar fallback
  'Users',            // member groups
  'Star',             // rating / favorites
  'PushPin',          // ForumPostCard pinned indicator
  'DotsThree',        // overflow / more menu
  'SortAscending',    // list sort controls
  'Funnel',           // filter controls
  'DownloadSimple',   // download actions
  'Envelope',         // contact / email
];

let ok = 0;
let fail = 0;

for (const name of ICONS) {
  const defPath = join(DEFS, `${name}.es.js`);
  let src;
  try {
    src = readFileSync(defPath, 'utf8');
  } catch {
    console.warn(`  ✗ ${name} — def file not found`);
    fail++;
    continue;
  }

  // The format is: "regular",\n    /* @__PURE__ */ a.createElement(a.Fragment, null, /* @__PURE__ */ a.createElement("path", { d: "..." }))
  // Find the "regular" entry then grab the first `d: "..."` that follows
  const regularIdx = src.indexOf('"regular"');
  let pathD = null;

  if (regularIdx !== -1) {
    const snippet = src.slice(regularIdx, regularIdx + 2000);
    const pathMatch = snippet.match(/\{ d: "([^"]+)"/);
    if (pathMatch) pathD = pathMatch[1];
  }

  if (!pathD) {
    console.warn(`  ✗ ${name} — could not extract regular path`);
    fail++;
    continue;
  }

  const svg = `<!-- Phosphor Icons — ${name} (Regular weight, 256×256)
  Source: @phosphor-icons/react (MIT License)
  Import in React: import { Ph${name} } from '@phosphor-icons/react'
-->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="16" height="16" fill="currentColor">
  <path d="${pathD}"/>
</svg>
`;
  const filename = name.replace(/([A-Z])/g, (m, c, i) => i === 0 ? c.toLowerCase() : `-${c.toLowerCase()}`);
  writeFileSync(join(OUT, `${filename}.svg`), svg);
  console.log(`  ✓ ${name} → ${filename}.svg`);
  ok++;
}

console.log(`\nDone: ${ok} icons written, ${fail} failed.`);
