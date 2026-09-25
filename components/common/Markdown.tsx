'use client';

import { FC, type ReactNode } from 'react';
import MarkdownToJSX from 'markdown-to-jsx';

import { useHuskyAnalytics } from '@/analytics/husky.analytics';

import HuskyCodeBlock from '../core/husky/husky-code-block';

interface CitationRef {
  index: number;
  title: string;
  directoryLink?: string;
  externalUrl?: string;
}

interface MarkdownProps {
  children: string;
  className?: string;
  sourceRefs?: CitationRef[];
}

export const Markdown: FC<MarkdownProps> = ({ children, className = '', sourceRefs }) => {
  const { trackHuskyCitationClicked } = useHuskyAnalytics();

  const anchorWrapper = (props: { href?: string; children?: unknown }) => {
    const cited = !Number.isNaN(Number(props.children));
    const ref = cited ? sourceRefs?.find((item) => item.index === Number(props.children)) : undefined;
    const href = (ref && (ref.directoryLink || ref.externalUrl)) || props.href;
    return (
      <a
        style={{ color: 'blue' }}
        target="_blank"
        rel="noreferrer"
        href={href}
        title={ref?.title}
        onClick={() => {
          if (cited && sourceRefs && href) trackHuskyCitationClicked(href);
        }}
      >
        {cited ? `[${props.children}]` : (props.children as ReactNode)}
      </a>
    );
  };

  return (
    <div className={`husky-md ${className}`.trim()}>
      <MarkdownToJSX
        options={{
          overrides: {
            a: { component: anchorWrapper },
            p: { props: { style: { marginBottom: '6px', lineHeight: '22px', fontSize: '14px', maxWidth: '100%' } } },
            h1: { props: { style: { marginTop: '14px', marginBottom: '14px', fontSize: '22px' } } },
            h2: { props: { style: { marginTop: '12px', marginBottom: '12px', fontSize: '20px' } } },
            h3: { props: { style: { marginTop: '10px', marginBottom: '10px', fontSize: '18px' } } },
            h4: { props: { style: { marginTop: '8px', marginBottom: '8px', fontSize: '16px' } } },
            code: { component: HuskyCodeBlock },
            table: { props: { style: { borderCollapse: 'collapse', width: '100%', marginBottom: '16px' } } },
            thead: { props: { style: { backgroundColor: '#f5f5f5' } } },
            th: { props: { style: { border: '1px solid #ddd', padding: '8px', textAlign: 'left' } } },
            td: { props: { style: { border: '1px solid #ddd', padding: '8px' } } },
          },
        }}
      >
        {children}
      </MarkdownToJSX>
      <style>{`
        .husky-md ul {
          margin: 4px 0 6px;
          padding-inline-start: 1.25em;
          list-style-type: disc;
        }
        .husky-md ul ul {
          list-style-type: circle;
          margin-bottom: 0;
        }
        .husky-md ol {
          margin: 4px 0 6px;
          padding-inline-start: 1.25em;
          list-style-type: decimal;
        }
      `}</style>
    </div>
  );
};
