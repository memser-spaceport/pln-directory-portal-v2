'use client';

import React, { useEffect, useState } from 'react';
import { ITOCHeading } from '@/utils/knowledge-base-toc.utils';
import s from './TableOfContents.module.scss';

interface Props {
  headings: ITOCHeading[];
}

export function TableOfContents({ headings }: Props) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the topmost visible heading
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        // Fire when heading crosses 80px from top (accounts for sticky navbar)
        rootMargin: '-80px 0px -70% 0px',
        threshold: 0,
      },
    );

    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const el = document.getElementById(id);
    // If we can't find the element, let the browser handle the anchor natively
    if (!el) return;
    e.preventDefault();
    // Offset 88px for the sticky navbar so the heading isn't hidden beneath it
    const top = el.getBoundingClientRect().top + window.scrollY - 88;
    window.scrollTo({ top, behavior: 'smooth' });
    setActiveId(id);
  };

  return (
    <nav className={s.root} aria-label="On this page">
      <p className={s.label}>On this page</p>
      <ul className={s.list}>
        {headings.map(({ id, text, level }) => (
          <li key={id} className={`${s.item} ${level === 3 ? s.h3 : s.h2}`}>
            <a
              href={`#${id}`}
              className={`${s.link} ${activeId === id ? s.active : ''}`}
              onClick={(e) => handleClick(e, id)}
            >
              {text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
