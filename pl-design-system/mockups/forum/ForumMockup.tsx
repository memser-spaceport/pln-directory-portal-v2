'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { NavBar } from '@components/NavBar/NavBar';
import { Button } from '@components/Button/Button';
import { ForumPostCard } from '@components/ForumPostCard/ForumPostCard';
import { mockForumPosts, forumTabs, type ForumTab } from './mock-data';
import s from './ForumMockup.module.scss';

const ChevronIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M3.5 5.5L7 9l3.5-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function ForumMockup() {
  const [activeTab, setActiveTab] = useState<ForumTab>('All');

  const filtered =
    activeTab === 'All'
      ? mockForumPosts
      : mockForumPosts.filter((p) => p.category === activeTab);

  return (
    <div className={s.root}>
      <NavBar
        items={[
          { label: 'Directory', href: '/directory' },
          { label: 'Forum', href: '/forum', active: true },
          { label: 'Deals', href: '/deals' },
          { label: 'Events', href: '/events' },
        ]}
        userName="PL User"
        notificationCount={3}
      />

      <main className={s.main}>
        <header className={s.pageHeader}>
          <h1 className={s.pageTitle}>Forum</h1>
          <p className={s.pageSubtitle}>
            A private space for vetted founders and operators in the PL network.
          </p>
        </header>

        <div className={s.controls}>
          <nav className={s.tabs} aria-label="Forum categories">
            {forumTabs.map((tab) => (
              <button
                key={tab}
                className={clsx(s.tab, activeTab === tab && s.tabActive)}
                onClick={() => setActiveTab(tab)}
                aria-pressed={activeTab === tab}
              >
                {tab}
              </button>
            ))}
          </nav>

          <div className={s.sortArea}>
            <span className={s.sortLabel}>Sort by:</span>
            <button className={s.sortDropdown}>
              Recently created <ChevronIcon />
            </button>
            <Button variant="primary" styleType="fill" size="sm" className={s.createBtn}>
              Create post +
            </Button>
          </div>
        </div>

        <ul className={s.postsList}>
          {filtered.length === 0 ? (
            <li className={s.empty}>No posts in this category yet.</li>
          ) : (
            filtered.map((post) => (
              <li key={post.id}>
                <ForumPostCard
                  title={post.title}
                  excerpt={post.excerpt}
                  authorName={post.authorName}
                  authorRole={post.authorRole}
                  authorAvatar={post.authorAvatar}
                  timeAgo={post.timeAgo}
                  viewCount={post.views}
                  likeCount={post.likes}
                  commentCount={post.comments}
                  href="#"
                />
              </li>
            ))
          )}
        </ul>
      </main>
    </div>
  );
}
