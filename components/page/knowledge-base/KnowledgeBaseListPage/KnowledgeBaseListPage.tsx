'use client';

import React, { useState, useMemo } from 'react';
import { IKBArticleMeta } from '@/types/knowledge-base.types';
import { IUserInfo } from '@/types/shared.types';
import { CategoryFilter } from '@/components/page/knowledge-base/CategoryFilter/CategoryFilter';
import { SearchBar } from '@/components/page/knowledge-base/SearchBar/SearchBar';
import { ArticleCard } from '@/components/page/knowledge-base/ArticleCard/ArticleCard';
import s from './KnowledgeBaseListPage.module.scss';

interface Props {
  articles: IKBArticleMeta[];
  userInfo: IUserInfo;
  isLoggedIn: boolean;
}

export function KnowledgeBaseListPage({ articles }: Props) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(articles.map((a) => a.category)));
    return cats.sort();
  }, [articles]);

  const filtered = useMemo(() => {
    return articles.filter((a) => {
      const matchesCategory = activeCategory === null || a.category === activeCategory;
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q)) ||
        a.author.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [articles, search, activeCategory]);

  return (
    <div className={s.root}>
      <div className={s.header}>
        <h1 className={s.title}>Knowledge Base</h1>
        <p className={s.subtitle}>
          Founder resources, guides, and playbooks from the Protocol Labs ecosystem.
        </p>
      </div>

      <div className={s.controls}>
        <SearchBar value={search} onChange={setSearch} />
        <CategoryFilter
          categories={categories}
          activeCategory={activeCategory}
          onChange={setActiveCategory}
        />
      </div>

      {filtered.length === 0 ? (
        <div className={s.empty}>
          <EmptyIcon />
          <p>No articles found{search ? ` for "${search}"` : ''}.</p>
        </div>
      ) : (
        <>
          <p className={s.resultCount}>
            {filtered.length} {filtered.length === 1 ? 'article' : 'articles'}
            {activeCategory ? ` in ${activeCategory}` : ''}
          </p>
          <div className={s.grid}>
            {filtered.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const EmptyIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
    <rect x="8" y="10" width="32" height="34" rx="4" stroke="#cbd5e1" strokeWidth="2" />
    <path d="M16 20H32M16 26H28M16 32H24" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
