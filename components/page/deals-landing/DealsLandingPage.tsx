'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge'; // used for hero badge
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
            <Badge variant="brand" className={s.heroBadge}>For vendors & tool providers</Badge>
            <h1 className={s.heroHeadline}>
              <span className={s.heroHeadlineLine}>Offer Exclusive Deals to</span>
              <span className={s.heroHeadlineLine}>the PL Network</span>
            </h1>
            <p className={s.heroSubheadline}>
              Reach 500+ vetted startups building in Web3, AI, and deep tech — and get your product into real workflows.
            </p>
            <div className={s.heroActions}>
              <Button style="fill" variant="primary" size="l" className={s.heroPrimaryBtn} onClick={openSubmitDealModal}>
                List Your Product
              </Button>
              <Button style="border" variant="neutral" size="l" className={s.heroSecondaryBtn} onClick={handleLoginClick}>
                Login to View Deals
              </Button>
            </div>
          </div>
        </section>

        {/* ── 2. TRUST / SOCIAL PROOF ── */}
        <section className={s.section}>
          <div className={s.sectionInner}>
            <h2 className={s.sectionTitle}>Companies already offering deals</h2>
            <p className={s.sectionCaption}>
              Trusted by teams supporting builders in the Protocol Labs ecosystem
            </p>
            <div className={s.logosGrid}>
              {vendorLogoItems.map((item) => (
                <div key={item.alt} className={s.logoCell}>
                  <img src={item.src} alt={item.alt} className={s.logoImg} />
                  <span className={s.logoName}>{item.alt}</span>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* ── 4. VALUE PROPOSITION ── */}
        <section className={s.section}>
          <div className={s.sectionInner}>
            <h2 className={s.sectionTitle}>Why Vendors Partner with Protocol Labs</h2>
            <p className={s.sectionCaption}>
              Reach high-quality founders building real products —<br />not browsing marketplaces.
            </p>
            <div className={s.exampleDealsGrid}>
              {mockValueProps.map((prop, i) => (
                <div key={i} className={s.exampleDealCard}>
                  <span className={s.valuePropIcon} aria-hidden="true">{prop.icon}</span>
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
            <h2 className={s.sectionTitle}>What We Look for in Partner Deals</h2>
            <p className={s.sectionCaption}>We prioritize offers that are immediately useful for founders.</p>
            <ul className={s.criteriaList}>
              {[
                'Clear value (credits, discounts, trials)',
                'Relevant to early-stage teams',
                'Simple redemption',
                'Fast to understand',
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
            <p className={s.sectionCaption}>Simple process. No integrations required.</p>
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
                subtitle={
                  <span>
                    Reach out to us on{' '}
                    <a href="mailto:pldemoday@protocol.ai">pldemoday@protocol.ai</a>
                    {' '}for any other questions.
                  </span>
                }
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
            <p className={s.finalCtaSubtext}>
              Share your offer with teams already building — not just browsing.
            </p>
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
