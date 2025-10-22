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

export function extractTextWithImages(input: string): string {
  // Decode HTML entities
  const decodedDoc = new DOMParser().parseFromString(input, 'text/html');
  const decodedHTML = decodedDoc.body.innerHTML;

  // Parse the decoded HTML
  const doc = new DOMParser().parseFromString(decodedHTML, 'text/html');

  function traverse(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;

      if (el.tagName.toLowerCase() === 'img') {
        return el.outerHTML; // keep <img> as-is
      }

      let result = '';

      // Preserve line breaks for <p>, <br>, etc.
      const blockTags = ['p', 'div', 'br'];
      const tag = el.tagName.toLowerCase();

      if (blockTags.includes(tag)) result += '\n';

      for (const child of Array.from(el.childNodes)) {
        result += traverse(child);
      }

      if (blockTags.includes(tag)) result += '\n';

      return result;
    }

    return '';
  }

  const output = traverse(doc.body);

  // Normalize whitespace: trim and collapse excessive empty lines
  return output.replace(/\n{3,}/g, '\n\n').trim();
}
