'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { useMobileNavVisibility } from '@/hooks/useMobileNavVisibility';
import { useFounderGuidesAnalytics } from '@/analytics/founder-guides.analytics';
import ArticlesSidebar from '@/components/page/founder-guides/ArticlesSidebar/ArticlesSidebar';
import s from './FounderGuidesMobileNav.module.scss';

interface FounderGuidesMobileNavProps {
  children: React.ReactNode;
}

function HamburgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M3 5.5H17" stroke="#0a0c11" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M3 10H17" stroke="#0a0c11" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M3 14.5H17" stroke="#0a0c11" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M5 5L15 15" stroke="#0a0c11" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M15 5L5 15" stroke="#0a0c11" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default function FounderGuidesMobileNav({ children }: FounderGuidesMobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { trackMobileNavOpened } = useFounderGuidesAnalytics();
  const pathname = usePathname();
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Hide subheader on create/edit pages
  const isFormPage = pathname.includes('/new') || pathname.includes('/edit');

  useMobileNavVisibility(isOpen);

  const close = useCallback(() => setIsOpen(false), []);

  // Close drawer on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Close on Escape + body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };

    document.addEventListener('keydown', handleEscape);
    document.documentElement.classList.add('drawer-scroll-lock');

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.documentElement.classList.remove('drawer-scroll-lock');
    };
  }, [isOpen, close]);

  // Listen for "Select a guide to begin" button in FounderGuidesOverview
  useEffect(() => {
    const handleOpen = () => {
      trackMobileNavOpened();
      setIsOpen(true);
    };
    window.addEventListener('open-founder-guides-nav', handleOpen);
    return () => window.removeEventListener('open-founder-guides-nav', handleOpen);
  }, [trackMobileNavOpened]);

  // Auto-close when viewport crosses 1024px
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)');
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) setIsOpen(false);
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  // Focus management — move focus into drawer when opened
  useEffect(() => {
    if (isOpen) {
      closeRef.current?.focus();
    }
  }, [isOpen]);

  return (
    <>
      {/* Mobile subheader — visible below 1024px, hidden on form pages */}
      {!isFormPage && (
        <div className={s.subheader}>
          <div className={s.subheaderLeft}>
            <button
              ref={hamburgerRef}
              className={s.hamburgerButton}
              onClick={() => {
                trackMobileNavOpened();
                setIsOpen(true);
              }}
              aria-expanded={isOpen}
              aria-label="Open navigation menu"
            >
              <HamburgerIcon />
            </button>
            <span className={s.subheaderTitle}>Browse Guides</span>
          </div>
          <div id="mobile-subheader-actions" />
        </div>
      )}

      {children}

      {/* Side drawer portal */}
      {isOpen &&
        typeof window !== 'undefined' &&
        createPortal(
          <div className={s.overlay} onClick={close}>
            <div
              className={s.drawer}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Browse Guides navigation"
            >
              <div className={s.drawerHeader}>
                <button ref={closeRef} className={s.closeButton} onClick={close} aria-label="Close navigation menu">
                  <CloseIcon />
                </button>
                <span className={s.drawerTitle}>Browse Guides</span>
              </div>
              <div className={s.drawerContent}>
                <ArticlesSidebar onNavigate={close} hideHeader />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
