import HuskyChatTemplate from './husky-chat-template';
interface HuskyChatProps {
  mode: 'blog' | 'chat'
}
function HuskyChat({ mode}: HuskyChatProps) {
  const chats = [
    {
      question: 'How does the Filecoin Virtual Machine (FVM) enhance the functionality of the Filecoin network beyond simple storage solutions?',
      answer: ` The trending news in the Protocol Labs (PL) Substack includes several significant updates and events: 1. **Bluesky's Public Launch**: - Bluesky, a decentralized open-source social
              platform, has transitioned from an invite-only beta to a public launch, witnessing a surge of nearly 800,000 new users. This platform is poised to hit 4 million signups, reflecting a
              growing interest in decentralized social media.[1](https://plnnews.substack.com/p/pl-updates-feb-12). 2. **Lit Protocol's Lit v0 Launch**: - Lit Protocol has launched Lit v0, a platform
              for decentralized key management, after three years of research and development. This platform aims to empower developers in various use cases, including user onboarding and data
              marketplaces [1](https://plnnews.substack.com/p/pl-updates-feb-12). 3. **Canza Finance's Impact on Africa**: - Canza Finance, a Web3 neobank, is transforming Africa's financial landscape
              by redefining cross-border payments and financial services through DeFi solutions [1](https://plnnews.substack.com/p/pl-updates-feb-12). 4. **Filecoin Foundation's IPFS Deployment in
              Space**: - In collaboration with Lockheed Martin, the Filecoin Foundation successfully deployed the InterPlanetary File System (IPFS) in a space mission, marking a significant milestone
              in utilizing decentralized technologies for space networking [2](https://plnnews.substack.com/p/pln-updates-jan-30). 5. **Privy's General Availability Launch**: - Privy has opened its
              platform to the public, offering tools for user-friendly and secure on-chain user onboarding. This move aims to simplify the transition to blockchain for over 2.5 million users
              [3](https://plnnews.substack.com/p/pl-updates-march-12). 6. **Funding the Commons x Earth Commons Conference**: - Scheduled for April 13-14, 2024, in Berkeley, California, this
              conference will focus on sustainable funding for public goods and ecological regeneration, featuring a mix of talks, workshops, and networking opportunities
              [3](https://plnnews.substack.com/p/pl-updates-march-12). 7. **Zama's $73 Million Series A Funding**: - Zama has raised $73 million in a Series A funding round to advance fully
              homomorphic encryption (FHE), a technology crucial for secure and confidential computing [3](https://plnnews.substack.com/p/pl-updates-march-12). These updates highlight Protocol Labs'
              ongoing efforts in decentralized technologies, financial innovation, and community engagement through various events and new tool launches.`
    },
    {
      question: 'How does the Filecoin Virtual Machine (FVM) enhance the functionality of the Filecoin network beyond simple storage solutions?',
      answer: ` The trending news in the Protocol Labs (PL) Substack includes several significant updates and events: 1. **Bluesky's Public Launch**: - Bluesky, a decentralized open-source social
              platform, has transitioned from an invite-only beta to a public launch, witnessing a surge of nearly 800,000 new users. This platform is poised to hit 4 million signups, reflecting a
              growing interest in decentralized social media.[1](https://plnnews.substack.com/p/pl-updates-feb-12). 2. **Lit Protocol's Lit v0 Launch**: - Lit Protocol has launched Lit v0, a platform
              for decentralized key management, after three years of research and development. This platform aims to empower developers in various use cases, including user onboarding and data
              marketplaces [1](https://plnnews.substack.com/p/pl-updates-feb-12). 3. **Canza Finance's Impact on Africa**: - Canza Finance, a Web3 neobank, is transforming Africa's financial landscape
              by redefining cross-border payments and financial services through DeFi solutions [1](https://plnnews.substack.com/p/pl-updates-feb-12). 4. **Filecoin Foundation's IPFS Deployment in
              Space**: - In collaboration with Lockheed Martin, the Filecoin Foundation successfully deployed the InterPlanetary File System (IPFS) in a space mission, marking a significant milestone
              in utilizing decentralized technologies for space networking [2](https://plnnews.substack.com/p/pln-updates-jan-30). 5. **Privy's General Availability Launch**: - Privy has opened its
              platform to the public, offering tools for user-friendly and secure on-chain user onboarding. This move aims to simplify the transition to blockchain for over 2.5 million users
              [3](https://plnnews.substack.com/p/pl-updates-march-12). 6. **Funding the Commons x Earth Commons Conference**: - Scheduled for April 13-14, 2024, in Berkeley, California, this
              conference will focus on sustainable funding for public goods and ecological regeneration, featuring a mix of talks, workshops, and networking opportunities
              [3](https://plnnews.substack.com/p/pl-updates-march-12). 7. **Zama's $73 Million Series A Funding**: - Zama has raised $73 million in a Series A funding round to advance fully
              homomorphic encryption (FHE), a technology crucial for secure and confidential computing [3](https://plnnews.substack.com/p/pl-updates-march-12). These updates highlight Protocol Labs'
              ongoing efforts in decentralized technologies, financial innovation, and community engagement through various events and new tool launches.`
    }
  ]
  return (
    <>
      <div className="huskychat">
        <div className="huskychat__threads">
          {chats.map((chat: any, index: number) => <div key={`chat-${index}`}><HuskyChatTemplate chatInfo={{...chat}} mode={mode}/></div>)}
        </div>
      </div>
      <style jsx>
        {`
          .huskychat {
            padding: 16px 20px;
          }
          .huskychat__threads {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 72px;
          }

          @media (min-width: 1024px) {
            .huskychat {
              padding: 16px 24px;
            }
          }
        `}
      </style>
    </>
  );
}

export default HuskyChat;
