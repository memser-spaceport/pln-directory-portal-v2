import React from 'react';
import MarkdownToJSX from 'markdown-to-jsx';
import HuskyCodeBlock from '@/components/core/husky/husky-code-block';
import { slugifyHeading } from '@/utils/knowledge-base-toc.utils';
import s from './ArticleBody.module.scss';

interface Props {
  content: string;
}

/** Recursively extracts plain text from React children (handles strings, arrays, elements). */
function extractText(children: React.ReactNode): string {
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) return children.map(extractText).join('');
  if (React.isValidElement(children)) return extractText((children.props as any).children);
  return '';
}

const anchorWrapper = (props: any) => (
  <a style={{ color: '#3b82f6' }} target="_blank" rel="noopener noreferrer" href={props.href}>
    {isNaN(props.children) ? props.children : `[${props.children}]`}
  </a>
);

const H2 = ({ children, ...rest }: any) => (
  <h2 id={slugifyHeading(extractText(children))} {...rest}>
    {children}
  </h2>
);

const H3 = ({ children, ...rest }: any) => (
  <h3 id={slugifyHeading(extractText(children))} {...rest}>
    {children}
  </h3>
);

export function ArticleBody({ content }: Props) {
  return (
    <div className={s.root}>
      <div className={s.markdown}>
        <MarkdownToJSX
          options={{
            overrides: {
              a: { component: anchorWrapper },
              h2: { component: H2 },
              h3: { component: H3 },
              p: { props: { style: { marginBottom: '12px', lineHeight: '1.7', fontSize: '15px' } } },
              h1: { props: { style: { marginTop: '14px', marginBottom: '14px', fontSize: '22px' } } },
              h4: { props: { style: { marginTop: '8px', marginBottom: '8px', fontSize: '15px', fontWeight: 600 } } },
              ol: { props: { style: { marginLeft: '20px', marginBottom: '12px' } } },
              ul: { props: { style: { marginLeft: '20px', marginBottom: '12px' } } },
              code: { component: HuskyCodeBlock },
              table: { props: { style: { borderCollapse: 'collapse', width: '100%', marginBottom: '20px' } } },
              thead: { props: { style: { backgroundColor: '#f8fafc' } } },
              th: { props: { style: { border: '1px solid #e2e8f0', padding: '10px 12px', textAlign: 'left', fontSize: '13px', fontWeight: 600 } } },
              td: { props: { style: { border: '1px solid #e2e8f0', padding: '10px 12px', fontSize: '13px' } } },
            },
          }}
        >
          {content}
        </MarkdownToJSX>
      </div>
    </div>
  );
}
