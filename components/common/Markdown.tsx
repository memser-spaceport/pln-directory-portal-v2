import { FC } from 'react';
import MarkdownToJSX from 'markdown-to-jsx';
import HuskyCodeBlock from '../core/husky/husky-code-block';

interface MarkdownProps {
  children: string;
  className?: string;
}

const anchorWrapper = (props: any) => (
  <a style={{ color: 'blue' }} target="_blank" href={props.href}>
    {isNaN(props.children) ? props.children : `[${props.children}]`}
  </a>
);

export const Markdown: FC<MarkdownProps> = ({ children, className = '' }) => {
  return (
    <div className={className}>
      <MarkdownToJSX
        options={{
          overrides: {
            a: { component: anchorWrapper },
            p: { props: { style: { marginBottom: '6px', lineHeight: '22px', fontSize: '14px', maxWidth: '100%' } } },
            h1: { props: { style: { marginTop: '14px', marginBottom: '14px', fontSize: '22px' } } },
            h2: { props: { style: { marginTop: '12px', marginBottom: '12px', fontSize: '20px' } } },
            h3: { props: { style: { marginTop: '10px', marginBottom: '10px', fontSize: '18px' } } },
            h4: { props: { style: { marginTop: '8px', marginBottom: '8px', fontSize: '16px' } } },
            ol: { props: { style: { marginLeft: '16px' } } },
            ul: { props: { style: { marginLeft: '16px' } } },
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
    </div>
  );
}; 