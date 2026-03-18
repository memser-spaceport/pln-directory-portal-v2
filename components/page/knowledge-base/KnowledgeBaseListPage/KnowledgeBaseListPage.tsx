'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { IKBArticleMeta } from '@/types/knowledge-base.types';
import { IUserInfo } from '@/types/shared.types';
import s from './KnowledgeBaseListPage.module.scss';

// Canonical section order — categories in .md files map to these labels
const SECTIONS = [
  { id: 'Legal & Finance', label: 'Legal & Finance' },
  { id: 'US Visa / Immigration', label: 'US Visa / Immigration' },
  { id: 'Press & PR', label: 'Press & PR' },
  { id: 'Hire Handbook', label: 'Hire Handbook' },
  { id: 'Seed / Series A', label: 'Seed / Series A' },
  { id: 'PL Brand Use Rules', label: 'PL Brand Use Rules' },
  { id: 'Crypto & Token Launch', label: 'Crypto & Token Launch' },
];

interface Props {
  articles: IKBArticleMeta[];
  userInfo: IUserInfo;
  isLoggedIn: boolean;
}

export function KnowledgeBaseListPage({ articles }: Props) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(SECTIONS.map((sec) => sec.id))
  );
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Load bookmarks from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('kb-bookmarks');
      if (stored) setBookmarks(new Set(JSON.parse(stored)));
    } catch {
      // ignore
    }
  }, []);

  const toggleBookmark = (slug: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      try {
        localStorage.setItem('kb-bookmarks', JSON.stringify([...next]));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  // Group articles by section (category)
  const articlesBySection = useMemo(() => {
    const map: Record<string, IKBArticleMeta[]> = {};
    for (const article of articles) {
      if (!map[article.category]) map[article.category] = [];
      map[article.category].push(article);
    }
    return map;
  }, [articles]);

  // Apply search filter per section
  const filteredBySection = useMemo(() => {
    if (!search.trim()) return articlesBySection;
    const q = search.toLowerCase();
    const result: Record<string, IKBArticleMeta[]> = {};
    for (const [section, arts] of Object.entries(articlesBySection)) {
      const matched = arts.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q))
      );
      if (matched.length > 0) result[section] = matched;
    }
    return result;
  }, [articlesBySection, search]);

  const totalArticles = articles.length;
  const totalViews = articles.reduce((sum, a) => sum + (a.viewCount || 0), 0);
  const bookmarkedArticles = articles.filter((a) => bookmarks.has(a.slug));

  return (
    <div className={s.root}>
      {/* Mobile nav toggle */}
      <button
        className={s.mobileToggle}
        onClick={() => setMobileNavOpen((v) => !v)}
        aria-label="Toggle navigation"
      >
        <MenuIcon />
        Browse sections
      </button>

      {/* Backdrop for mobile nav */}
      {mobileNavOpen && (
        <div className={s.backdrop} onClick={() => setMobileNavOpen(false)} />
      )}

      {/* ─── Left sidebar ─── */}
      <nav className={`${s.sidebar} ${mobileNavOpen ? s.sidebarOpen : ''}`}>
        <div className={s.sidebarHeader}>
          <div className={s.sidebarBrand}>
            <BookIcon />
            <span className={s.sidebarTitle}>PL Knowledge Base</span>
          </div>
          <Link href="/admin/knowledge-base" className={s.adminLink} title="Manage articles">
            <EditIcon />
          </Link>
        </div>

        {/* Search */}
        <div className={s.searchBox}>
          <SearchIcon />
          <input
            className={s.searchInput}
            placeholder="Search articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className={s.clearSearch} onClick={() => setSearch('')}>
              ×
            </button>
          )}
        </div>

        {/* Sections + articles */}
        <div className={s.navSections}>
          {SECTIONS.map((section) => {
            const sectionArticles = filteredBySection[section.id] || [];
            const allSectionArticles = articlesBySection[section.id] || [];
            const isExpanded = expandedSections.has(section.id);

            return (
              <div key={section.id} className={s.navSection}>
                <button
                  className={s.sectionHeader}
                  onClick={() => toggleSection(section.id)}
                >
                  <span className={s.chevron}>{isExpanded ? '▾' : '▸'}</span>
                  <span className={s.sectionLabel}>{section.label}</span>
                  <span className={s.sectionCount}>
                    {search ? sectionArticles.length : allSectionArticles.length}
                  </span>
                </button>

                {isExpanded && (
                  <ul className={s.articleList}>
                    {sectionArticles.length > 0 ? (
                      sectionArticles.map((article) => (
                        <li key={article.slug} className={s.articleItem}>
                          <Link
                            href={`/knowledge-base/${article.slug}`}
                            className={s.articleLink}
                            onClick={() => setMobileNavOpen(false)}
                          >
                            <span className={s.articleTitle}>{article.title}</span>
                            <span className={s.articleMeta}>
                              {article.readingTime} min · {article.upvotes} ↑
                            </span>
                          </Link>
                          <button
                            className={`${s.bookmarkBtn} ${bookmarks.has(article.slug) ? s.bookmarkActive : ''}`}
                            onClick={(e) => toggleBookmark(article.slug, e)}
                            title={bookmarks.has(article.slug) ? 'Remove bookmark' : 'Save article'}
                          >
                            <BookmarkIcon filled={bookmarks.has(article.slug)} />
                          </button>
                        </li>
                      ))
                    ) : allSectionArticles.length === 0 ? (
                      <li className={s.comingSoon}>Coming soon</li>
                    ) : (
                      <li className={s.noResults}>No results</li>
                    )}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* ─── Main content — About page ─── */}
      <main className={s.main}>
        <div className={s.about}>
          <div className={s.aboutBadge}>Protocol Labs · Frontier Tech</div>

          <h1 className={s.aboutTitle}>
            10+ years at the frontier of Web3, Crypto, AI &amp; Neurotech
          </h1>

          <p className={s.aboutLead}>
            Protocol Labs has spent over a decade building foundational infrastructure for the
            decentralized web — IPFS, Filecoin, libp2p, and more — while backing and supporting
            hundreds of founders across Web3, crypto, AI, and frontier tech.
          </p>

          <p className={s.aboutBody}>
            This knowledge base aggregates the most asked, discussed, and battle-tested resources
            from across our portfolio. Think of it as the distilled wisdom from the questions
            founders ask us most — legal structures, fundraising mechanics, hiring playbooks,
            immigration guides, PR strategy, and crypto-native operating frameworks.
          </p>

          <p className={s.aboutBody}>
            Content is authored by PL-affiliated founders, operators, and the Protocol Labs team.
            Each article is a living document — updated as best practices evolve and your questions
            shape what we cover next. Use the sidebar to browse by topic, or save articles to
            revisit later.
          </p>

          {/* Stats */}
          <div className={s.stats}>
            <div className={s.statItem}>
              <span className={s.statValue}>{totalArticles}</span>
              <span className={s.statLabel}>Articles</span>
            </div>
            <div className={s.statItem}>
              <span className={s.statValue}>{SECTIONS.length}</span>
              <span className={s.statLabel}>Topics</span>
            </div>
            <div className={s.statItem}>
              <span className={s.statValue}>{totalViews.toLocaleString()}+</span>
              <span className={s.statLabel}>Views</span>
            </div>
            <div className={s.statItem}>
              <span className={s.statValue}>500+</span>
              <span className={s.statLabel}>Founders helped</span>
            </div>
          </div>

          {/* Recently updated */}
          <div className={s.articleGroup}>
            <h2 className={s.groupTitle}>Recently updated</h2>
            <div className={s.articleRowList}>
              {articles.slice(0, 4).map((article) => (
                <Link
                  key={article.slug}
                  href={`/knowledge-base/${article.slug}`}
                  className={s.articleRow}
                >
                  <span className={s.rowCategory}>{article.category}</span>
                  <span className={s.rowTitle}>{article.title}</span>
                  <span className={s.rowMeta}>
                    {article.readingTime} min · {article.upvotes} upvotes
                  </span>
                  <ChevronRightIcon />
                </Link>
              ))}
            </div>
          </div>

          {/* Bookmarks */}
          {bookmarkedArticles.length > 0 && (
            <div className={s.articleGroup}>
              <h2 className={s.groupTitle}>
                <BookmarkIcon filled={true} />
                Saved articles
              </h2>
              <div className={s.articleRowList}>
                {bookmarkedArticles.map((article) => (
                  <Link
                    key={article.slug}
                    href={`/knowledge-base/${article.slug}`}
                    className={s.articleRow}
                  >
                    <span className={s.rowCategory}>{article.category}</span>
                    <span className={s.rowTitle}>{article.title}</span>
                    <span className={s.rowMeta}>
                      {article.readingTime} min · {article.upvotes} upvotes
                    </span>
                    <ChevronRightIcon />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Sections overview grid */}
          <div className={s.articleGroup}>
            <h2 className={s.groupTitle}>Browse by topic</h2>
            <div className={s.topicGrid}>
              {SECTIONS.map((section) => {
                const sectionArticles = articlesBySection[section.id] || [];
                const count = sectionArticles.length;
                const firstSlug = sectionArticles[0]?.slug;

                if (firstSlug) {
                  return (
                    <Link
                      key={section.id}
                      href={`/knowledge-base/${firstSlug}`}
                      className={s.topicCard}
                    >
                      <span className={s.topicLabel}>{section.label}</span>
                      <span className={s.topicCount}>
                        {count} {count === 1 ? 'article' : 'articles'} →
                      </span>
                    </Link>
                  );
                }

                return (
                  <div key={section.id} className={`${s.topicCard} ${s.topicCardEmpty}`}>
                    <span className={s.topicLabel}>{section.label}</span>
                    <span className={s.topicCount}>Coming soon</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Icons ───────────────────────────────────────────────────

const MenuIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const BookIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M3 2.5C3 2.22 3.22 2 3.5 2H12.5C12.78 2 13 2.22 13 2.5V13L8 11L3 13V2.5Z"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
  </svg>
);

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path
      d="M9.5 2L12 4.5L5 11.5H2.5V9L9.5 2Z"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
  </svg>
);

const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3" />
    <path d="M9.5 9.5L12 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

const BookmarkIcon = ({ filled }: { filled: boolean }) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill={filled ? 'currentColor' : 'none'}>
    <path
      d="M2 2C2 1.45 2.45 1 3 1H9C9.55 1 10 1.45 10 2V11L6 8.5L2 11V2Z"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
    <path d="M5.5 3.5L9 7L5.5 10.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);
