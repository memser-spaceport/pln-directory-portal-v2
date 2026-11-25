/**
 * The events portal's four focus areas (LAB-3404). The portal tags an event with the code and shows the name
 * (`pln-events`, `utils/constants.ts`), so the code is what a filter link keeps and the name is what a reader sees.
 */
const FOCUS_AREA_NAMES: Record<string, string> = {
  FA1: 'Digital Human Rights',
  FA2: 'Economies & Governance',
  FA3: 'AI & Robotics',
  FA4: 'Neurotech',
};

/** "FA4" for any spelling of the tag ("fa4", " FA4 "); null for a tag that is not a focus area. */
export function toFocusAreaCode(tag: string): string | null {
  const code = tag.trim().toUpperCase();
  return code in FOCUS_AREA_NAMES ? code : null;
}

/** "Neurotech" for "FA4"; any other text as it is. */
export function focusAreaName(value: string): string {
  const code = toFocusAreaCode(value);
  return code ? FOCUS_AREA_NAMES[code] : value;
}
