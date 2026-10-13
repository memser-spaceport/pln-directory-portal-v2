import MarkdownIt from 'markdown-it';

/* Raw HTML stays on: screenshots and pins are appended to the note as HTML blocks. */
const md = new MarkdownIt({ html: true, breaks: true });

export function markdownToHtml(markdown: string): string {
  return md.render(markdown).replace(/>\n</g, '><').trim();
}

/** Quill's HTML as markdown. Quill writes every space as `&nbsp;`, so those come back as spaces. */
export function htmlToMarkdown(html: string): string {
  if (!html) return '';
  const body = new DOMParser().parseFromString(html, 'text/html').body;
  return blocks(body).trim();
}

function blocks(parent: Element): string {
  return Array.from(parent.childNodes)
    .map((node) => (node instanceof Element ? block(node) : inline(node)))
    .filter((text) => text.trim())
    .join('\n\n');
}

function block(el: Element): string {
  const tag = el.tagName.toLowerCase();
  if (/^h[1-6]$/.test(tag)) return `${'#'.repeat(Number(tag[1]))} ${inline(el).trim()}`;
  if (tag === 'ul' || tag === 'ol') return list(el);
  if (tag === 'blockquote') return blocks(el).replace(/^/gm, '> ');
  if (tag === 'pre') return `\`\`\`\n${text(el).replace(/^\n|\n$/g, '')}\n\`\`\``;
  return escapeLineStarts(inline(el));
}

function list(el: Element): string {
  const ordered = el.tagName === 'OL';
  let n = Number(el.getAttribute('start') ?? 1);
  return Array.from(el.children)
    .map((li) => {
      const checked = li.getAttribute('data-list');
      const marker = ordered ? `${n++}.` : checked === 'checked' ? '- [x]' : checked === 'unchecked' ? '- [ ]' : '-';
      const own = Array.from(li.childNodes)
        .filter((child) => !(child instanceof Element && (child.tagName === 'UL' || child.tagName === 'OL')))
        .map(inline)
        .join('')
        .trim();
      const nested = Array.from(li.children)
        .filter((child) => child.tagName === 'UL' || child.tagName === 'OL')
        .map((child) => list(child).replace(/^/gm, ' '.repeat(ordered ? marker.length + 1 : 2)));
      return [`${marker} ${escapeLineStarts(own)}`, ...nested].join('\n');
    })
    .join('\n');
}

function inline(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return escapeText(text(node));
  if (!(node instanceof Element)) return '';
  const inner = () => Array.from(node.childNodes).map(inline).join('');
  switch (node.tagName.toLowerCase()) {
    case 'strong':
    case 'b':
      return wrap(inner(), '**');
    case 'em':
    case 'i':
      return wrap(inner(), '*');
    case 's':
    case 'del':
    case 'strike':
      return wrap(inner(), '~~');
    case 'u':
      return wrap(inner(), '<u>', '</u>');
    case 'code':
      return wrap(text(node), '`');
    case 'a':
      return `[${inner()}](${node.getAttribute('href') ?? ''})`;
    case 'img':
      return `![${node.getAttribute('alt') ?? ''}](${node.getAttribute('src') ?? ''})`;
    case 'br':
      return '\n';
    default:
      return inner();
  }
}

function text(node: Node): string {
  return (node.textContent ?? '').replace(/\u00a0/g, ' ');
}

/* Markers must touch the words they mark: `** bold **` is not bold. */
function wrap(content: string, open: string, close = open): string {
  const [, lead, body, trail] = /^(\s*)([\s\S]*?)(\s*)$/.exec(content) ?? ['', '', content, ''];
  return body ? `${lead}${open}${body}${close}${trail}` : content;
}

/* An underscore inside a word (snake_case) can't emphasise anything, so it is left alone. */
function escapeText(value: string): string {
  const isWordChar = (char = '') => /[A-Za-z0-9]/.test(char);
  return value
    .replace(/[\\`*]/g, '\\$&')
    .replace(/_/g, (underscore, i: number, all: string) =>
      isWordChar(all[i - 1]) && isWordChar(all[i + 1]) ? underscore : '\\_',
    );
}

/* Typed in Rich, "# x" or "1. x" at the start of a line is text, not a heading or a list. */
function escapeLineStarts(value: string): string {
  return value.replace(/^(\s*)([#>]|[-+](?=\s))/gm, '$1\\$2').replace(/^(\s*\d+)([.)])(?=\s)/gm, '$1\\$2');
}
