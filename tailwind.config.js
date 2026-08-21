/**
 * Tailwind, for the design canvas and NOTHING ELSE.
 *
 * DELETE WITH: the `design-canvas/` folder.
 *
 * portal-v2 styles itself with SCSS modules and has never had Tailwind. It is
 * here only because `design-canvas/core/` is a vendored, byte-for-byte frozen
 * viewer written in Tailwind arbitrary-value utilities — the canvas has one
 * appearance in every project that installs it, so its classes cannot be
 * translated to SCSS without breaking the check that guarantees that.
 *
 * Two deliberate narrowings keep this from touching a single existing style:
 *
 *   `content` names ONLY design-canvas/. Tailwind emits a utility when it sees
 *   it used, so scanning nothing else means emitting nothing else. Widening this
 *   glob to app/ or components/ would start generating utilities for class names
 *   that happen to appear in production SCSS, which is how this leaks.
 *
 *   `preflight: false`. Preflight is Tailwind's global reset — it would restyle
 *   every element in the app the moment the stylesheet loaded. It is safe to drop
 *   because the core uses no utility that depends on it: verified no `border-*`,
 *   `ring-*` or `divide-*` classes anywhere in design-canvas/core/, and those are
 *   the ones that render as nothing without preflight's `border-style: solid`.
 *
 * The output is NOT wired through a root postcss.config on purpose. Adding one
 * would replace Next's built-in PostCSS chain for every stylesheet in the repo.
 * Instead `npm run canvas:css` compiles this to a static file with the Tailwind
 * CLI, and only the canvas route imports it. Rerun it after upgrading the skill.
 *
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  content: ['./design-canvas/**/*.{ts,tsx}'],
  corePlugins: { preflight: false },
  theme: { extend: {} },
  plugins: [],
};
