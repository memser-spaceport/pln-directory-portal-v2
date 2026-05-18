'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { NavBar } from '@components/NavBar/NavBar';
import { Button } from '@components/Button/Button';
import { Badge } from '@components/Badge/Badge';
import { Checkbox } from '@components/Checkbox/Checkbox';
import { SearchInput } from '@components/SearchInput/SearchInput';
import { mockDeals, mockCategories } from './mock-data';
import s from './DealsMockup.module.scss';

const ChevronIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M3.5 5.5L7 9l3.5-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const UsersIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <circle cx="5" cy="4.5" r="2" stroke="currentColor" strokeWidth="1.2" />
    <path d="M1 11c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <circle cx="10" cy="4.5" r="1.5" stroke="currentColor" strokeWidth="1.2" />
    <path d="M10 9c1.1.4 2 1.4 2 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

export function DealsMockup() {
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (label: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  const clearAll = () => {
    setSearch('');
    setSelectedCategories(new Set());
  };

  const filtered = mockDeals.filter((deal) => {
    const matchesSearch =
      search.trim() === '' ||
      deal.name.toLowerCase().includes(search.toLowerCase()) ||
      deal.description.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      selectedCategories.size === 0 ||
      deal.categories.some((c) => selectedCategories.has(c));

    return matchesSearch && matchesCategory;
  });

  return (
    <div className={s.root}>
      <NavBar
        items={[
          { label: 'Directory', href: '/directory' },
          { label: 'Forum', href: '/forum' },
          { label: 'Deals', href: '/deals', active: true },
          { label: 'Events', href: '/events' },
        ]}
        userName="PL User"
        notificationCount={3}
      />

      <div className={s.layout}>
        {/* Sidebar */}
        <aside className={s.sidebar}>
          <div className={s.sidebarHeader}>
            <span className={s.filtersTitle}>Filters</span>
            <button className={s.clearAll} onClick={clearAll}>
              Clear All
            </button>
          </div>

          <div className={s.sidebarSection}>
            <SearchInput
              placeholder="Deal Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={() => setSearch('')}
              fullWidth
            />
          </div>

          <div className={s.sidebarSection}>
            <p className={s.categoryTitle}>Categories</p>
            <ul className={s.categoryList}>
              {mockCategories.map((cat) => (
                <li key={cat.id} className={s.categoryItem}>
                  <Checkbox
                    id={cat.id}
                    label={cat.label}
                    checked={selectedCategories.has(cat.label)}
                    onCheckedChange={() => toggleCategory(cat.label)}
                    size="sm"
                  />
                  <span className={s.categoryCount}>{cat.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Main content */}
        <main className={s.main}>
          <header className={s.pageHeader}>
            <div className={s.pageHeaderTop}>
              <div>
                <h1 className={s.pageTitle}>Deals</h1>
                <p className={s.pageSubtitle}>Exclusive deals for Protocol Labs founders.</p>
                <a href="#" className={s.requestLink}>
                  Don&apos;t see a deal? Request one →
                </a>
              </div>
              <Button variant="primary" styleType="border" size="sm" className={s.listBtn}>
                + List your Product
              </Button>
            </div>

            <div className={s.sortRow}>
              <span className={s.sortLabel}>Sort by:</span>
              <button className={s.sortDropdown}>
                Most popular <ChevronIcon />
              </button>
            </div>
          </header>

          <ul className={s.dealsList}>
            {filtered.length === 0 ? (
              <li className={s.empty}>No deals match your filters.</li>
            ) : (
              filtered.map((deal) => (
                <li key={deal.id} className={s.dealCard}>
                  <img
                    src={deal.logo}
                    alt={deal.name}
                    className={s.dealLogo}
                    width={48}
                    height={48}
                  />
                  <div className={s.dealBody}>
                    <h2 className={s.dealName}>{deal.name}</h2>
                    <p className={s.dealDescription}>{deal.description}</p>
                    <div className={s.dealFooter}>
                      <div className={s.dealBadges}>
                        {deal.categories.map((cat) => (
                          <Badge key={cat} color="blue" styleType="light" size="sm">
                            {cat}
                          </Badge>
                        ))}
                      </div>
                      <div className={s.dealMeta}>
                        <span className={clsx(s.dealMetaItem, deal.using > 0 && s.dealMetaUsing)}>
                          <UsersIcon /> {deal.using} using
                        </span>
                        {deal.issues > 0 && (
                          <span className={clsx(s.dealMetaItem, s.dealMetaIssues)}>
                            {deal.issues} {deal.issues === 1 ? 'issue' : 'issues'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </main>
      </div>
    </div>
  );
}
