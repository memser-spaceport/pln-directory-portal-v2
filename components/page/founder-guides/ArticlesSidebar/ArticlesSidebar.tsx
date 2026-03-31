'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useGetArticles } from '@/services/articles/hooks/useGetArticles';
import { ChevronDownIcon } from '@/components/icons';
import { SearchIcon } from '@/components/icons';
import s from './ArticlesSidebar.module.scss';

interface ArticlesSidebarProps {
  onNavigate?: () => void;
}

export default function ArticlesSidebar({ onNavigate }: ArticlesSidebarProps) {
  const pathname = usePathname();
  const { byCategory, isLoading } = useGetArticles();
  const [search, setSearch] = useState('');
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    if (!search.trim()) return byCategory;
    const q = search.toLowerCase();
    return byCategory
      .map((cat) => ({
        ...cat,
        articles: cat.articles.filter((a) => a.title.toLowerCase().includes(q)),
      }))
      .filter((cat) => cat.articles.length > 0);
  }, [byCategory, search]);

  // Auto-expand categories when searching
  const visibleCategories = useMemo(() => {
    if (search.trim()) {
      return new Set(filtered.map((c) => c.category));
    }
    return openCategories;
  }, [search, filtered, openCategories]);

  function toggleCategory(category: string) {
    if (search.trim()) return; // don't toggle when searching
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }

  return (
    <div className={s.root}>
      <div className={s.header}>
        <span className={s.title}>Founder Guides</span>
      </div>

      <div className={s.searchWrapper}>
        <SearchIcon className={s.searchIcon} />
        <input
          className={s.searchInput}
          type="text"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <nav className={s.nav}>
        {isLoading && (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className={s.skeletonCategory} />
            ))}
          </>
        )}

        {!isLoading &&
          filtered.map(({ category, articles }) => {
            const isOpen = visibleCategories.has(category);
            return (
              <div key={category} className={s.categoryGroup}>
                <button
                  className={s.categoryRow}
                  onClick={() => toggleCategory(category)}
                  aria-expanded={isOpen}
                >
                  <span className={s.categoryLabel}>{category}</span>
                  <span className={s.categoryBadge}>{articles.length}</span>
                  <ChevronDownIcon
                    className={isOpen ? s.caretOpen : s.caretClosed}
                    aria-hidden
                  />
                </button>

                {isOpen && (
                  <div className={s.articleList}>
                    {articles.map((article) => {
                      const href = `/founder-guides/${article.slugURL}`;
                      const isActive = pathname === href;
                      return (
                        <Link
                          key={article.uid}
                          href={href}
                          className={`${s.articleRow} ${isActive ? s.articleRowActive : ''}`}
                          onClick={onNavigate}
                        >
                          {article.title}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
      </nav>
    </div>
  );
}
