'use client';

import { useState, ReactNode, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ChevronDownIcon } from '@/components/icons';
import SupportSection from '@/components/page/aligement-assets/rounds/sections/support-section';
import DisclaimerSection from '@/components/page/aligement-assets/rounds/sections/disclaimer-section';
import { useAlignmentAssetsAnalytics } from '@/analytics/alignment-assets.analytics';
import { useScrollDepthTracking } from '@/hooks/useScrollDepthTracking';
import { DISCLOSURE_URL, SUPPORT_EMAIL } from '@/constants/plaa';

export interface FAQItem {
  question: string;
  answer: string | ReactNode;
}

export interface FAQCategoryData {
  id: string;
  title: string;
  icon: string;
  items: FAQItem[];
}

const faqCategories: FAQCategoryData[] = [
  {
    id: 'contact-support',
    title: 'Contact & Support',
    icon: '/icons/mobile-icon.png',
    items: [
      {
        question: 'I have questions about the Surus platform, KYC, or the accreditation process, who should I contact?',
        answer: 'For questions about the Surus platform and features, please contact support@surus.io.',
      },
      {
        question: 'I have questions about the Hub & Explainer, Incentivized Activities, converting points to PLAA, or the Trust agreement. Who should I contact?',
        answer: 'Please contact plaa-wg@plrs.xyz. Please note that the AAWG has dedicated significant time to making this explainer as comprehensive as possible. Given our limited resources, response times to inquiries may take longer than expected, potentially up to one to two weeks. To enhance transparency, we will aim to publish answers to frequently asked questions approximately every two weeks for everyone\'s benefit. We appreciate your patience.',
      },
      {
        question: 'I\'m having trouble with the Surus platform. Who should I contact?',
        answer: 'For technical issues with the Surus platform, including login problems or wallet access, please contact support@surus.io.',
      },
    ],
  },
  {
    id: 'surus-platform',
    title: 'Surus Platform, Accreditation, and Platform Security',
    icon: '/icons/computer-icon.png',
    items: [
      {
        question: 'What is Surus?',
        answer: 'Surus is an institutional-grade asset management, custody, and compliance platform built to connect traditional and onchain finance. Powered by its wholly-owned, licensed financial institution - Surus Trust Company - Surus empowers builders to create, sell, and manage assets that benefit from time-tested legal structures and the efficiency and interoperability of tokenization. To get in touch with Surus about collaborating on another project, please contact hello@surus.io. To learn more, visit www.surus.io.',
      },
      {
        question: 'What role does Surus play in the Alignment Asset experiment?',
        answer: 'Surus is a member of the Protocol Labs Network and a core contributor to the Working Group for the Alignment Asset project, providing: Fiduciary services, via Surus Trust Company, to the Alignment Asset Trust in accordance with the trust agreement, including executing the trust\'s investment strategy and the administration of PLAA buybacks, Tokenization and wallet services for users, and KYC, KYB, and accreditation services.',
      },
      {
        question: 'How secure is Surus\' platform architecture?',
        answer: 'Surus\' platform employs advanced technology and industry-leading security, including the Argon2 brute force-resistant password hashing algorithm, orchestrated container management via Kubernetes for system reliability, distributed ACID SQL transactions to prevent data loss, required TLS1.3+ encryption for encrypted information exchange, and a Wasm-based client to avoid Javascript.',
      },
      {
        question: 'How does Surus handle tokenization and wallets?',
        answer: 'Surus\' asset tokenization platform is chain- and token standard-agnostic. This allows for maximum flexibility for future AA experiments. When a user successfully completes all compliance requirements, they are fully authorized on the platform. At that time, a multi-party computation (MPC) wallet is created immediately upon their first successful log-in attempt. Tokens settled are held securely in these wallets. Keys are managed and securely backed up invisibly and automatically in the user\'s browser and our wallet provider partner Fordefi\'s cloud storage environment. Surus\' platform is designed with the ease-of-use of a Web2 application while leveraging all of the advantages of Web3. Actions such as transaction-signing and smart contract execution are conducted via a familiar Web2 interface in order to help bring more people and capital onchain.',
      },
    ],
  },
  {
    id: 'onboarding',
    title: 'Onboarding',
    icon: '/icons/settings-icon.png',
    items: [
      {
        question: 'To obtain an accreditation letter, will a credit check be conducted?',
        answer: (
          <div>
            <p style={{ marginBottom: '16px' }}>
              No. Instead, you will need to submit documentation to verify your income for the last two years.
            </p>
            <p style={{ marginBottom: '16px' }}>
              For more information on the general accreditation process, Parallel Markets offers the following FAQs:{' '}
              <a
                href="https://support.parallelmarkets.com/hc/en-us/sections/4417804182925-Accreditation"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#156ff7', textDecoration: 'underline', wordBreak: 'break-word' }}
              >
                https://support.parallelmarkets.com/hc/en-us/sections/4417804182925-Accreditation
              </a>
            </p>
            <p style={{ fontStyle: 'italic', marginBottom: '0' }}>
              Disclaimer: Protocol Labs Inc. is not affiliated with Parallel Markets. This link is provided for convenience and does not constitute an endorsement or warranty of Parallel Markets&apos; products or services. By clicking this link, you acknowledge that you are leaving our site and are subject to Parallel Markets&apos; terms of use and privacy policy. Protocol Labs Inc. assumes no responsibility for the accuracy of their information or the quality of their services.
            </p>
          </div>
        ),
      },
      {
        question: 'If I\'m a contractor and do not have a W-2, can I submit a 1099? Can I submit multiple 1099s? Can I submit a combination of W-2s and 1099s for the same tax year?',
        answer: (
          <div>
            <p style={{ marginBottom: '16px' }}>
              Yes, you can submit a 1099 if you do not have a W-2. You can only submit one document per year for income verification. If you have multiple 1099s or W-2s for the same tax year, it is recommended to submit a copy of your filed Form 1040 to show your combined income for the period. A combination of W-2s and 1099s for the same tax year is not accepted unless consolidated into a filed Form 1040 or combined into one PDF document.
            </p>
            <p style={{ marginBottom: '16px' }}>
              For more information on the general accreditation process, Parallel Markets offers the following FAQs:{' '}
              <a
                href="https://support.parallelmarkets.com/hc/en-us/sections/4417804182925-Accreditation"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#156ff7', textDecoration: 'underline', wordBreak: 'break-word' }}
              >
                https://support.parallelmarkets.com/hc/en-us/sections/4417804182925-Accreditation
              </a>
            </p>
            <p style={{ fontStyle: 'italic', marginBottom: '0' }}>
              Disclaimer: Protocol Labs Inc is not affiliated with Parallel Markets. The link above is provided as a convenience to you and does not constitute an endorsement, representation or warranty by Protocol Labs Inc regarding Parallel Markets or its products, services or the accuracy of any information provided. Once you access Parallel Markets&apos; third party site, through the provided link, you acknowledge that the third party&apos;s terms of use and privacy policy apply, and you agree to comply with them. Protocol Labs Inc does not guarantee any of the information provided by Parallel Markets or the quality of their services.
            </p>
          </div>
        ),
      },
      {
        question: 'Is the PLAA experiment only for individuals who work for PL?',
        answer: 'No! If you\'ve received an invite to join the PLAA experiment, you were intentionally chosen as a participant.',
      },
    ],
  },
  {
    id: 'aa-points',
    title: 'PLAA, AA Points & KPI categories',
    icon: '/icons/notes-icon.png',
    items: [
      {
        question: 'How can I receive PLAA?',
        answer: 'Eligibility for PLAA is ultimately determined by the Trust, but it\'s generally received as a reward or AA points earned through incentivized activities.',
      },
      {
        question: 'What\'s the difference between the two paths?',
        answer: (
          <p style={{ margin: 0 }}>
            <strong>Reward</strong>-based PLAA is allocated to eligible service providers of companies within the Protocol Labs Network. Points-based PLAA is collected over time — you complete incentivized activities, accumulate AA points, and those points may convert into PLAA according to the program&apos;s published conversion terms.
          </p>
        ),
      },
      {
        question: 'When can I start collecting points?',
        answer: 'You become eligible to collect points after your onboarding to the Surus platform is confirmed by Surus. However, you may start working on the incentivized activities as soon as you submit your accreditation letter to Surus for verification. Once your account is approved by Surus, we will retroactively award the points you collected based on your incentivized activities.',
      },
      {
        question: 'What if there are no points collected in a particular KPI category in a snapshot period?',
        answer: 'If no points are collected in any of the KPI categories in a particular snapshot period, then the PLAA emissions for that particular KPI category shall be 0 for the corresponding snapshot period.',
      },
      {
        question: 'What if everyone tries to collect points in one particular KPI category?',
        answer: 'The PLAA conversion mechanism is designed to reward efforts in less crowded categories. If many participants target one category, its total emissions will spread thinly. Conversely, if you collect points in a category with lower overall participation, you will receive a proportionately larger share of that category\'s emissions. This balancing feature is intentional—it encourages diverse contributions across all network dimensions.',
      },
      {
        question: 'Can you collect AA points in multiple KPI categories in the same snapshot period?',
        answer: (
          <p style={{ margin: 0 }}>
            Yes. For more information, please review &lsquo;
            <a href="#point-to-rights-conversion" style={{ color: '#156ff7', textDecoration: 'underline' }}>
              Points-to-PLAA Conversion
            </a>
            .&rsquo;
          </p>
        ),
      },
    ],
  },
  {
    id: 'point-to-rights-conversion',
    title: 'Points-to-PLAA Conversion',
    icon: '/icons/loop-icon.png',
    items: [
      {
        question: 'How do points convert to PLAA?',
        answer: (
          <div>
            <p style={{ marginBottom: '16px' }}>
            Points can convert to PLAA at the end of each monthly snapshot period using a predefined points-to-PLAA formula tied to the KPI emissions schedule (shown below) and the 10,000-PLAA monthly cap. The actual number of PLAA the Trust issues each month may be less than 10,000 if no participants collect points in certain KPI categories.
            </p>

            <p style={{ marginBottom: '16px' }}>
            The conversion happens in three steps:
            </p>
            
            <ol style={{ paddingLeft: '24px', marginBottom: '16px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>Category allocation:</strong> Each KPI category (Programs, Network Tooling, etc.) is allocated a portion of the 10,000 monthly PLAA based on its network weight (see table below). However, if no participants collect points in a specific category during the snapshot period, no PLAA will be distributed for that category that month.
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>PLAA Percentage Calculation:</strong> [Your Points in a Category] ÷ [Total Points in that Category] = [Your Portion as a Percentage]
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>PLAA distribution:</strong> [Your Percentage] × [PLAA Allocated to that Category] = [Your PLAA]
              </li>
            </ol>

            <p style={{ marginBottom: '16px' }}>
            Because PLAA are settled through whole tokens, any calculated settlement amounts are rounded down to the nearest whole token. This rounding rule is applied consistently to all participants to ensure fairness and to prevent the number of tokens issued in connection with the settlement of PLAA from exceeding the applicable monthly cap.
            </p>

            <p style={{ marginBottom: '16px' }}>
            While the Alignment Asset Trust ultimately controls the issuance of PLAA and the settlement of such PLAA through tokens, the conversion of Points into PLAA, and the settlement of such PLAA, is not guaranteed. Nevertheless, participation today allows you to engage with and help shape this evolving initiative.
            </p>

            <div style={{ backgroundColor: '#f1f5f9', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>Example:</p>
              <ul style={{ paddingLeft: '20px', listStyleType: 'disc', marginBottom: '0' }}>
                <li style={{ marginBottom: '4px' }}>Network Tooling gets 19.35% of 10,000 PLAA = 1,935 PLAA available for Network Tooling</li>
                <li style={{ marginBottom: '4px' }}>You collected 100 points; everyone collected 1,000 points total</li>
                <li style={{ marginBottom: '4px' }}>Your portion of points: 100 ÷ 1,000 = 10%</li>
                <li>Your PLAA: 10% × 1,935 = ~194 PLAA</li>
              </ul>
            </div>

            <p style={{ marginBottom: '16px' }}>You can collect PLAA from multiple categories in the same period. Such PLAA may ultimately be settled through tokens and redeemed for cash or other consideration in accordance with the applicable settlement process.</p>

            {/* KPI categories Table */}
            <div style={{ overflowX: 'auto' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>KPI Emissions Schedule</p>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em', border: '1px solid #e2e8f0' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', borderBottom: '2px solid #3b82f6' }}>KPI categories</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', borderBottom: '2px solid #3b82f6' }}>KPI Weight</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', borderBottom: '2px solid #3b82f6' }}>% of Total Emissions</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', borderBottom: '2px solid #3b82f6' }}>Emission Each Snapshot</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ fontWeight: 'bold', padding: '10px' }}>Network Tooling</td>
                    <td style={{ fontWeight: 'bold', padding: '10px', textAlign: 'right' }}>1.2000</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>19.35%</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>1,935</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                    <td style={{ fontWeight: 'bold', padding: '10px' }}>Knowledge</td>
                    <td style={{ fontWeight: 'bold', padding: '10px', textAlign: 'right' }}>1.4000</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>22.58%</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>2,258</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ fontWeight: 'bold', padding: '10px' }}>People/Talent</td>
                    <td style={{ fontWeight: 'bold', padding: '10px', textAlign: 'right' }}>0.9000</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>14.52%</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>1,452</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                    <td style={{ fontWeight: 'bold', padding: '10px' }}>Programs</td>
                    <td style={{ fontWeight: 'bold', padding: '10px', textAlign: 'right' }}>1.1500</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>18.55%</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>1,855</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ fontWeight: 'bold', padding: '10px' }}>Brand</td>
                    <td style={{ fontWeight: 'bold', padding: '10px', textAlign: 'right' }}>0.2500</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>4.03%</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>403</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                    <td style={{ fontWeight: 'bold', padding: '10px' }}>Projects</td>
                    <td style={{ fontWeight: 'bold', padding: '10px', textAlign: 'right' }}>1.3000</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>20.97%</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>2,097</td>
                  </tr>
                  <tr style={{ backgroundColor: '#e0f2fe', fontWeight: 'bold' }}>
                    <td style={{ fontWeight: 'bold', padding: '10px' }}>Sum</td>
                    <td style={{ fontWeight: 'bold', padding: '10px', textAlign: 'right' }}>6.2000</td>
                    <td style={{ fontWeight: 'bold', padding: '10px', textAlign: 'right' }}>100.00%</td>
                    <td style={{ fontWeight: 'bold', padding: '10px', textAlign: 'right' }}>10,000</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ),
      },
      {
        question: 'What are KPI categories and how do they work?',
        answer: (
          <div>
            <p style={{ marginBottom: '16px' }}>
              KPI categories group similar activities together—for example: Programs, Knowledge, Network Tooling, People/Talent, etc.
            </p>
            <p style={{ marginBottom: '16px' }}>
              Each category receives a portion of monthly PLAA based on its network weight. Example:
            </p>
            <ul style={{ paddingLeft: '24px', marginBottom: '16px', listStyleType: 'disc' }}>
              <li style={{ marginBottom: '4px' }}>Knowledge: 22.58% of PLAA</li>
              <li style={{ marginBottom: '4px' }}>Programs: 18.55% of PLAA</li>
              <li>Network Tooling: 19.35% of PLAA</li>
            </ul>
            <p>
              The weights reflect what types of contribution we think create the most impact and value for the network at that time, and so they will change as network needs evolve.
            </p>
          </div>
        ),
      },
      {
        question: 'Do my points from different activities combine?',
        answer: (
          <div>
            <p style={{ marginBottom: '16px' }}>
              Yes, points combine within their KPI category, but each category is calculated separately.
            </p>
            <div style={{ backgroundColor: '#f1f5f9', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>Example:</p>
              <p style={{ marginBottom: '8px' }}>If you collect:</p>
              <ul style={{ paddingLeft: '20px', listStyleType: 'disc', marginBottom: '8px' }}>
                <li style={{ marginBottom: '4px' }}>100 Network Tooling points (Directory Profile + other)</li>
                <li>200 People/Talent points (Referrals + Compensation Data)</li>
              </ul>
              <p>You&apos;ll collect points from both categories based on your portion of each.</p>
            </div>
          </div>
        ),
      },
      {
        question: 'What if I don\'t have enough points for a whole PLAA?',
        answer: (
          <div>
            <p style={{ marginBottom: '16px' }}>
              Only whole PLAA are issued. If your points don&apos;t add up to at least one PLAA in any category, you won&apos;t collect PLAA that snapshot period.
            </p>
            <div style={{ backgroundColor: '#f1f5f9', padding: '16px', borderRadius: '8px' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>Example:</p>
              <p style={{ marginBottom: '8px' }}>If you collect:</p>
              <ul style={{ paddingLeft: '20px', listStyleType: 'disc', marginBottom: '0' }}>
                <li style={{ marginBottom: '4px' }}>100 Network Tooling points (updating your Directory Profile)</li>
                <li style={{ marginBottom: '4px' }}>Network Tooling has 1,935 PLAA available</li>
                <li style={{ marginBottom: '4px' }}>Total Network Tooling points collected for the snapshot period: 193,620 points (realistic if many people complete profiles and host office hours in the same snapshot period)</li>
                <li style={{ marginBottom: '4px' }}>Your portion: 100 ÷ 193,620 = 0.00052%</li>
                <li style={{ marginBottom: '4px' }}>Your PLAA: 0.00052% × 1,935 = 0.9998 PLAA</li>
                <li>You receive: 0 PLAA</li>
              </ul>
            </div>
          </div>
        ),
      },
      {
        question: 'How is my portion of PLAA calculated?',
        answer: (
          <div>
            <ol style={{ paddingLeft: '24px', marginBottom: '16px' }}>
              <li style={{ marginBottom: '8px' }}>
                Determine your individual contribution as a percentage of each KPI Category: <strong>[Your Points in a Category] ÷ [Total Points in that Category] = [Your Portion as a Percentage]</strong>
              </li>
              <li>
                Multiply your individual contributions as a percentage by the KPI Emissions (total rewards allocated to that KPI Category): <strong>[Your Percentage] × [PLAA Allocated to that Category] = [Your PLAA]</strong>
              </li>
            </ol>
            <div style={{ backgroundColor: '#f1f5f9', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>Example:</p>
              <p style={{ marginBottom: '8px' }}>If you collect:</p>
              <ul style={{ paddingLeft: '20px', listStyleType: 'disc', marginBottom: '8px' }}>
                <li style={{ marginBottom: '4px' }}>100 Network Tooling Points and 200 People/Talent Points for the March 2025 snapshot period.</li>
                <li style={{ marginBottom: '4px' }}>Network Tooling has 1,935 rewards available and People/Talent has 1,452 rewards available.</li>
                <li style={{ marginBottom: '4px' }}>The amount of Points collected across all participants for the Network Tooling KPI Category is 1,000 points.</li>
                <li style={{ marginBottom: '4px' }}>The amount of points collected across all participants for the People/Talent KPI Category is 4,000 points.</li>
                <li style={{ marginBottom: '4px' }}>You will claim 100 / 1000 or 10% of the Network Tooling KPI Emissions (PLAA = 10% × 1,935).</li>
                <li style={{ marginBottom: '4px' }}>You will claim 200 / 4000 or 5% of the People/Talent KPI Emissions (PLAA = 5% × 1,452).</li>
                <li style={{ marginBottom: '4px' }}>For March 2025, you claim:
                  <ul style={{ paddingLeft: '20px', listStyleType: 'circle', marginTop: '4px' }}>
                    <li style={{ marginBottom: '4px' }}>10% × 1,935 ~ 194 PLAA in Network Tooling</li>
                    <li style={{ marginBottom: '4px' }}>5% × 1,452 ~ 73 PLAA in People/Talent</li>
                    <li><strong>Total for March: 194 + 73 = 267 PLAA</strong></li>
                  </ul>
                </li>
              </ul>
              <p>Please note, only whole PLAA may be claimed. In the event you do not collect enough Points to claim a whole PLAA you will receive 0 PLAA during the snapshot period.</p>
            </div>
          </div>
        ),
      },
    ],
  },
  {
    id: 'tax-implications',
    title: 'Tax Implications',
    icon: '/icons/bank-icon.png',
    items: [
      {
        question: 'What are the tax implications of collecting points?',
        answer: 'We cannot provide tax advice and the response to this question should not be construed as tax advice. We encourage you to consult with a tax professional. The points you collect are not guaranteed to convert into PLAA and may never result in any settlement, cash, PLAA or other consideration. Points are simply a way of measuring activity within the network. In addition, unless you execute the applicable PLAA documentation and satisfy any other eligibility requirements, you may not receive any PLAA. Any PLAA that are issued may be settled through the issuance of PLAA and redeemed for cash via a buyback or other consideration in accordance with the applicable settlement process.',
      },
      {
        question: 'What are the tax implications of receiving PLAA?',
        answer: 'We cannot provide tax advice and the response to this question should not be construed as tax advice. We encourage you to consult with a tax professional. The tax treatment of PLAA, the settlement of PLAA and any subsequent redemption of such PLAA for cash or other consideration is uncertain and may vary based on your particular circumstances. PLAA settled through tokens may be treated as taxable income upon settlement based on the value of the PLAA at that time. In addition, the redemption or buyback of PLAA may result in capital gain or loss. Any such capital loss may not be available to offset income recognized upon settlement of PLAA. Participation in any PLAA buyback event is voluntary.',
      },
    ],
  },
  {
    id: 'right-issuance-and-token-settlements',
    title: 'PLAA Issuance and Settlements',
    icon: '/icons/coin-icon.png',
    items: [
      {
        question: 'Why are my PLAA calculations "rounded down"? What is the round down function and why does it exist?',
        answer: (
          <p style={{ margin: 0 }}>
            The Points-to-PLAA algorithm converts participant Points into PLAA based on a predefined formula tied to the KPI emissions schedule and the monthly PLAA allocation cap (see{' '}
            <a href="#point-to-rights-conversion" style={{ color: '#156ff7', textDecoration: 'underline' }}>
              Points-to-PLAA Conversion
            </a>
            ). This formula calculates each participant&apos;s share of the monthly PLAA allocation relative to the total Points earned across the network for the applicable KPIs. Because PLAA are settled through whole tokens and fractional tokens are not currently issued, the settlement of PLAA may result in fractional PLAA amounts. In those cases, the amount is rounded down to the nearest whole PLAA. This round down function ensures compliance with the applicable monthly settlement cap and avoids over-distribution. The same rounding rule is applied consistently to all participants to maintain fairness across the program.
          </p>
        ),
      },
      {
        question: 'I\'m not based in the US. When will I be eligible to collect points and receive PLAA?',
        answer: 'We\'re actively working to expand eligibility to other jurisdictions and will communicate updates as soon as we have more information. Please reach out to plaa-wg@plrs.xyz for further questions.',
      },
      {
        question: 'Why are additional PLAA being issued?',
        answer: (
          <div>
            <p style={{ marginBottom: '16px' }}>
              Additional PLAA will be distributed to PL Infra team service providers as reward for their contributions to maintaining and supporting the network (also referred to as PL Infra Rewards). As a result, you may see additional PLAA being issued beyond those associated with incentivized activity participation.
            </p>
            <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>Importantly:</p>
            <ul style={{ paddingLeft: '20px', listStyleType: 'disc', marginBottom: '0' }}>
              <li style={{ marginBottom: '4px' }}>The structure of the PLAA program otherwise remains unchanged.</li>
              <li style={{ marginBottom: '4px' }}>PLAA distributed for PL Infra Rewards are separate from and will not be drawn from, nor funded by, incentivized activity allocations.</li>
              <li style={{ marginBottom: '4px' }}>The distribution of PLAA for PL Infra Rewards will not impact baseline PLAA activities.</li>
              <li>The monthly PLAA pool of 10,000 PLAA reserved for PLAA participants who complete incentivized activities during a snapshot period will not be reduced nor diluted as a result of additional PLAA distributions for PL Infra team services providers.</li>
            </ul>
            <p style={{ marginTop: '8px' }}>
              This reflects an expansion in how the PLAA is being utilized, not a change to how participant rewards operate.
            </p>
          </div>
        ),
      }
    ],
  },
  {
    id: 'buyback-auctions',
    title: 'Buyback Auctions',
    icon: '/icons/buyback-icon.png',
    items: [
      {
        question: 'What is a reverse auction?',
        answer: 'A reverse auction is a process in which holders of PLAA submit the price at which they are willing to redeem their PLAA. The Trust accepts bids beginning with the lowest asking prices and continues upward until the available buyback pool is exhausted or the applicable allocation cap is reached. PLAA that are accepted in the auction are settled through the issuance of tokens, which are then immediately purchased by the Trust for cash or other consideration in accordance with the applicable settlement process.',
      },
      {
        question: 'What is a batch auction?',
        answer: 'A batch auction collects all bids before determining a single clearing price. Rather than matching each bid at its individual price, all accepted bids in the batch settle at the same clearing price. This creates a more fair and transparent way to determine which bids are filled and at what value.',
      },
      {
        question: 'How is the clearing price calculated?',
        answer: (
          <div>
            <p style={{ marginBottom: '12px' }}>The clearing price is the asking price of the last seller whose bid is accepted before the buyback pool is exhausted. In other words, the highest price among all accepted bids. It is applied to all accepted bids, up to the value of that bid. Bids at or below the clearing price are accepted; bids above are not. The last accepted bid may be partially filled if the pool runs out.</p>
            <p style={{ marginBottom: '12px' }}>Any changes to auction rules will be communicated 24 hours in advance.</p>
          </div>
        ),
      },
      {
        question: 'How are bids accepted?',
        answer: (
          <div>
            <p style={{ marginBottom: '12px' }}>Bids are selected when they fall at or below the clearing price.</p>
            <ol style={{ paddingLeft: '24px', marginBottom: '12px', listStyleType: 'lower-alpha' }}>
               <li style={{ marginBottom: '4px' }}>Bids below the clearing price → filled up to their full bid value.</li>
               <li>Bids at the clearing price → may be partially filled if the buyback pool runs out. In that case, each bid is filled only up to its total bid value (PLAA × bid price).</li>
            </ol>
            <p style={{ marginBottom: '12px' }}>Each accepted bidder receives payment using the clearing price up to their total bid value. This means that for example, if you bid 5 PLAA at $18 (total bid value $90) and the clearing price was $20, you would only be able to sell 4 PLAA for $72 (5 x $18 / $20) because your fill cannot exceed your original bid value and only whole PLAA are accepted.</p>
            <p>Any changes to auction rules will be communicated 24 hours in advance.</p>
          </div>
        ),
      },
      {
        question: 'Why is there an allocation cap on the buyback?',
        answer: 'The allocation cap ensures that no single participant can capture more than a predetermined percentage of the pool (currently 4.5%). This ensures broader participation and preserves fairness.',
      },
      {
        question: 'Do earlier bids have an advantage?',
        answer: 'No. Because this is a batch auction, timing of bids does not determine the winning bids. All bids are processed together when the auction closes.',
      },
      {
        question: 'Do I get paid the price I bid?',
        answer: (
          <div>
            <p style={{ marginBottom: '12px' }}>No — if your bid is accepted, you are paid at the clearing price, not your bid price.</p>
            <p>If your bid is accepted, you receive up to the total dollar value of your bid. When the clearing price is higher than your bid price, this means you may sell fewer PLAA, but the total cash amount you receive stays within your bid&apos;s total value. In some cases, if multiple bids are accepted at the clearing price and the buyback pool is fully used, those bids may be partially filled, again capped by each bid&apos;s total value.</p>
          </div>
        ),
      },
      {
        question: 'What happens after the buyback if my bid is above the clearing price?',
        answer: 'Your bid will not be accepted, and you retain all of your PLAA — nothing is sold or removed from your account, and you may use them to participate in future buyback auctions.',
      },
      {
        question: 'Can I change or cancel my bid?',
        answer: 'You may submit, edit, or cancel your bids anytime before the auction closes. After close, no changes or new bids are accepted.',
      },
      {
        question: 'What determines how many of my PLAA are purchased?',
        answer: (
          <div>
            <p style={{ marginBottom: '12px' }}>In general, three factors determine your fill:</p>
            <ol style={{ paddingLeft: '24px', marginBottom: '12px' }}>
              <li style={{ marginBottom: '4px' }}><strong>Your bid price vs. the clearing price:</strong> Your bid must be at or below the clearing price to be accepted.</li>
              <li style={{ marginBottom: '4px' }}><strong>Your bid-value cap:</strong> You can only receive up to your total bid value (PLAA × your bid price). So if you bid 100 PLAA at $5 and the clearing price is $20, you&apos;ll sell 25 PLAA for $500, not all 100.</li>
              <li><strong>The 4.5% per-bidder cap:</strong> No single participant can receive more than 4.5% of the total buyback pool.</li>
            </ol>
            <p>Any changes to auction rules will be communicated 24 hours in advance.</p>
          </div>
        ),
      },
      {
        question: 'Why do clearing prices vary between auctions?',
        answer: 'Clearing prices differ based on participation, bid distribution, total PLAA offered, and the size of the buyback pool. In general, if participants offer higher prices, or fewer PLAA are offered relative to the size of the buyback, the clearing price will be higher.',
      },
      {
        question: 'What happens to settled tokens?',
        answer: 'Tokens issued as part of the settlement process are purchased by the PLAA1 Trust and then cancelled (or "burned"), after which they are no longer available on the applicable blockchain.',
      },
      {
        question: 'How do I receive payment for the PLAA redeemed in an auction?',
        answer: 'After the auction results have been calculated, if your bids are accepted, you will receive an email from Surus with instructions regarding settlement and payment. Accepted PLAA will be settled through the issuance of tokens, which will then be purchased by the Trust for cash or other consideration, including stablecoins, at Surus\' discretion.',
      },
      {
        question: 'When do I receive payment for the PLAA redeemed?',
        answer: 'Payments will be processed as soon as reasonably practicable after auction winners are notified of their accepted bids and Surus receives any payment information required to complete settlement.',
      },
    ],
  },
  {
    id: 'simultaneous-settlement',
    title: 'Simultaneous Settlement',
    icon: '/icons/coin-icon.png',
    items: [
      {
        question: 'What is the Simultaneous Token Settlement Program?',
        answer: (
          <div>
            <p style={{ marginBottom: '16px' }}>
              The Simultaneous Token Settlement Program (STSP) is a new program developed by the PLAA1 Trust to facilitate the
              settlement of PLAA through Tokens. Under the STSP, participants continue to participate in buyback auctions
              using their PLAA, but Tokens are no longer issued and distributed on a monthly basis. Instead, Tokens are
              issued only in connection with a successful bid in a buyback auction and are thereafter immediately settled
              for cash (or other consideration).
            </p>
            <p style={{ fontWeight: 600, marginBottom: '8px' }}>At an Auction Event:</p>
            <ul style={{ paddingLeft: '24px', listStyleType: 'disc', marginBottom: '0' }}>
              <li style={{ marginBottom: '8px' }}>
                Participants submit bids using their PLAA (in lieu of Tokens).
              </li>
              <li style={{ marginBottom: '8px' }}>
                To the extent a participant has a successful bid, Tokens corresponding to the PLAA accepted in the
                auction are automatically &quot;issued&quot; to the participant.
              </li>
              <li style={{ marginBottom: '8px' }}>
                Immediately thereafter, the Trust purchases the Tokens at the applicable auction price and burns them.
              </li>
              <li>
                The participant receives cash (or other consideration) from the Trust in exchange for the Tokens.
              </li>
            </ul>
          </div>
        ),
      },
      {
        question: 'How is the Simultaneous Token Settlement Program different from the previous program?',
        answer:
          'The only change relates to the mechanism by which Tokens are issued and settled. The auction process, pricing, and economic outcomes are otherwise unchanged. Participants should expect the program to operate in substantially the same manner as before.',
      },
      {
        question: 'Why was the Simultaneous Token Settlement Program created?',
        answer: (
          <div>
            <p style={{ marginBottom: '12px' }}>The program was designed to:</p>
            <ul style={{ paddingLeft: '24px', listStyleType: 'disc', marginBottom: '0' }}>
              <li style={{ marginBottom: '8px' }}>Seek to align income recognition with liquidity events.</li>
              <li>Provide a consistent and simplified experience across all participants.</li>
            </ul>
          </div>
        ),
      },
      {
        question: 'Who is eligible for the Simultaneous Token Settlement Program?',
        answer:
          'All PLAA holders are automatically enrolled into the Simultaneous Token Settlement Program. There is no election required. All participants follow the same settlement mechanics under the program.',
      },
      {
        question: 'How does this work for PL Infra Members who are not PLCS employees?',
        answer:
          'For PL Infra members who are not employees of PLCS, there is no tax withholding, as individual members are responsible for their own tax remittances.',
      },
      {
        question: 'What if I am a PLCS employee?',
        answer:
          'PLCS employees have additional withholding mechanics. The following applies even if you cease providing service as a PLCS employee. For PL Infra members who are employees of PLCS, applicable tax withholding may apply at the time of settlement.',
      },
      {
        question: 'How is PLAA taxed?',
        answer: (
          <div>
            <p style={{ marginBottom: '12px' }}>
              PLAA is generally subject to ordinary income tax based on the value of the settled tokens, which can be
              found in your end of year transaction report from the Surus Trust Company. If you have questions about
              withholding:
            </p>
            <ul style={{ paddingLeft: '24px', listStyleType: 'disc', marginBottom: '0' }}>
              <li style={{ marginBottom: '8px' }}>
                For PLCS employees, required tax withholding may apply at the time of settlement.
              </li>
              <li>
                For PL Infra Members who are not PLCS employees, there is no tax withholding as individuals are
                responsible for their own tax remittances.
              </li>
            </ul>
          </div>
        ),
      },
      {
        question: 'I already hold PLAA Tokens distributed under the previous program. Are they still usable?',
        answer: (
          <p>
            Yes, Tokens issued before the Simultaneous Token Settlement Program went into effect remain valid and may be
            used in future buyback auctions. No action is required from existing holders, and no migration or re-issuance
            is needed. Existing tokens will continue to participate in future buyback auctions on the same terms and
            conditions as before. In addition, PLAA eligible for settlement under the STSP as described above may be
            used to participate in future auctions. We expect that existing Tokens will be used first in auction events
            and once these are exhausted, PLAA will be used on a go-forward basis as described above. Any pending
            Tokens not issued before October 1, 2025 will automatically be issued as PLAA instead.
          </p>
        ),
      },
      {
        question: 'I have questions about the Simultaneous Token Settlement Program. Who should I contact?',
        answer: (
          <p>
            Please contact{' '}
            <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: '#156ff7', textDecoration: 'underline' }}>
              {SUPPORT_EMAIL}
            </a>
            . Please note that the PLAA working group has dedicated significant time to making this experience as
            comprehensive as possible. Given our limited resources, response times to inquiries may take longer than
            expected, potentially up to one to two weeks. To enhance transparency, we will aim to publish answers to
            frequently asked questions approximately every two weeks for everyone&apos;s benefit. We appreciate your
            patience.
          </p>
        ),
      },
    ],
  },
];

export default function FAQsPage() {
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});
  const [expandAll, setExpandAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCategoryId, setCopiedCategoryId] = useState<string | null>(null);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const copyTooltipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();
  const { onFaqsSearchUsed, onFaqsExpandAllClicked, onFaqsQuestionToggled, onFaqsClearSearchClicked } = useAlignmentAssetsAnalytics();

  const handleHashNavigation = useCallback((hash: string) => {
    if (!hash) return;

    let targetHash = hash;
    if (hash === 'token-issuance') {
      targetHash = 'right-issuance-and-token-settlements';
    } else if (hash === 'point-to-token-conversion') {
      targetHash = 'point-to-rights-conversion';
    }

    const element = categoryRefs.current[targetHash];
    const category = faqCategories.find(cat => cat.id === targetHash);
    
    if (!element || !category) return;

    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  useEffect(() => {
    const handleHash = () => {
      let hash = window.location.hash.slice(1);
      if (!hash) return;

      if (hash === 'token-issuance') {
        hash = 'right-issuance-and-token-settlements';
        window.history.replaceState(null, '', `${pathname}#${hash}`);
      } else if (hash === 'point-to-token-conversion') {
        hash = 'point-to-rights-conversion';
        window.history.replaceState(null, '', `${pathname}#${hash}`);
      }

      const category = faqCategories.find(cat => cat.id === hash);
      if (!category) {
        window.history.replaceState(null, '', pathname);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        return;
      }

      handleHashNavigation(hash);
    };

    handleHash();

    window.addEventListener('hashchange', handleHash);

    return () => {
      window.removeEventListener('hashchange', handleHash);
    };
  }, [pathname, handleHashNavigation]);

  // Update URL hash when user scrolls to a category
  useEffect(() => {
    const refs = categoryRefs.current;
    const ids = Object.keys(refs).filter((id) => refs[id] != null);
    if (ids.length === 0) return;

    const ratios = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const id = (e.target as HTMLElement).id;
          if (id) ratios.set(id, e.intersectionRatio);
        });
        const byRatio = [...ratios.entries()]
          .filter(([, r]) => r > 0)
          .sort((a, b) => b[1] - a[1]);
        const topId = byRatio[0]?.[0];
        if (topId && window.location.hash.slice(1) !== topId) {
          window.history.replaceState(null, '', `${pathname}#${topId}`);
        }
      },
      { root: null, rootMargin: '-30% 0px -50% 0px', threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] }
    );

    ids.forEach((id) => {
      const el = refs[id];
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [pathname, searchQuery]);

  const toggleQuestion = (questionId: string, categoryId: string, questionText: string) => {
    const newExpandedState = !expandedQuestions[questionId];
    onFaqsQuestionToggled(categoryId, questionId, questionText, newExpandedState);
    setExpandedQuestions((prev) => ({
      ...prev,
      [questionId]: newExpandedState,
    }));
  };

  const handleExpandAll = () => {
    const newExpandAll = !expandAll;
    onFaqsExpandAllClicked(newExpandAll);
    if (expandAll) {
      setExpandedQuestions({});
    } else {
      const allQuestions: Record<string, boolean> = {};
      faqCategories.forEach((cat) => {
        cat.items.forEach((_, idx) => {
          allQuestions[`${cat.id}-${idx}`] = true;
        });
      });
      setExpandedQuestions(allQuestions);
    }
    setExpandAll(newExpandAll);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Debounce analytics
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    if (value.trim()) {
      searchDebounceRef.current = setTimeout(() => {
        onFaqsSearchUsed(value);
      }, 500);
    }
  };

  const handleClearSearch = () => {
    onFaqsClearSearchClicked(searchQuery);
    setSearchQuery('');
  };

  const handleCopyLink = useCallback((categoryId: string) => {
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}${pathname}#${categoryId}`;
    navigator.clipboard.writeText(url).then(() => {
      if (copyTooltipTimeoutRef.current) clearTimeout(copyTooltipTimeoutRef.current);
      setCopiedCategoryId(categoryId);
      copyTooltipTimeoutRef.current = setTimeout(() => {
        setCopiedCategoryId(null);
        copyTooltipTimeoutRef.current = null;
      }, 2000);
    });
  }, [pathname]);

  // Filter logic
  const query = searchQuery.toLowerCase().trim();
  
  const filteredCategories = faqCategories.map(category => {
    const titleMatch = category.title.toLowerCase().includes(query);
    const filteredItems = category.items.filter(item => 
      item.question.toLowerCase().includes(query)
    );
    
    if (titleMatch || filteredItems.length > 0) {
      return {
        ...category,
        items: filteredItems.length > 0 ? filteredItems : (titleMatch ? category.items : [])
      };
    }
    return null;
  }).filter((c): c is FAQCategoryData => c !== null);

  useScrollDepthTracking('faqs');

  return (
    <>
      <div className="faqs">
        <div className="faqs__header">
          <h1 className="faqs__header__title">Frequently Asked Questions</h1>
          <p className="faqs__header__header__date">
            <em>Last Updated: July 7, 2026</em>
          </p>
        </div>

        <div className="faqs__controls faqs__controls--desktop">
          <div className="faqs__controls__search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search for a query"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          <button className="faqs__controls__expand-all" onClick={handleExpandAll} disabled={!!query}>
            {expandAll ? 'Collapse All' : 'Expand All'}
            <ChevronDownIcon className={`faqs__controls__expand-all__icon ${expandAll ? 'faqs__controls__expand-all__icon--expanded' : ''}`} />
          </button>
        </div>

        <div className="faqs__header-controls faqs--mobile">
           <button className="faqs__controls__expand-all" onClick={handleExpandAll} disabled={!!query}>
            {expandAll ? 'Collapse All' : 'Expand All'}
            <ChevronDownIcon className={`faqs__controls__expand-all__icon ${expandAll ? 'faqs__controls__expand-all__icon--expanded' : ''}`} />
          </button>
        </div>

        <div className="faqs__container">
          <div className="faqs__controls__search faqs--mobile">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search for a query"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>

          {!query && (
            <div className="faqs__container__category__disclaimer">
              PLAA refers to both PLAA1 tokens and contractual rights to those tokens. Both are redeemable when you participate in a periodic reverse auction (buyback), which provides holders exposure to the Protocol Labs Network portfolio of frontier technology investments, as well as cryptocurrencies and other digital assets. New contributors receive contractual rights, while existing token holders keep their tokens, which are tracked by the Alignment Asset team and Surus Trust. Whether you have rights or tokens, the experience is the same, so we just call it all PLAA.
            </div>
          )}

          {filteredCategories.length > 0 ? (
            filteredCategories.map((category) => (
              <div 
                key={category.id} 
                id={category.id}
                ref={(el) => { categoryRefs.current[category.id] = el; }}
                className="faqs__container__category"
              >
                <div className="faqs__container__category__header">
                  <div className="faqs__container__category__header__content">
                    <Image 
                      src={category.icon} 
                      alt="" 
                      width={16} 
                      height={16}
                      style={{ objectFit: 'contain' }}
                      priority={false}
                    />
                    <span className="faqs__container__category__title">{category.title}</span>
                  </div>
                  <div className="faqs__container__category__header__copy-wrap">
                    <button
                      type="button"
                      className="faqs__container__category__header__copy"
                      onClick={() => handleCopyLink(category.id)}
                      aria-label="Copy link to this section"
                    >
                      <Image
                        src="/icons/link-gray.svg"
                        alt=""
                        width={20}
                        height={20}
                      />
                    </button>
                    {copiedCategoryId === category.id && (
                      <span className="faqs__container__category__header__copy-tooltip" role="status">
                        Link copied
                      </span>
                    )}
                  </div>
                </div>

                {category.id === 'point-to-rights-conversion' && (
                  <div className="faqs__container__category__disclaimer">
                    <strong>Disclaimer:</strong> The points you collect are not guaranteed to convert into PLAA and may never result in any value. The points are a way of measuring the activities that you are doing in the network. Additionally, unless you sign the applicable PLAA documentation, you may not receive any PLAA. Any PLAA that are issued may be settled through the PLAA settlement process.
                  </div>
                )}

                {category.id === 'buyback-auctions' && (
                  <div className="faqs__container__category__disclaimer">
                    <strong>Disclaimer:</strong> Nothing in these materials constitutes investment, financial, or legal advice. The clearing price established in any auction reflects the supply and demand among participating holders of PLAA and should not be construed as an appraisal, or fair market value determination of PLAA. Holders of PLAA should consult with their own financial, tax, and legal advisors before deciding whether to participate.
                  </div>
                )}

                {category.id === 'simultaneous-settlement' && (
                  <div className="faqs__container__category__disclaimer">
                    <strong>Disclaimer:</strong> The information provided regarding the Simultaneous Token Settlement Program (STSP) is for general information purposes only and does not constitute legal, financial, investment, or tax advice. Tax consequences may vary based on individual circumstances, including but not limited to jurisdiction, employment status, and one&apos;s personal tax situation. Surus, Polaris, PLCS, and their affiliates do not provide, and nothing stated herein constitutes, tax advice and make no representations regarding the tax treatment of any election or award. You are solely responsible for understanding and complying with your applicable tax obligations. You are strongly encouraged to consult your own tax advisor, accountant, or legal counsel regarding any potential tax treatment under the new Simultaneous Token Settlement Program (STSP). Surus, Polaris, PLCS, and its affiliates are not responsible for any tax liabilities, penalties, or consequences resulting from your election or participation in the program. The Alignment Asset is still in private beta, and we&apos;re actively experimenting. The program may evolve from time to time as we learn and improve. Please read our{' '}
                    <a href={DISCLOSURE_URL} style={{ color: '#156ff7', textDecoration: 'underline' }}>
                      disclosure
                    </a>
                    .
                  </div>
                )}

                <div className="faqs__container__category__questions">
                  {category.items.map((item, index) => {
                    const questionId = `${category.id}-${index}`;
                    const isExpanded = query ? true : expandedQuestions[questionId];
                    const isLast = index === category.items.length - 1;

                    return (
                      <div
                        key={questionId}
                        className={`faqs__container__category__question ${isLast ? 'faqs__container__category__question--last' : ''}`}
                      >
                        <button
                          className="faqs__container__category__question__button"
                          onClick={() => toggleQuestion(questionId, category.id, item.question)}
                        >
                          <span>{item.question}</span>
                          <Image
                            src={isExpanded ? '/icons/arrow-up.svg' : '/icons/arrow-down-light.svg'}
                            alt="Toggle"
                            width={14}
                            height={14}
                            className={`faqs__chevron ${isExpanded ? 'faqs__chevron--expanded' : ''}`}
                          />
                        </button>
                        {isExpanded && (
                          <div className="faqs__container__category__question__answer">
                            {typeof item.answer === 'string' ? (
                              <p>{item.answer}</p>
                            ) : (
                              item.answer
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="faqs__no-results">
              <p>No results found for &quot;{searchQuery}&quot;</p>
              <button onClick={handleClearSearch}>Clear Search</button>
            </div>
          )}
        </div>

        {/* Disclaimer Box */}
        <div className="faqs__disclaimer">
          <DisclaimerSection />
        </div>

        {/* Footer/Contact Information */}
        <div className="faqs__footer">
          <SupportSection />
        </div>
      </div>

      <style jsx>{`
        .faqs {
          width: 100%;
        }

        .faqs__header {
          margin-bottom: 16px;
        }

        .faqs__header__title {
          font-size: 16px;
          font-weight: 600;
          line-height: 40px;
          color: #000000;
        }

        .faqs__header__header__date {
          font-size: 14px;
          line-height: 20px;
          font-weight: 500;
          color: rgba(100, 116, 139, 1);
        }

        .faqs__header-controls {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 8px;
        }

        .faqs--mobile {
          display: flex;
        }

        .faqs__controls--desktop {
          display: none;
        }

        .faqs__controls__search {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
        }

        .faqs__container .faqs__controls__search.faqs--mobile {
          max-width: none;
          margin-bottom: 16px;
        }

        .faqs__controls__search svg {
          color: #94a3b8;
          flex-shrink: 0;
        }

        .faqs__controls__search input {
          border: none;
          background: transparent;
          outline: none;
          font-size: 13px;
          color: #334155;
          width: 100%;
        }

        .faqs__controls__search input::placeholder {
          color: #94a3b8;
        }

        .faqs__controls__expand-all {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #64748b;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          border-radius: 999px;
          transition: all 0.2s;
        }

        .faqs__controls__expand-all:hover {
          color: #475569;
          background-color: rgba(0, 0, 0, 0.02);
        }

        :global(.faqs__controls__expand-all__icon) {
          width: 12px;
          height: 12px;
          color: currentColor;
          transition: transform 0.2s ease;
        }

        :global(.faqs__controls__expand-all__icon--expanded) {
          transform: rotate(180deg);
        }

        .faqs__container {
          background: rgba(248, 250, 252, 1);
          border-radius: 12px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          margin-bottom: 32px;
        }


        .faqs__disclaimer {
          margin-bottom: 100px;
        }

        .faqs__container__category {
          scroll-margin-top: 200px;
        }

        .faqs__container__category__header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 0;
        }

        .faqs__container__category__header__content {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .faqs__container__category__header__copy-wrap {
          position: relative;
          flex-shrink: 0;
        }

        .faqs__container__category__header__copy {
          background: transparent;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.2s;
        }

        .faqs__container__category__header__copy:hover {
          opacity: 0.7;
        }

        .faqs__container__category__header__copy-tooltip {
          position: absolute;
          left: 50%;
          bottom: calc(100% + 6px);
          transform: translateX(-50%);
          padding: 4px 8px;
          background: #0f172a;
          color: #fff;
          font-size: 12px;
          font-weight: 500;
          white-space: nowrap;
          border-radius: 4px;
          pointer-events: none;
          animation: faqsTooltipFade 0.2s ease;
        }

        .faqs__container__category__header__copy-tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 4px solid transparent;
          border-top-color: #0f172a;
        }

        @keyframes faqsTooltipFade {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .faqs__container__category__title {
          font-size: 16px;
          font-weight: 600;
          color: #0f172a;
        }

        .faqs__container__category__disclaimer {
          background-color: #FEF9E7;
          border: 1px solid #F4D03F;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
          font-size: 13px;
          color: #64748b;
          line-height: 1.6;
        }

        .faqs__container__category__questions {
          display: flex;
          flex-direction: column;
        }

        .faqs__container__category__question {
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: visible;
          transition: background-color 0.2s ease;
        }

        .faqs__container__category__question--last {
          border-bottom: none;
        }

        .faqs__container__category__question__button {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          width: 100%;
          padding: 14px 16px;
          background: transparent;
          border: none;
          cursor: pointer;
          text-align: left;
          gap: 12px;
          transition: background-color 0.2s;
          font-size: 13px;
          font-weight: 400;
          color: #334155;
          line-height: 1.5;
        }

        .faqs__container__category__question__button:hover {
          background-color: rgba(0, 0, 0, 0.02);
        }

        .faqs__chevron {
          transition: transform 0.3s ease;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .faqs__chevron--expanded {
          transform: rotate(180deg);
        }

        .faqs__container__category__question__answer {
          padding: 0 16px 14px 16px;
          animation: fadeIn 0.3s ease;
          font-size: 13px;
          color: #64748b;
          line-height: 1.6;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .faqs__container__category__question__answer p {
          margin: 0 0 16px 0;
        }

        .faqs__container__category__question__answer p:last-child {
          margin-bottom: 0;
        }

        .faqs__no-results {
          text-align: center;
          padding: 48px 0;
          color: #64748b;
        }

        .faqs__no-results p {
          font-size: 15px;
          margin-bottom: 16px;
        }

        .faqs__no-results button {
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          padding: 8px 16px;
          border-radius: 6px;
          color: #0f172a;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .faqs__no-results button:hover {
          background: #e2e8f0;
          border-color: #cbd5e1;
        }


        @media (min-width: 1024px) {
          .faqs__header__title {
            font-size: 24px;
            line-height: 48px;
          }

          .faqs__header-controls {
            display: none;
          }

          .faqs--mobile {
            display: none !important;
          }

          .faqs__controls--desktop {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 16px;
            margin-bottom: 0;
            position: sticky;
            top: calc(var(--app-header-height, 80px) + 75px);
            background: #f8fafc;
            padding: 16px 24px;
            border-radius: 12px 12px 0 0;
            z-index: 2;
          }

          .faqs__controls__search {
            margin-bottom: 0;
            max-width: 240px;
            flex: 1;
          }

          .faqs__controls__expand-all {
            padding: 6px 12px;
          }

          .faqs__container {
            padding: 32px;
            border-radius: 0 0 12px 12px;
            padding-top: 24px;
            margin-top: 0;
          }

          .faqs__container__category__title {
            font-size: 18px;
            line-height: 28px;
          }
        }
      `}</style>
    </>
  );
}

