export function decodeHtml(html: string): string {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
}

export function replaceImagesWithMarkdown(html: string): string {
  return html.replace(/<img[^>]*src="([^"]+)"[^>]*\/?>/gi, (_, src) => {
    const filename = src.split('/').pop() || 'image.png';
    return `![${filename}](${src})`;
  });
}
