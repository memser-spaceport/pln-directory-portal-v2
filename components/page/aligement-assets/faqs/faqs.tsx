'use client';

import { useState, ReactNode } from 'react';
import Image from 'next/image';
import { ChevronDownIcon } from '@/components/icons';
import SupportSection from '@/components/page/aligement-assets/rounds/sections/support-section';
import DisclaimerSection from '@/components/page/aligement-assets/rounds/sections/disclaimer-section';

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
        question: 'I have questions about the Hub & Explainer, Incentivized Activities, point to token conversion, or the Trust agreement. Who should I contact?',
        answer: 'Please contact plaa-wg@plrs.xyz. Please note that the AA WG has dedicated significant time to making this explainer as comprehensive as possible. Given our limited resources, response times to inquiries may take longer than expected, potentially up to one to two weeks. To enhance transparency, we will aim to publish answers to frequently asked questions approximately every two weeks for everyone\'s benefit. We appreciate your patience.',
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
        answer: 'Surus is a member of Protocol Labs and a core contributor to the Working Group for the Alignment Asset project, providing: Fiduciary services, via Surus Trust Company, to the Alignment Asset Trust in accordance with the trust agreement, including executing the trust\'s investment strategy and the administration of token buybacks. Tokenization and wallet services for users. KYC, KYB, and accreditation services.',
      },
      {
        question: 'How secure is Surus\' platform architecture?',
        answer: 'Surus\' platform employs advanced technology and industry-leading security, including the Argon2 brute force-resistant password hashing algorithm, orchestrated container management via Kubernetes for system reliability, distributed ACID SQL transactions to prevent data loss, required TLS1.3+ encryption for encrypted information exchange, and a Wasm-based client to avoid Javascript ( 😜).',
      },
      {
        question: 'How does Surus handle tokenization and wallets?',
        answer: 'Surus\' asset tokenization platform is chain- and token standard-agnostic. This allows for maximum flexibility for future AA experiments. When a user successfully completes all compliance requirements, they are fully authorized on the platform. At that time, a multi-party computation (MPC) wallet is created immediately upon their first successful log-in attempt. Tokens purchased or claimed are held securely in these wallets. Keys are managed and securely backed up invisibly and automatically in the user\'s browser and our wallet provider partner Fordefi\'s cloud storage environment. Surus\' platform is designed with the ease-of-use of a Web2 application while leveraging all of the advantages of Web3. Actions such as transaction-signing and smart contract execution are conducted via a familiar Web2 interface in order to help bring more people and capital onchain.',
      },
    ],
  },
  {
    id: 'aa-points',
    title: 'AA Points & KPI Pillars',
    icon: '/icons/notes-icon.png',
    items: [
      {
        question: 'When can I start collecting points?',
        answer: 'You become eligible to collect points after your onboarding to the Surus platform is confirmed by Surus. However, you may start working on the incentivized activities as soon as you submit your accreditation letter to Surus for verification. Once your account is approved by Surus, we will retroactively award the points you collected based on your incentivized activities.',
      },
      {
        question: 'What if there are no points collected in a particular KPI Pillar in a snapshot period?',
        answer: 'If no points are collected in any of the KPI Pillars in a particular snapshot period, then the token emissions for that particular KPI Pillar shall be 0 for the corresponding snapshot period.',
      },
      {
        question: 'What if everyone tries to collect points in one particular KPI Pillar?',
        answer: 'The PLAA conversion mechanism is designed to reward efforts in less crowded pillars. If many participants target one pillar, its total emissions will spread thinly. Conversely, if you collect points in a pillar with lower overall participation, you will receive a proportionately larger share of that pillar\'s emissions. This balancing feature is intentional—it encourages diverse contributions across all network dimensions.',
      },
      {
        question: 'Can you collect AA points in multiple KPI Pillars in the same snapshot period?',
        answer: 'Yes. For more information, please review Calculating PLAA Token Emissions Per KPI Pillar Per Snapshot Period.',
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
        answer: 'No. Instead, you will need to submit documentation to verify your income for the last two years.',
      },
      {
        question: 'If I\'m a contractor and do not have a W-2, can I submit a 1099? Can I submit multiple 1099s? Can I submit a combination of W-2s and 1099s for the same tax year?',
        answer: 'Yes, you can submit a 1099 if you do not have a W-2. You can only submit one document per year for income verification. If you have multiple 1099s or W-2s for the same tax year, it is recommended to submit a copy of your filed Form 1040 to show your combined income for the period. A combination of W-2s and 1099s for the same tax year is not accepted unless consolidated into a filed Form 1040 or combined into one PDF document.',
      },
      {
        question: 'Is the PLAA experiment only for PL employees?',
        answer: 'No! If you\'ve received an invite to join the PLAA experiment, you were intentionally chosen as a participant.',
      },
    ],
  },
  {
    id: 'token-issuance',
    title: 'Token Issuance',
    icon: '/icons/coin-icon.png',
    items: [
      {
        question: 'Why are my token calculations "rounded down"? What is the rundown function and why does it exist?',
        answer: 'The Points-to-Token algorithm converts participant points into AA tokens based on a predefined formula tied to the KPI emissions schedule and the monthly token cap (see more here Incentivized Activities & KPI Weights). This formula calculates each participant\'s share of the month\'s token allocation relative to total points earned across the network for each of the applicable KPIs. Because only whole AA tokens can be distributed(fractional tokens are not currently issued), the calculated token amount may be, for instance, rounded down to the nearest whole token. This rounding down (also known as a round down function) ensures compliance with the 10,000-token monthly cap and avoids impermissible over-distribution. The same rounding rule is applied consistently to all participants to maintain fairness for all AA participants.',
      },
      {
        question: 'I\'m not based in the US. When will I be eligible to collect points and receive tokens?',
        answer: 'The current token issuance is limited to individual accredited investors in the United States. We\'re actively working to expand eligibility to other jurisdictions and will communicate updates as soon as we have more information.',
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
        answer: 'We cannot provide tax advice and the response to this question should not be construed as tax advice. We encourage you to consult with a tax professional. The points you collect are not guaranteed to convert into tokens and may never have value for that reason. The points are a way of measuring the activities that you are doing in the network. Additionally, unless you sign your token agreement, you will not receive the converted tokens.',
      },
      {
        question: 'What are the tax implications of receiving tokens?',
        answer: 'We cannot provide tax advice and the response to this question should not be construed as tax advice. We encourage you to consult with a tax professional. The tokens may be considered income upon receipt commensurate with the tokens\' value. The trust is exploring conversations with third party valuation firms for the initial issuance. Additionally, buybacks of tokens may trigger a capital gain in addition to any income realized upon receipt of tokens or a capital loss event, which may not be available to offset income realized from the receipt of tokens. You are not required to participate in any token buyback event.',
      },
    ],
  },
  {
    id: 'point-to-token',
    title: 'Point-to-Token Conversion',
    icon: '/icons/loop-icon.png',
    items: [
      {
        question: 'How do points convert to tokens?',
        answer: (
          <div>
            <p style={{ marginBottom: '16px' }}>
              Points convert to tokens at the end of each snapshot period (monthly). The conversion happens in three steps:
            </p>
            
            <ol style={{ paddingLeft: '24px', marginBottom: '16px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>Category allocation:</strong> Total tokens issued for the period are divided among KPI categories (Capital, Programs, Network Tooling, etc.) based on their network weight.
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>How your points are calculated:</strong> Your portion of points within each category equals your points divided by total points collected by all participants in that category during the snapshot period.
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Token distribution:</strong> Your portion of tokens as a percentage × category's token allocation = your tokens collected from that category.
              </li>
            </ol>

            <div style={{ backgroundColor: '#f1f5f9', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>Example:</p>
              <ul style={{ paddingLeft: '20px', listStyleType: 'disc', marginBottom: '0' }}>
                <li style={{ marginBottom: '4px' }}>Network Tooling gets 14.63% of 10,000 tokens = 1,463 tokens available for Network Tooling</li>
                <li style={{ marginBottom: '4px' }}>You collected 100 points; everyone collected 1,000 points total</li>
                <li style={{ marginBottom: '4px' }}>Your portion of points: 100 ÷ 1,000 = 10%</li>
                <li>Your tokens: 10% × 1,463 = ~146 tokens</li>
              </ul>
            </div>

            <p style={{ marginBottom: '16px' }}>You can collect tokens from multiple categories in the same period.</p>

            {/* KPI Pillars Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em', border: '1px solid #e2e8f0' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', borderBottom: '2px solid #3b82f6' }}>KPI Pillars</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', borderBottom: '2px solid #3b82f6' }}>KPI Weight</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', borderBottom: '2px solid #3b82f6' }}>% of Total Emissions</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', borderBottom: '2px solid #3b82f6' }}>Emission Each Snapshot</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '10px' }}>Network Tooling</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>1.4802</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>14.64%</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>1,463.76</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                    <td style={{ padding: '10px' }}>Knowledge</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>1.2800</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>15.01%</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>1,463.76</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '10px' }}>People/Talent</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>1.1600</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>13.61%</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>1,360.54</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                    <td style={{ padding: '10px' }}>Programs</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>1.2300</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>14.43%</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>1,442.65</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '10px' }}>Brand</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>1.1880</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>13.93%</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>1,393.38</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                    <td style={{ padding: '10px' }}>Projects</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>1.1200</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>13.14%</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>1,313.63</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '10px' }}>Capital</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>1.3000</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>15.25%</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>1,524.75</td>
                  </tr>
                  <tr style={{ backgroundColor: '#e0f2fe', fontWeight: 'bold' }}>
                    <td style={{ padding: '10px' }}>Sum</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>8.5260</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>100.00%</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>10,000</td>
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
              KPI categories (or "pillars") group similar activities together—for example: Capital, Programs, Knowledge, Network Tooling, People/Talent, etc.
            </p>
            
            <p style={{ marginBottom: '8px' }}>Each category receives a portion of monthly tokens based on its network weight. Example:</p>
            <ul style={{ paddingLeft: '24px', listStyleType: 'disc', marginBottom: '16px' }}>
              <li style={{ marginBottom: '4px' }}>Capital: 15.25% of tokens</li>
              <li style={{ marginBottom: '4px' }}>Programs: 14.43% of tokens</li>
              <li>Network Tooling: 14.63% of tokens</li>
            </ul>
            
            <p style={{ fontStyle: 'italic', color: '#64748b' }}>
              The weights reflect the network's current priorities and may adjust between versions.
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
            
            <div style={{ backgroundColor: '#f1f5f9', padding: '16px', borderRadius: '8px' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>Example:</p>
              <p style={{ marginBottom: '8px' }}>If you collect:</p>
              <ul style={{ paddingLeft: '20px', listStyleType: 'disc', marginBottom: '8px' }}>
                <li style={{ marginBottom: '4px' }}>100 Network Tooling points (Directory Profile + other)</li>
                <li>200 People/Talent points (Referrals + Compensation Data)</li>
              </ul>
              <p>You'll receive tokens from both categories based on your calculated portion of each.</p>
            </div>
          </div>
        ),
      },
      {
        question: "What if I don't have enough points for a whole token?",
        answer: (
          <div>
            <p style={{ marginBottom: '16px' }}>
              Only whole tokens are issued. If your points don't add up to at least one token in any category, you won't receive tokens that snapshot period.
            </p>
            
            <div style={{ backgroundColor: '#f1f5f9', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>Example:</p>
              <p>If your calculation shows 0.7 tokens, you receive 0 tokens (not 0.7). If it shows 5.3 tokens, you receive 5 tokens (not 5.3).</p>
            </div>
            
            <p>This is why contributing across multiple categories increases your chances of reaching whole token thresholds.</p>
          </div>
        ),
      },
      {
        question: 'How is my portion of tokens calculated?',
        answer: (
          <div>
            <p style={{ marginBottom: '12px' }}>Your portion within each KPI category:</p>
            
            <div style={{ backgroundColor: '#f1f5f9', padding: '12px', borderRadius: '6px', fontFamily: 'monospace', marginBottom: '12px', textAlign: 'center' }}>
              Your Points in Category ÷ Total Points in Category = Your Portion as a Percentage
            </div>
            
            <p style={{ marginBottom: '8px' }}>Then:</p>
            
            <div style={{ backgroundColor: '#f1f5f9', padding: '12px', borderRadius: '6px', fontFamily: 'monospace', marginBottom: '16px', textAlign: 'center' }}>
              Your Percentage × Tokens Allocated to Category = Your Tokens
            </div>

            <div style={{ backgroundColor: '#e0f2fe', padding: '16px', borderRadius: '8px', border: '1px solid #3b82f6' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '12px' }}>Full example (March 2025):</p>
              
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>Network Tooling category:</p>
                <ul style={{ paddingLeft: '20px', listStyleType: 'disc' }}>
                  <li>You: 100 points</li>
                  <li>Everyone: 1,000 points total</li>
                  <li>Your portion: 100 ÷ 1,000 = 10%</li>
                  <li>Category allocation: 1,463 tokens</li>
                  <li style={{ fontWeight: 'bold' }}>Your tokens: 10% × 1,463 = 146 tokens</li>
                </ul>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>People/Talent category:</p>
                <ul style={{ paddingLeft: '20px', listStyleType: 'disc' }}>
                  <li>You: 200 points</li>
                  <li>Everyone: 4,000 points total</li>
                  <li>Your portion: 200 ÷ 4,000 = 5%</li>
                  <li>Category allocation: 1,360 tokens</li>
                  <li style={{ fontWeight: 'bold' }}>Your tokens: 5% × 1,360 = 68 tokens</li>
                </ul>
              </div>
              
              <p style={{ fontWeight: 'bold', fontSize: '1.1em', borderTop: '1px solid #3b82f6', paddingTop: '12px' }}>
                Total for March: 146 + 68 = 214 tokens
              </p>
            </div>
          </div>
        ),
      },
    ],
  },
  {
    id: 'buyback-auctions',
    title: 'Buyback Auctions',
    icon: '/icons/buyback-icon.png',
    items: [
      {
        question: 'What is a reverse auction?',
        answer: 'A reverse auction is a process where participants submit the price at which they are willing to sell their tokens, rather than buying. The Trust purchases tokens starting from the lowest asking prices and moves upward until the buyback pool is used or the allocation cap is reached.',
      },
      {
        question: 'What is a batch auction?',
        answer: 'A batch auction collects all bids before determining a single clearing price. Rather than matching each bid individually, all accepted bids in the batch settle at the same clearing price. This creates a fair and transparent way to determine which bids are filled and at what value.',
      },
      {
        question: 'How is the clearing price calculated?',
        answer: (
          <div>
            <p style={{ marginBottom: '12px' }}>The clearing price is the lowest bid price at which the total buyback pool can fill the eligible bids.</p>
            <ul style={{ paddingLeft: '24px', listStyleType: 'disc' }}>
              <li style={{ marginBottom: '4px' }}>All bids at or below this price are accepted (subject to the allocation cap).</li>
              <li style={{ marginBottom: '4px' }}>Bids below the clearing price are fully filled.</li>
              <li>Bids at the clearing price may be filled fully or partially, depending on remaining pool capacity.</li>
            </ul>
          </div>
        ),
      },
      {
        question: 'How are winners determined?',
        answer: (
          <div>
            <p style={{ marginBottom: '12px' }}>Winners are the bidders whose sell bids fall at or below the clearing price.</p>
            <ul style={{ paddingLeft: '24px', listStyleType: 'disc', marginBottom: '16px' }}>
              <li style={{ marginBottom: '4px' }}>Bids below the clearing price → fully filled</li>
              <li>Bids at the clearing price → filled proportionally if the pool runs out before filling all of them</li>
            </ul>
            <p>Each accepted bidder receives payment based on the clearing price, not the price they bid.</p>
          </div>
        ),
      },
      {
        question: 'Why is there a 50% cap on the buyback allocation?',
        answer: 'The allocation cap ensures that no single bidder or small group can sell a disproportionate amount of tokens in one auction. It preserves fairness and keeps buybacks distributed across many participants.',
      },
      {
        question: 'Do earlier bids have an advantage?',
        answer: 'No. Because this is a batch auction, timing does not affect outcomes. Only the bid price matters. All bids are processed together when the auction closes.',
      },
      {
        question: 'Do I get paid the price I bid?',
        answer: 'No. All winning bidders receive payment at the clearing price, even if they bid lower. This protects bidders from underpricing and ensures consistent settlement for all.',
      },
      {
        question: 'What happens if I bid above the clearing price?',
        answer: 'Your bid will not be accepted, and no tokens will be purchased from you in that auction.',
      },
      {
        question: 'Can I change or cancel my bid?',
        answer: 'Participants may modify or cancel their bids until the auction closes. Once the auction ends, all bids are locked for settlement.',
      },
      {
        question: 'What determines how many of my tokens are purchased?',
        answer: (
          <div>
            <p style={{ marginBottom: '12px' }}>Two factors decide your final fill amount:</p>
            <ol style={{ paddingLeft: '24px', marginBottom: '12px' }}>
              <li style={{ marginBottom: '4px' }}>Your bid price relative to the clearing price</li>
              <li>The remaining buyback pool after lower bids have been filled</li>
            </ol>
            <p>Lower bids are filled first; clearing-price bids are filled last and only proportionally.</p>
          </div>
        ),
      },
      {
        question: 'Why do clearing prices vary between auctions?',
        answer: 'Clearing prices differ based on participation, bid distribution, total tokens offered, and the size of the buyback pool. Higher demand or higher bid prices in one auction can lead to a higher clearing price in that round.',
      },
      {
        question: 'Are buyback auctions the same as token valuation?',
        answer: 'No. A clearing price only reflects the bids submitted in that specific auction. It is not a valuation of the token, nor should it be interpreted as financial advice or future value.',
      },
      {
        question: 'What happens to purchased tokens?',
        answer: 'Purchased tokens are removed from circulation according to the Trust\'s operating rules. This reinforces the buyback mechanism and prevents recycled tokens from reentering future distributions.',
      },
    ],
  },
];

export default function FAQsPage() {
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});
  const [expandAll, setExpandAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleQuestion = (questionId: string) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const handleExpandAll = () => {
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
    setExpandAll(!expandAll);
  };

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

  return (
    <>
      <div className="faqs">
        <div className="faqs__header">
          <h1 className="faqs__header__title">Frequently Asked Questions</h1>
        </div>

        <div className="faqs__controls">
          <div className="faqs__controls__search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search for a query"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="faqs__controls__expand-all" onClick={handleExpandAll} disabled={!!query}>
            {expandAll ? 'Collapse All' : 'Expand All'}
            <ChevronDownIcon className={`faqs__controls__expand-all__icon ${expandAll ? 'faqs__controls__expand-all__icon--expanded' : ''}`} />
          </button>
        </div>

        <div className="faqs__container">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((category) => (
              <div key={category.id} className="faqs__container__category">
                <div className="faqs__container__category__header">
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
                          onClick={() => toggleQuestion(questionId)}
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
              <p>No results found for "{searchQuery}"</p>
              <button onClick={() => setSearchQuery('')}>Clear Search</button>
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

        .faqs__controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 0;
          position: sticky;
          top: calc(var(--app-header-height, 80px) + 56px);
          background: #f8fafc;
          padding: 16px 24px;
          border-radius: 12px 12px 0 0;
          z-index: 2;
        }

        .faqs__controls__search {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          flex: 1;
          max-width: 240px;
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
          background: transparent;
          border: none;
          color: #64748b;
          font-size: 12px;
          font-weight: 400;
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
          border-radius: 0 0 12px 12px;
          padding: 24px;
          padding-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          margin-bottom: 32px;
        }

        .faqs__disclaimer {
          margin-bottom: 100px;
        }

        .faqs__container__category {}

        .faqs__container__category__header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 16px 0;
        }

        .faqs__container__category__title {
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
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

          .faqs__container {
            padding: 32px;
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

