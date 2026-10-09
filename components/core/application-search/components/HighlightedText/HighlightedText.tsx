import React, { FC } from 'react';

interface Props {
  text: string;
  query: string;
  className?: string;
}

export const HighlightedText: FC<Props> = ({ text, query }) => {
  if (!query) return <>{text}</>;

  // The query is what the member typed: "c++" or "(" must match literally, not throw as a pattern.
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));

  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <span
            key={index}
            style={{
              color: 'rgba(21, 111, 247, 0.75)',
            }}
          >
            {part}
          </span>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
};
