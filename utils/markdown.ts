import { ReactNode, isValidElement, Children } from 'react';

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function getTextFromChildren(children: ReactNode): string {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(getTextFromChildren).join('');
  if (isValidElement(children) && (children.props as any)?.children) {
    return getTextFromChildren((children.props as any).children as ReactNode);
  }
  if (children && typeof children === 'object' && 'props' in children) {
    const props = (children as { props?: { children?: ReactNode } }).props;
    if (props?.children) return getTextFromChildren(props.children);
  }
  return '';
}

export interface Heading {
  text: string;
  id: string;
}

export function extractHeadings(content: string): Heading[] {
  const headingRegex = /^##\s+(.+)$/gm;
  const headings: Heading[] = [];
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    const text = match[1].trim();
    headings.push({ text, id: slugifyHeading(text) });
  }
  return headings;
}
