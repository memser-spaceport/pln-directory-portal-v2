'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useFounderGuidesAnalytics } from '@/analytics/founder-guides.analytics';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useGetArticles } from '@/services/articles/hooks/useGetArticles';
import { useFounderGuidesCreateAccess } from '@/services/rbac/hooks/useFounderGuidesCreateAccess';
import { useFounderGuidesScopes } from '@/services/rbac/hooks/useFounderGuidesScopes';
import { SCOPE_LABELS } from '@/services/articles/constants';
import { extractHeadings } from '@/utils/markdown';
import s from './ArticlesSidebar.module.scss';

interface ArticlesSidebarProps {
  onNavigate?: () => void;
  hideHeader?: boolean;
}

// Inline 20x20 icons matching Phosphor style per Figma
function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="9" cy="9" r="5.5" stroke="#afbaca" strokeWidth="1.5" />
      <path d="M13.5 13.5L17 17" stroke="#afbaca" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CaretDownIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s ease', flexShrink: 0 }}
    >
      <path
        d="M5 7.5L10 12.5L15 7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Category icons – map to Phosphor-style 20×20 SVGs
function ScalesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M10 3.5V16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 16.5H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4.5 7L10 5.5L15.5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M4.5 7L3 11C3 12.1 3.9 13 5 13H4C5.1 13 6 12.1 6 11L4.5 7Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M15.5 7L14 11C14 12.1 14.9 13 16 13H15C16.1 13 17 12.1 17 11L15.5 7Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M3 11H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M14 11H17" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function ChartLineUpIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M3.5 14.5L8 9.5L11.5 12.5L16.5 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M13 6H16.5V9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UserCheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="8.5" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M2 16.5C2 13.739 4.239 11.5 7 11.5H10C12.761 11.5 15 13.739 15 16.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M13.5 10.5L15 12L18 9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M10 3L11.5 8.5H17L12.5 11.8L14 17L10 13.5L6 17L7.5 11.8L3 8.5H8.5L10 3Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LightbulbIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M10 3C7.239 3 5 5.239 5 8C5 9.72 5.9 11.22 7.25 12.1V13.5C7.25 13.776 7.474 14 7.75 14H12.25C12.526 14 12.75 13.776 12.75 13.5V12.1C14.1 11.22 15 9.72 15 8C15 5.239 12.761 3 10 3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M8 14V16C8 16.276 8.224 16.5 8.5 16.5H11.5C11.776 16.5 12 16.276 12 16V14"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M12 4L4 12" stroke="#8897ae" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4 4L12 12" stroke="#8897ae" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M8 3V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function DefaultCategoryIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <rect x="3" y="5" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 3H13C13.552 3 14 3.448 14 4V5H6V4C6 3.448 6.448 3 7 3Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 10H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 13H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function getCategoryIcon(category: string) {
  const c = category.toLowerCase();
  if (c.includes('legal') || c.includes('finance')) return <ScalesIcon />;
  if (c.includes('fund') || c.includes('invest')) return <ChartLineUpIcon />;
  if (c.includes('hir') || c.includes('team') || c.includes('people')) return <UserCheckIcon />;
  if (c.includes('ai') || c.includes('ml') || c.includes('machine')) return <SparkleIcon />;
  if (c.includes('request') || c.includes('guide')) return <LightbulbIcon />;
  return <DefaultCategoryIcon />;
}

export default function ArticlesSidebar({ onNavigate, hideHeader }: ArticlesSidebarProps) {
  const pathname = usePathname();
  const { byCategory, isLoading } = useGetArticles();
  const { scopes: userScopes } = useFounderGuidesScopes();
  const [search, setSearch] = useState('');
  const [selectedScope, setSelectedScope] = useState<string | null>(null);
  const [openCategories, setOpenCategories] = useState<Set<string> | null>(null);
  const { trackSidebarSearch, trackRequestGuideLinkClicked } = useFounderGuidesAnalytics();
  const searchDebounceSkipRef = useRef(true);

  useEffect(() => {
    if (searchDebounceSkipRef.current) {
      searchDebounceSkipRef.current = false;
      return;
    }
    const t = setTimeout(() => {
      trackSidebarSearch(search);
    }, 400);
    return () => clearTimeout(t);
  }, [search, trackSidebarSearch]);

  useEffect(() => {
    if (userScopes.length >= 2 && selectedScope === null) {
      setSelectedScope(userScopes[0]);
    }
  }, [userScopes, selectedScope]);

  const scopeFiltered = useMemo(() => {
    if (!selectedScope) return byCategory;
    return byCategory
      .map(({ category, articles }) => ({
        category,
        articles: articles.filter((a) => a.scope === selectedScope || a.scope === null),
      }))
      .filter(({ articles }) => articles.length > 0);
  }, [byCategory, selectedScope]);

  const effectiveOpenCategories = useMemo(
    () => openCategories ?? new Set(byCategory.map((c) => c.category)),
    [byCategory, openCategories],
  );

  const { canCreate } = useFounderGuidesCreateAccess();
  const isCreateActive = pathname === '/founder-guides/new';
  const isRequestActive = pathname === '/founder-guides/request';

  const filtered = useMemo(() => {
    if (!search.trim()) return scopeFiltered;
    const q = search.toLowerCase();
    return scopeFiltered
      .map((cat) => ({
        ...cat,
        articles: cat.articles.filter((a) => a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q)),
      }))
      .filter((cat) => cat.articles.length > 0);
  }, [scopeFiltered, search]);

  // Auto-expand categories when searching
  const visibleCategories = useMemo(() => {
    if (search.trim()) {
      return new Set(filtered.map((c) => c.category));
    }
    return effectiveOpenCategories;
  }, [search, filtered, effectiveOpenCategories]);

  function toggleCategory(category: string) {
    if (search.trim()) return;
    setOpenCategories((prev) => {
      const next = new Set(prev ?? byCategory.map((c) => c.category));
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
      {!hideHeader && (
        <div className={s.header}>
          <span className={s.title}>Browse Guides</span>
        </div>
      )}

      {userScopes.length >= 2 && (
        <div className={s.viewingAs}>
          <span className={s.viewingAsLabel}>Viewing as:</span>
          <select
            value={selectedScope ?? ''}
            onChange={(e) => setSelectedScope(e.target.value)}
            className={s.scopeSelect}
          >
            {userScopes.map((scope) => (
              <option key={scope} value={scope}>
                {SCOPE_LABELS[scope] ?? scope}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className={s.searchWrapper}>
        <span className={s.searchIconWrap}>
          <SearchIcon />
        </span>
        <input
          className={s.searchInput}
          type="text"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button className={s.searchClearBtn} type="button" aria-label="Clear search" onClick={() => setSearch('')}>
            <XIcon />
          </button>
        )}
      </div>

      {canCreate && (
        <Link
          href="/founder-guides/new"
          className={`${s.createLink} ${isCreateActive ? s.createLinkActive : ''}`}
          onClick={onNavigate}
        >
          <PlusIcon />
          Create New Guide
        </Link>
      )}

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
            const isCategoryActive = articles.some((article) => pathname === `/founder-guides/${article.slugURL}`);

            return (
              <div key={category} className={s.categoryGroup}>
                <button
                  type="button"
                  className={`${s.categoryRow} ${isCategoryActive ? s.categoryRowActive : ''}`}
                  onClick={() => toggleCategory(category)}
                  aria-expanded={isOpen}
                >
                  <span className={s.categoryIcon}>{getCategoryIcon(category)}</span>
                  <span className={s.categoryLabel}>{category}</span>
                  <span className={s.categoryBadge}>{articles.length}</span>
                  <span className={s.categoryCaret}>
                    <CaretDownIcon open={isOpen} />
                  </span>
                </button>

                {isOpen && (
                  <div className={s.articleList}>
                    {articles.map((article) => {
                      const href = `/founder-guides/${article.slugURL}`;
                      const isActive = pathname === href;
                      const headings = isActive ? extractHeadings(article.content) : [];
                      return (
                        <div key={article.uid}>
                          <Link
                            href={href}
                            className={`${s.articleRow} ${isActive ? s.articleRowActive : ''}`}
                            onClick={onNavigate}
                          >
                            <span className={s.articleTitle}>{article.title}</span>
                          </Link>
                          {headings.length > 0 && (
                            <div className={s.headingList}>
                              {headings.map((h) => (
                                <button
                                  key={h.id}
                                  type="button"
                                  className={s.headingItem}
                                  onClick={() => {
                                    document
                                      .getElementById(h.id)
                                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                  }}
                                >
                                  {h.text}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        <Link
          href="/founder-guides/request"
          className={`${s.requestLink} ${isRequestActive ? s.requestLinkActive : ''}`}
          onClick={() => {
            trackRequestGuideLinkClicked();
            onNavigate?.();
          }}
        >
          <span className={s.categoryIcon}>
            <LightbulbIcon />
          </span>
          <span className={s.categoryLabel}>Request a Guide</span>
        </Link>
      </nav>
    </div>
  );
}
