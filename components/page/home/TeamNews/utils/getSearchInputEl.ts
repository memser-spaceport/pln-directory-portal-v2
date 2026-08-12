// DebouncedInput (inside SearchInput) doesn't expose its <input> via props or
// a forwarded ref, so this is the only way to read its live (undebounced)
// value or focus it programmatically. Centralized so there's one place — not
// two — that assumes it renders exactly one bare <input>.
export function getSearchInputEl(container: HTMLDivElement | null): HTMLInputElement | null {
  return container?.querySelector('input') ?? null;
}
