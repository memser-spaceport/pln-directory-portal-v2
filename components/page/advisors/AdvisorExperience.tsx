'use client';

import { IAdvisor } from '@/types/advisors.types';
import styles from './AdvisorExperience.module.scss';

// Mock experiences mapped by advisor ID
const MOCK_EXPERIENCES: Record<string, { title: string; company: string; startDate: string; endDate: string; description: string }[]> = {
  'self': [
    { title: 'VP of Engineering', company: 'Decentralized Systems Inc.', startDate: '2022-01', endDate: 'Present', description: 'Led engineering team scaling from 8 to 45 engineers. Shipped core protocol infrastructure and developer tooling.' },
    { title: 'Head of Product', company: 'Web3 Ventures', startDate: '2019-06', endDate: '2021-12', description: 'Built and launched token economics platform. Drove product-led growth to 50K users.' },
    { title: 'Senior Engineer', company: 'Cloud Infrastructure Co.', startDate: '2016-03', endDate: '2019-05', description: 'Core contributor to distributed storage system. 3 patents filed.' },
  ],
  'advisor-001': [
    { title: 'Head of Research', company: 'Uniswap Labs', startDate: '2023-01', endDate: 'Present', description: 'Leading protocol research and mechanism design for v4 hooks and cross-chain deployments.' },
    { title: 'DeFi Research Lead', company: 'Paradigm', startDate: '2020-06', endDate: '2022-12', description: 'Published 8 research papers on AMM design, MEV mitigation, and on-chain governance.' },
    { title: 'Protocol Engineer', company: 'MakerDAO', startDate: '2018-03', endDate: '2020-05', description: 'Core contributor to Multi-Collateral Dai. Designed liquidation 2.0 mechanism.' },
  ],
  'advisor-002': [
    { title: 'Growth Lead', company: 'Anthropic', startDate: '2024-01', endDate: 'Present', description: 'Driving developer adoption and API growth across enterprise and startup segments.' },
    { title: 'Head of Growth', company: 'Alchemy', startDate: '2021-06', endDate: '2023-12', description: 'Scaled developer platform from 10K to 200K+ active developers. Led content and community strategy.' },
    { title: 'Growth Manager', company: 'Coinbase', startDate: '2019-01', endDate: '2021-05', description: 'Managed user acquisition for Coinbase Wallet. Grew DAU by 4x.' },
  ],
  'advisor-003': [
    { title: 'Lead Auditor', company: 'OpenZeppelin', startDate: '2022-01', endDate: 'Present', description: 'Led security audits for 60+ protocols including Compound, Aave, and Lido.' },
    { title: 'Smart Contract Engineer', company: 'ConsenSys', startDate: '2019-06', endDate: '2021-12', description: 'Built and maintained Solidity libraries and developer tools for the Ethereum ecosystem.' },
    { title: 'Security Researcher', company: 'Trail of Bits', startDate: '2017-09', endDate: '2019-05', description: 'Discovered critical vulnerabilities in top-10 DeFi protocols. Published 5 security advisories.' },
  ],
  'advisor-004': [
    { title: 'Former Partner', company: 'a16z crypto', startDate: '2020-01', endDate: '2024-06', description: 'Led investments in DeFi and infrastructure. Board observer at 6 portfolio companies.' },
    { title: 'Principal', company: 'Polychain Capital', startDate: '2017-06', endDate: '2019-12', description: 'Sourced and led Series A rounds for 4 unicorn protocols. $120M+ deployed.' },
    { title: 'Investment Analyst', company: 'Goldman Sachs', startDate: '2015-01', endDate: '2017-05', description: 'TMT investment banking. Advised on $2B+ in tech M&A transactions.' },
  ],
  'advisor-005': [
    { title: 'Senior Engineer', company: 'Protocol Labs', startDate: '2021-01', endDate: 'Present', description: 'Core contributor to Filecoin tooling, FVM smart contracts, and IPFS integrations.' },
    { title: 'Distributed Systems Engineer', company: 'Ethereum Foundation', startDate: '2018-06', endDate: '2020-12', description: 'Worked on eth2 beacon chain and sharding research implementation.' },
    { title: 'Backend Engineer', company: 'LINE Corporation', startDate: '2016-04', endDate: '2018-05', description: 'Built distributed messaging infrastructure serving 200M+ users.' },
  ],
  'advisor-006': [
    { title: 'Legal Counsel', company: 'Coinbase', startDate: '2023-01', endDate: 'Present', description: 'Lead counsel for MENA and EU expansion. Expert in VARA, MiCA, and token structuring.' },
    { title: 'Associate', company: 'Latham & Watkins', startDate: '2019-06', endDate: '2022-12', description: 'Fintech and digital assets practice. Structured 20+ token offerings and DAO formations.' },
    { title: 'Legal Intern', company: 'Dubai Financial Services Authority', startDate: '2018-01', endDate: '2019-05', description: 'Regulatory sandbox program for blockchain startups.' },
  ],
  'advisor-007': [
    { title: 'Head of Design', company: 'MetaMask', startDate: '2022-06', endDate: 'Present', description: 'Leading design for MetaMask wallet and Snaps platform. Shipped to 30M+ monthly active users.' },
    { title: 'Senior Product Designer', company: 'Figma', startDate: '2019-03', endDate: '2022-05', description: 'Designed FigJam collaboration features and plugin marketplace UX.' },
    { title: 'UX Designer', company: 'N26', startDate: '2017-01', endDate: '2019-02', description: 'Mobile banking app redesign. Improved onboarding completion rate by 35%.' },
  ],
  'advisor-008': [
    { title: 'DevRel Lead', company: 'Polygon', startDate: '2022-01', endDate: 'Present', description: 'Built developer ecosystem from 5K to 50K+ active developers. Launched grants program and hackathon series.' },
    { title: 'Developer Advocate', company: 'Solana Foundation', startDate: '2020-06', endDate: '2021-12', description: 'Created SDK documentation, tutorials, and bootcamp curriculum for Solana developers.' },
    { title: 'Software Engineer', company: 'Andela', startDate: '2018-01', endDate: '2020-05', description: 'Full-stack engineering. Mentored 20+ junior developers across Africa.' },
  ],
  'advisor-009': [
    { title: 'Staff Engineer', company: 'Chainlink Labs', startDate: '2022-01', endDate: 'Present', description: 'Leading cross-chain infrastructure and CCIP development. Architected bridge security framework.' },
    { title: 'Senior Backend Engineer', company: 'Nubank', startDate: '2019-06', endDate: '2021-12', description: 'Built core banking microservices processing $1B+ monthly transactions.' },
    { title: 'Systems Engineer', company: 'Mercado Libre', startDate: '2017-01', endDate: '2019-05', description: 'Distributed payments infrastructure for Latin America marketplace.' },
  ],
  'advisor-010': [
    { title: 'Research Scientist', company: 'OpenAI', startDate: '2023-06', endDate: 'Present', description: 'Exploring intersection of AI agents and on-chain systems. Verifiable inference and agent-owned wallets.' },
    { title: 'ML Engineer', company: 'Google DeepMind', startDate: '2020-01', endDate: '2023-05', description: 'Worked on large language model training and inference optimization.' },
    { title: 'Research Assistant', company: 'KAIST AI Lab', startDate: '2018-03', endDate: '2019-12', description: 'Published 3 papers on reinforcement learning and multi-agent systems.' },
  ],
};

interface AdvisorExperienceProps {
  advisor: IAdvisor;
}

function formatDate(dateStr: string): string {
  if (dateStr === 'Present') return 'Present';
  const [year, month] = dateStr.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(month, 10) - 1]} ${year}`;
}

export function AdvisorExperience({ advisor }: AdvisorExperienceProps) {
  const experiences = MOCK_EXPERIENCES[advisor.id] || [];

  if (experiences.length === 0) return null;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Experience</h2>
      <div className={styles.list}>
        {experiences.map((exp, i) => (
          <div key={i} className={styles.item}>
            <div className={styles.itemHeader}>
              <h3 className={styles.itemTitle}>{exp.title}</h3>
              <span className={styles.itemCompany}>{exp.company}</span>
            </div>
            <span className={styles.itemDates}>{formatDate(exp.startDate)} — {formatDate(exp.endDate)}</span>
            <p className={styles.itemDescription}>{exp.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
