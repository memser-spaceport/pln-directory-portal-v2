'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { NavBar } from '@components/NavBar';
import { Badge } from '@components/Badge';
import { Button } from '@components/Button';
import { FocusAreaCard } from '@components/FocusAreaCard';
import { mockUser, mockCTAItems, mockFocusAreas, mockUpdates } from './mock-data';
import styles from './HomeMockup.module.scss';

export function HomeMockup() {
  const [activeCarousel, setActiveCarousel] = useState(0);

  const navItems = [
    { label: 'Directory', href: '#' },
    { label: 'Events', href: '#' },
    { label: 'Forum', href: '#' },
    { label: 'Demo Day', href: '#' },
    { label: 'More', href: '#' },
  ];

  return (
    <div className={styles.root}>
      <NavBar
        items={navItems}
        userName="John Smith"
        notificationCount={3}
        avatar="https://placehold.co/32x32"
      />

      <main className={styles.main}>
        {/* Greeting */}
        <section className={styles.greeting}>
          <h1 className={styles.greetingTitle}>Hey, {mockUser.name}!</h1>
          <p className={styles.greetingSubtitle}>Quick actions to get the most from your network:</p>

          <div className={styles.ctaGrid}>
            {mockCTAItems.map((item, i) => (
              <a key={i} href={item.href} className={styles.ctaCard}>
                <span className={styles.ctaIcon}>{item.icon}</span>
                <div className={styles.ctaContent}>
                  <span className={styles.ctaTitle}>{item.title}</span>
                  <span className={styles.ctaDesc}>{item.description}</span>
                </div>
                <span className={styles.ctaArrow}>→</span>
              </a>
            ))}
          </div>
        </section>

        {/* Focus Areas */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Focus Areas</h2>
          <p className={styles.sectionDesc}>
            Protocol Labs&apos; vision for the future is built on four core focus areas that aim to harness humanity&apos;s potential for good.
          </p>
          <div className={styles.carouselWrapper}>
            <div className={styles.carouselTrack}>
              {mockFocusAreas.map((area) => (
                <div key={area.id} className={styles.carouselItem}>
                  <FocusAreaCard
                    title={area.title}
                    description={area.description}
                    teamCount={area.teams}
                    projectCount={area.projects}
                    href="#"
                  />
                </div>
              ))}
            </div>
            <div className={styles.carouselDots}>
              {[0, 1].map((i) => (
                <button
                  key={i}
                  className={clsx(styles.dot, { [styles.dotActive]: activeCarousel === i })}
                  onClick={() => setActiveCarousel(i)}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Recent Updates */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Recent Updates</h2>
            <Badge color="blue" styleType="light" size="md">Unread 3</Badge>
          </div>

          <div className={styles.updatesList}>
            {mockUpdates.map((update) => (
              <div key={update.id} className={clsx(styles.updateCard, update.unread && styles.unread)}>
                <div className={styles.updateInner}>
                  <div className={styles.updateIcon}>
                    {update.type === 'Demo Day' ? '📅' : update.type === 'Events' ? '🗓' : '💬'}
                  </div>
                  <div className={styles.updateContent}>
                    <span className={styles.updateType}>{update.type}</span>
                    <h3 className={styles.updateTitle}>{update.title}</h3>
                    {update.date && <span className={styles.updateDate}>📅 {update.date}</span>}
                    <p className={styles.updateBody}>{update.body}</p>
                    <div className={styles.updateMeta}>
                      <span className={styles.updateTime}>{update.timeAgo}</span>
                      {'attendees' in update && update.attendees && <span>👥 {update.attendees} People Going</span>}
                      {'likes' in update && update.likes && <span>👍 {update.likes}</span>}
                      {'replies' in update && update.replies && <span>💬 {update.replies}</span>}
                    </div>
                  </div>
                  {update.unread && <span className={styles.unreadDot} />}
                </div>
                <div className={styles.updateFooter}>
                  <Button variant="neutral" styleType="border" size="sm">View more →</Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
