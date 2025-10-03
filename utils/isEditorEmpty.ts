export function isEditorEmpty(html: string): boolean {
  const trimmed = html.trim();
  return trimmed === '<p><br></p>' || trimmed === '';
}
