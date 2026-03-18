---
title: "Entity Structuring for Web3 Startups"
slug: "entity-structuring-for-web3-startups"
summary: "Delaware C-Corp, Cayman Foundation, DAO LLC — how to choose the right legal structure for your web3 company, and why getting this wrong early is expensive to fix."
category: "Legal & Finance"
tags: ["legal", "entity", "Delaware", "Cayman", "foundation", "DAO", "structure"]
author: "PLCS Legal Team"
authorUid: ""
authorRole: "Protocol Labs Corporate Services"
authorImageUrl: ""
authorOfficeHoursUrl: "https://plnetwork.io"
publishedAt: "2026-01-25"
updatedAt: "2026-03-10"
viewCount: 321
upvotes: 74
readingTime: 8
---

## The Default Answer: Delaware C-Corp

If you're building a software company or a protocol without a token, start with a Delaware C-Corp. This is what Y Combinator has recommended for nearly two decades, and it remains correct.

Why Delaware?
- **Investor familiarity.** Every US VC and most international investors are comfortable with Delaware C-Corp terms. Exotic structures add friction and legal cost.
- **Court system.** Delaware's Court of Chancery has 150+ years of corporate case law. Disputes get resolved predictably.
- **Flexibility.** SAFE notes, convertible notes, and priced rounds all work cleanly with a C-Corp.
- **IPO/acquisition path.** Public markets and acquirers expect a C-Corp. Converting later is possible but expensive.

**Why not an LLC?** LLCs have pass-through taxation, which sounds attractive — but VCs structurally cannot invest in LLCs. Many VC fund LPs are tax-exempt entities (pension funds, university endowments) that cannot receive unrelated business taxable income from LLCs without triggering tax liability. This is the core reason institutional investors require a C-Corp, not a preference.

**Share structure at formation:** Authorize 10 million shares, issue 8–9 million to founders at $0.0001 par value, and reserve 10–20% for the option pool. Setting par value at $0.0001 minimizes the 409A floor for early employee options. Don't authorize fewer shares and try to amend later — charter amendments are expensive and require stockholder consent.

**IP assignment — often overlooked:** Every founder must sign a Confidential Information and Invention Assignment Agreement (CIIAA) at incorporation, assigning all relevant IP to the company. Missing or incomplete IP assignment is one of the most common due diligence deal-blockers. If a founder worked on related technology before incorporation, this needs to be addressed explicitly.

If you're incorporated elsewhere (UK Ltd, Singapore Pte, Canadian Inc), plan to flip to a Delaware C-Corp before your first institutional round. This is standard and your counsel can structure a "flip" transaction — but do it early before your cap table gets complicated.

## When a Cayman Foundation Makes Sense

If your project involves a token, you'll likely need a separate legal entity to issue and govern that token. The most common structure in the PL ecosystem:

**Cayman Islands Foundation Company** (holding/token entity)
↓
**Delaware C-Corp** (operating entity — employs team, holds IP, enters contracts)

### Why Cayman (and not Switzerland)?
The Swiss Foundation was the original standard for web3 protocols — Ethereum, Cardano, and others were set up there circa 2014–2017. Cayman has largely replaced Switzerland for new projects since 2020 for three practical reasons: faster setup (2–4 weeks vs. 3–6 months), lower ongoing compliance cost, and cleaner U.S. legal precedent. Unless you have specific reasons to use Switzerland (existing relationships, EU-specific regulatory strategy), use Cayman.

Cayman Foundation advantages:
- **No equity ownership.** A Cayman Foundation has no shareholders — it has a council and beneficiaries. This makes it cleaner for decentralized governance.
- **Tax efficiency.** No Cayman corporate income tax. Token proceeds flowing through a foundation have a different profile than corporate revenue.
- **Regulatory precedent.** Many of the largest web3 protocols (including Ethereum Foundation, Filecoin Foundation, and others) use this structure.

### The Foundation does:
- Holds token treasury
- Issues grants to ecosystem developers
- Governs protocol parameters
- Holds open-source IP (sometimes)

### The C-Corp does:
- Employs the core team
- Signs customer and vendor contracts
- Holds the product IP
- Raises equity funding from VCs

This dual structure adds cost (~$30–50k to set up, ongoing Cayman compliance fees of ~$10–20k/year). It's worth it once you're serious about a token; it's overkill for early-stage experimentation.

## DAO LLCs and Wyoming

Wyoming created a legal framework for DAO LLCs in 2021. Several other states (Vermont, Tennessee) have followed. These let an on-chain DAO map to a legal entity that can sign contracts and hold assets.

**When it makes sense:**
- Fully decentralized governance from day one (rare)
- Protocol where no central entity employs the team
- Community-owned networks where the DAO is the primary decision-maker

**Cautions:**
- Very new legal framework with limited case law
- VCs are generally not familiar with it and may request a different structure
- IRS treatment of DAO income is still evolving
- Operations (hiring, contracts) are harder without a conventional entity alongside

For most PLVS founders, a DAO LLC is too early. Build with a C-Corp or Foundation structure and transition to more decentralized governance as the protocol matures.

## Common Structuring Mistakes

### 1. Incorporating in your home country "for now"
"We'll flip to Delaware when we raise" — this works, but the later you flip, the more complex the transaction. Early-stage flips are simple; Series A-stage flips involve complex tax analysis and months of legal work.

### 2. One entity for everything
A single Delaware C-Corp that issues equity, runs the product, and also issues tokens creates regulatory and governance problems. Keep the token entity separate.

### 3. Founders not incorporating at all
Working without any entity is legally risky and locks you out of receiving investment. Incorporate early — it's a few hundred dollars with services like Stripe Atlas or Clerky.

### 4. Wrong share structure
Issue founder shares immediately at incorporation, with a vesting schedule (typically 4-year with 1-year cliff). Do not issue options to founders — they should have common stock with an 83(b) election filed within 30 days of incorporation.

### 5. Missing the 83(b) election
If you receive stock subject to a vesting schedule, file an 83(b) election with the IRS within 30 days. Miss this window and you'll pay ordinary income tax on each tranche of stock that vests, at whatever the fair market value is at the time of vesting. This is a very expensive mistake for founders whose companies appreciate quickly.

## Recommended Setup for a PLVS Founder

**No token planned:**
- Delaware C-Corp
- 10M shares authorized, split evenly between founders at ~$0.0001/share
- 83(b) elections filed immediately
- Standard 4-year vest, 1-year cliff
- ~$500–2,000 using Stripe Atlas, Clerky, or Gust Launch

**Token planned or likely:**
- Delaware C-Corp (operating)
- Cayman Foundation (token/governance) — set up when you're 6–12 months from token
- Get legal counsel early — do not try to structure the Foundation relationship yourself

## Getting Help

PLCS can connect you with counsel experienced in web3 entity structures and provide referrals to firms offering PLVS discounts. Email [plvslegal@protocol.ai](mailto:plvslegal@protocol.ai) or book office hours through the PL Network Directory.

---

## References & Further Reading

- **[YC — Startup Legal and Financial Basics](https://www.ycombinator.com/library/Aq-startup-legal-and-financial-basics)** · The canonical YC guidance on Delaware incorporation, 83(b) elections, IP assignment, and founder vesting structure that informs this article.
- **[a16z — Legal Concepts for Founders](https://a16z.com/2011/09/26/legal-concepts-for-founders/)** · Andreessen Horowitz's plain-language breakdown of C-Corp vs LLC, par value, authorized shares, and why VCs cannot invest in LLCs.
- **[a16z Crypto — Token and Legal Structure](https://a16z.com/crypto/)** · a16z's published thinking on the dual-entity (US OpCo + Cayman Foundation) model, SAFT deprecation, and the Howey Test as applied to web3 tokens.
- **[Cooley GO — Startup Guides](https://cooleygo.com)** · Practical reference for entity type comparisons, Delaware public benefit corporations, and formation best practices.
- **[Wyoming DAO LLC Act (2021)](https://wyoleg.gov)** · The state legislation enabling DAO LLCs; useful background on the still-evolving legal status of on-chain governance entities.
