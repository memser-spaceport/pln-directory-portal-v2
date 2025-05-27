import React, { FC } from 'react';

interface Props {
  text: string;
  query: string;
  className?: string;
}

export const HighlightedText: FC<Props> = ({ text, query, className }) => {
  if (!query) return <>{text}</>;

  const parts = text.split(new RegExp(`(${query})`, 'gi'));

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
