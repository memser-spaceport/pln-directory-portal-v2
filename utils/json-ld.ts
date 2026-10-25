const JSON_LD_ESCAPES: Record<string, string> = {
  '<': '\\u003c',
  '>': '\\u003e',
  '&': '\\u0026',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029',
};

/**
 * Serializes JSON-LD for an inline `<script type="application/ld+json">`. Escapes `<`, `>`, `&`, U+2028 and U+2029, so
 * text such as `</script>` or `<!--` cannot end the script element or start markup. `JSON.parse` of the result returns
 * the same object (LAB-2980).
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/[<>&\u2028\u2029]/g, (char) => JSON_LD_ESCAPES[char]);
}
