'use client';

import React from 'react';
import Link from 'next/link';
import { IKBArticleMeta } from '@/types/knowledge-base.types';
import s from './AdminKBListPage.module.scss';

interface Props {
  articles: IKBArticleMeta[];
}

export function AdminKBListPage({ articles }: Props) {
  return (
    <div className={s.root}>
      <div className={s.header}>
        <div>
          <h1 className={s.title}>Knowledge Base Admin</h1>
          <p className={s.subtitle}>{articles.length} articles · branch <code>design-preview</code></p>
        </div>
        <Link href="/admin/knowledge-base/new" className={s.newBtn}>
          <PlusIcon /> New Article
        </Link>
      </div>

      <div className={s.note}>
        <InfoIcon />
        <span>
          <strong>Prototype mode:</strong> The save button simulates publishing and shows a success message, but does not write any files. The intended MVP flow is to commit <code>.md</code> files directly to <code>design-preview</code> via the GitHub Contents API — no PR or manual deploy needed. That integration is not yet wired up.
        </span>
      </div>

      <div className={s.table}>
        <div className={s.tableHeader}>
          <span>Title</span>
          <span>Category</span>
          <span>Updated</span>
          <span>Views</span>
          <span></span>
        </div>

        {articles.length === 0 ? (
          <div className={s.empty}>No articles yet. Create your first one!</div>
        ) : (
          articles.map((article) => {
            const updatedDate = new Date(article.updatedAt).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
            });
            return (
              <div key={article.slug} className={s.row}>
                <div className={s.rowTitle}>
                  <Link href={`/knowledge-base/${article.slug}`} target="_blank" className={s.articleLink}>
                    {article.title}
                  </Link>
                  <span className={s.slug}>{article.slug}</span>
                </div>
                <span className={s.category}>{article.category}</span>
                <span className={s.date}>{updatedDate}</span>
                <span className={s.views}>{article.viewCount.toLocaleString()}</span>
                <div className={s.rowActions}>
                  <Link href={`/knowledge-base/${article.slug}`} target="_blank" className={s.actionBtn}>
                    <EyeIcon /> Preview
                  </Link>
                  <Link href={`/admin/knowledge-base/edit/${article.slug}`} className={s.editBtn}>
                    <EditIcon /> Edit
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 2V12M2 7H12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const InfoIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="7.5" cy="7.5" r="6.5" stroke="#3b82f6" strokeWidth="1.2" />
    <path d="M7.5 6.5V10.5M7.5 4.5V5" stroke="#3b82f6" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const EyeIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M6.5 3C4 3 2 6.5 2 6.5C2 6.5 4 10 6.5 10C9 10 11 6.5 11 6.5C11 6.5 9 3 6.5 3Z" stroke="currentColor" strokeWidth="1.2" />
    <circle cx="6.5" cy="6.5" r="1.5" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

const EditIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M9 1.5L11.5 4L4.5 11H2V8.5L9 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
  </svg>
);
