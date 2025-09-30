import React, { useState } from 'react';
import { clsx } from 'clsx';
import s from './FAQ.module.scss';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQProps {
  title?: string;
  items: FAQItem[];
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

export const FAQ: React.FC<FAQProps> = ({ title = 'Frequently Asked Questions', items }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className={s.faqContainer}>
      <h2 className={s.title}>{title}</h2>
      <div className={s.divider} />
      <div className={s.itemsContainer}>
        {items.map((item, index) => (
          <div key={index} className={s.faqItem}>
            <button
              className={clsx(s.questionButton, {
                [s.expanded]: expandedIndex === index,
              })}
              onClick={() => toggleItem(index)}
              aria-expanded={expandedIndex === index}
            >
              <span className={s.questionText}>{item.question}</span>
              {/*<span*/}
              {/*  className={clsx(s.iconWrapper, {*/}
              {/*    [s.rotated]: expandedIndex === index,*/}
              {/*  })}*/}
              {/*>*/}
              {/*  <ChevronDownIcon />*/}
              {/*</span>*/}
            </button>
            <div
              className={clsx(s.answerWrapper, {
                [s.expanded]: expandedIndex === index,
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
