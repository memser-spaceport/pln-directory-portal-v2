'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/common/Button';
import { FAQ } from '@/components/page/demo-day/InvestorPendingView/components/FAQ';
import { SubmitDealModal } from '@/components/page/deals/SubmitDealModal/SubmitDealModal';
import { useSubmitDealModalStore } from '@/services/deals/store';
import {
  vendorLogoItems,
  mockFaqItems,
  mockHowItWorksSteps,
  mockValueProps,
} from './mock-data';
import s from './DealsLandingPage.module.scss';

export function DealsLandingPage() {
  const router = useRouter();
  const { openModal: openSubmitDealModal } = useSubmitDealModalStore((state) => state.actions);

  const handleLoginClick = () => {
    router.push(`${window.location.pathname}${window.location.search}#login`);
  };

  return (
    <div className={s.root}>
      <div className={s.pageCard}>
      <div className={s.container}>

        {/* ── 1. HERO ── */}
        <section className={s.hero}>
          <div className={s.heroInner}>
            <h1 className={s.heroHeadline}>
              <span className={s.heroHeadlineLine}>Get Your Product in Front</span>
              <span className={s.heroHeadlineLine}>of 120+ PL Funded Teams</span>
            </h1>
            <p className={s.heroSubheadline}>
              Reach 120+ PL funded teams building across Web3, AI, and deep tech — and turn them into long-term customers.
            </p>
            <div className={s.heroActions}>
              <Button style="fill" variant="primary" size="l" className={s.heroPrimaryBtn} onClick={openSubmitDealModal}>
                List Your Product
              </Button>
            </div>
            <p className={s.heroSignInLink}>
              PL funded team?{' '}
              <a href="#login" onClick={(e) => { e.preventDefault(); handleLoginClick(); }}>
                Sign in to view Deals
              </a>
            </p>
          </div>
        </section>

        {/* ── 2. TRUST / SOCIAL PROOF ── */}
        <section className={s.section}>
          <div className={s.sectionInner}>
            <h2 className={s.sectionTitle}>Offer Deals Alongside</h2>
            <div className={s.logosGrid}>
              {vendorLogoItems.map((item) => (
                <div key={item.alt} className={s.logoCell}>
                  <img
                    src={item.src}
                    alt={item.alt}
                    className={`${s.logoImg} ${item.alt === 'Linear' ? s.logoImgScaled : ''}`}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* ── 4. VALUE PROPOSITION ── */}
        <section className={s.section}>
          <div className={s.sectionInner}>
            <h2 className={s.sectionTitle}>Why Partner with Protocol Labs</h2>
            <div className={s.exampleDealsGrid}>
              {mockValueProps.map((prop, i) => (
                <div key={i} className={s.exampleDealCard}>
                  <span className={s.valuePropIcon} aria-hidden="true"><ValuePropSvg name={prop.icon} /></span>
                  <h3 className={s.valuePropTitle}>{prop.title}</h3>
                  <p className={s.valuePropDesc}>{prop.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 5. WHAT MAKES A STRONG DEAL ── */}
        <section className={s.section}>
          <div className={s.sectionInner}>
            <h2 className={s.sectionTitle}>What We Look for in Deals</h2>
            <ul className={s.criteriaList}>
              {[
                'An exclusive discount not publicly available',
                'Minimum value of $1,000+ or 3+ months free on a paid plan',
                'Available to all PL funded teams (and to the broader PL network soon)',
                'Simple redemption — a code, a link, or a warm intro',
              ].map((item) => (
                <li key={item} className={s.criteriaItem}>
                  <span className={s.criteriaCheck} aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── 6. HOW IT WORKS ── */}
        <section className={s.section}>
          <div className={s.sectionInnerWide}>
            <h2 className={s.sectionTitle}>What Happens After You Submit</h2>
            <div className={s.steps}>
              {mockHowItWorksSteps.map((step) => (
                <div key={step.step} className={s.step}>
                  <div className={s.stepNumber}>{step.step}</div>
                  <div className={s.stepContent}>
                    <span className={s.stepTitle}>{step.title}</span>
                    <p className={s.stepDescription}>{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 7. FAQ ── */}
        <section className={s.section}>
          <div className={s.sectionInner}>
            <div className={s.faqWrapper}>
              <FAQ
                title="Frequently Asked Questions"
                subtitle={null}
                items={mockFaqItems}
                initialExpandedIndices={[0]}
              />
            </div>
          </div>
        </section>

        {/* ── 8. FINAL CTA ── */}
        <section className={s.finalCta}>
          <div className={s.finalCtaInner}>
            <h2 className={s.finalCtaTitle}>Start Reaching High-Quality Founders</h2>
            <Button style="fill" variant="primary" size="l" onClick={openSubmitDealModal}>
              List Your Product
            </Button>
            <p className={s.finalCtaNote}>No integration required • Reviewed in 3–5 days</p>
          </div>
        </section>

      </div>
      </div>
      <SubmitDealModal />
    </div>
  );
}

function ValuePropSvg({ name }: { name: string }) {
  const props = { width: 28, height: 28, viewBox: '0 0 24 24', fill: 'none', stroke: '#156ff7', strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (name) {
    case 'users':
      return <svg {...props}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
    case 'zap':
      return <svg {...props}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>;
    case 'chart':
      return <svg {...props}><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>;
    case 'shield':
      return <svg {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
    default:
      return null;
  }
}
