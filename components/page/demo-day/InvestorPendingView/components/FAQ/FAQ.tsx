'use client';

import { clsx } from 'clsx';
import React, { ReactNode, useState } from 'react';

import s from './FAQ.module.scss';

interface FAQItem {
  question: string;
  answer: ReactNode;
}

interface FAQProps {
  title?: string;
  items: FAQItem[];
  subtitle?: ReactNode;
}

const ChevronDownIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M5 7.5L10 12.5L15 7.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const FAQ: React.FC<FAQProps> = ({ title = 'Frequently Asked Questions', items, subtitle }) => {
  // Initialize with all items expanded by default
  const [expandedIndices, setExpandedIndices] = useState<Set<number>>(
    () => new Set(Array.from({ length: items.length }, (_, i) => i)),
  );

  const toggleItem = (index: number) => {
    setExpandedIndices((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  return (
    <div className={s.faqContainer}>
      <h2 className={s.title}>{title}</h2>
      {subtitle && <div className={s.subtitle}>{subtitle}</div>}
      <div className={s.divider} />
      <div className={s.itemsContainer}>
        {items.map((item, index) => (
          <div key={index} className={s.faqItem}>
            <button
              className={clsx(s.questionButton, {
                [s.expanded]: expandedIndices.has(index),
              })}
              onClick={() => toggleItem(index)}
              aria-expanded={expandedIndices.has(index)}
            >
              <div className={s.titleContainer}>
                <span className={s.questionLetter}>Q.</span>
                <span className={s.questionText}>{item.question}</span>
              </div>
            </button>
            <div
              className={clsx(s.answerWrapper, {
                [s.expanded]: expandedIndices.has(index),
              })}
            >
              <div className={s.answerContent}>
                <p className={s.answerText}>{item.answer}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
