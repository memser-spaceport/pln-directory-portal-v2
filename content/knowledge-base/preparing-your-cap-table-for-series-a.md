---
title: "Preparing Your Cap Table for Series A"
slug: "preparing-your-cap-table-for-series-a"
summary: "What institutional investors expect to see in your cap table at Series A, how to model dilution, size your option pool, and clean up any messy equity before the round."
category: "Seed / Series A"
tags: ["cap table", "Series A", "dilution", "option pool", "equity", "ESOP", "fundraising"]
author: "PL Venture Studio Team"
authorUid: ""
authorRole: "Protocol Labs Venture Studio"
authorImageUrl: ""
authorOfficeHoursUrl: null
publishedAt: "2026-02-18"
updatedAt: "2026-03-11"
viewCount: 268
upvotes: 61
readingTime: 7
---

## Why Cap Table Hygiene Matters at Series A

By the time you're raising a Series A, your cap table is a legal and financial document that institutional investors will scrutinize carefully. Common problems at this stage:

- Missing 83(b) elections (see Entity Structuring guide)
- SAFEs outstanding that founders forgot about or didn't model correctly
- Option grants to early contractors or advisors that weren't properly documented
- Vesting schedules that weren't enforced
- Missing or expired right-of-first-refusal agreements

These don't kill deals, but they slow them down and can shift negotiating leverage at the worst time. Clean your cap table 6 months before you plan to raise.

## What Series A Investors Expect to See

A typical Series A investor will ask for your cap table in the first or second meeting. They want:

1. **A clear fully-diluted share count** — common shares + all outstanding options, warrants, SAFEs, and convertible notes, as if fully converted
2. **Founder ownership** — both founders should typically still own >50% combined at Series A (ideally >60%). If founder ownership is below 40% at Series A, that is a yellow flag for most institutional investors — it signals either excessive early dilution or too many SAFEs issued without discipline. It also raises questions about founder motivation and whether there's enough equity left to retain the team through growth.
3. **Option pool size** — usually 10–15% is expected; investors will often require you to expand it as part of the round
4. **Outstanding SAFEs and their terms** — the lead investor will model how these convert
5. **No surprises** — undisclosed obligations (promised equity to a contractor, an MFN side letter you forgot about) come out in due diligence and erode trust immediately

**Dilution benchmark from incorporation to Series A:** Healthy total dilution to founders of 30–45% from inception through Series A is considered normal. If you've given away more than 50% before the Series A closes, future rounds become structurally harder — there's less room to accommodate new investors without dropping founders below majority control, and recruiting senior executives with meaningful equity becomes expensive.

## Modeling Dilution

Let's work through a simple example.

**Pre-round cap table:**
- Founders: 8,000,000 shares (80%)
- Seed investors (SAFE, $1M on $8M post-money cap): 12.5% → 1,250,000 shares equivalent
- Option pool: 750,000 shares (7.5%)
- **Total fully diluted: 10,000,000 shares**

**Series A terms:**
- Raise $8M at $32M pre-money valuation
- New option pool: expand to 12% post-close
- New shares issued: $8M ÷ ($32M ÷ 10M) = ~2,500,000 new shares
- Post-money valuation: $40M

**Post-round ownership:**
- Total shares after: ~12,500,000 (including new option pool)
- Founders: 8,000,000 ÷ 12,500,000 ≈ 64%
- Seed investors: ~10%
- Series A investors: 20%
- Option pool: 12% (partly issued, partly reserved)

This is a healthy cap table. Founders retain majority control and have meaningful upside.

## The Option Pool Shuffle

This is one of the most commonly misunderstood dilution mechanics in early-stage fundraising.

When investors quote a pre-money valuation, they typically require that the option pool expansion happens *before* the new investment — meaning it comes out of founders' ownership, not investors'. This is called the option pool shuffle.

**Example:**
- Investor offers: "$10M pre-money, but you need to have a 15% option pool"
- If you currently have a 7% pool, that 8% expansion is dilutive to founders at pre-money
- The "real" pre-money, accounting for the shuffle, is closer to $9.2M

**Negotiating tip:** Counter with a smaller option pool. If you can demonstrate that 10% is sufficient for your next 18 months of hiring (model it out with headcount plan), you can argue against a larger pool. Investors who insist on large pools they don't have a plan for are often just using it to improve their effective entry price.

## Red Flags That Slow Down Due Diligence

1. **Outstanding options that were never formally granted.** "We told Alex he'd get 1%" is not a valid grant. Options must be formally approved by the board and documented.

2. **Shares issued without proper valuation.** Shares issued to advisors or early employees at a price lower than the 409A valuation at the time can create tax problems for recipients.

3. **Missing stockholder agreements.** Every shareholder should have a signed stockholder agreement with standard investor rights (information rights, ROFR, co-sale, drag-along).

4. **Advisors with uncapped, unvested equity.** An advisor with a 1% grant, no vesting, and no cliff who did 3 months of work two years ago is a negotiation overhang. Buy them out or restructure before the round.

5. **Too many angel investors.** 20+ small angels means 20+ people who need to sign consents, receive 409A valuations, and participate in any future liquidity event. Consider using an SPV to consolidate small angels before Series A.

## 409A Valuations

A 409A is an independent valuation of your common stock used to set the exercise price for stock options. You need a fresh 409A:
- At incorporation (or shortly after)
- Every 12 months
- After any material event (new round, significant revenue change, acquisition offer)

**Why it matters:** If you grant options at a price below the 409A fair market value, the options become "discounted options" subject to immediate income tax for the recipient under IRC 409A — often a surprise tax bill for employees.

Use a reputable 409A provider ($1,500–3,000). Cheap 409As from unqualified providers can be challenged by the IRS.

## Cap Table Tools

- **Carta** — standard for most VC-backed startups; $2,000–8,000/year; integrates with most investors
- **Pulley** — YC-backed alternative; startup-friendly pricing
- **LTSE Equity** — good for early stage
- **Spreadsheets** — fine for pre-seed, outgrow quickly

Move off spreadsheets before your Series A. Investors expect a clean Carta or Pulley report.

## Preparing the Data Room

Series A investors will request a data room during due diligence. Cap table-related documents to have ready:

- [ ] Certificate of incorporation (and any amendments)
- [ ] All board and stockholder consents (for every equity grant and round)
- [ ] All stock purchase agreements
- [ ] All outstanding SAFEs, convertible notes, and warrants
- [ ] All side letters
- [ ] Current 409A valuation
- [ ] Option plan and option grant agreements for all outstanding grants
- [ ] Vesting schedules with any acceleration provisions

Getting these organized before you start fundraising saves 2–4 weeks of deal time.

## Resources

- PLCS office hours for cap table review before you start fundraising
- PLVS program leads can connect you with founders who've recently closed Series A rounds
- Free SAFE templates at [ycombinator.com/documents](https://www.ycombinator.com/documents)

---

## References & Further Reading

- **[YC — SAFE Primer](https://www.ycombinator.com/library/Am-safe-primer)** · The mechanics of SAFE conversion, post-money vs pre-money cap tables, and how multiple SAFEs interact at a priced round — foundational to the dilution examples in this article.
- **[a16z — Cap Table 101](https://a16z.com/2017/03/01/cap-table/)** · The source for the option pool shuffle analysis, pro-rata rights mechanics, and the observation that <40% founder ownership at Series A is a yellow flag.
- **[Sequoia — Preparing for Your Series A](https://articles.sequoiacap.com/preparing-for-a-series-a)** · Sequoia's public guidance on Series A traction benchmarks, what the data room should contain, and how institutional investors evaluate company health at the time of raise.
- **[First Round Capital — The Pre-Series A Checklist](https://review.firstround.com/the-pre-series-a-checklist/)** · First Round's due diligence checklist framework; the basis for the "clean cap table" red flags section and board composition guidance.
- **[Carta — Cap Table Management](https://carta.com)** · Industry-standard cap table tool; referenced for the recommendation to move off spreadsheets before Series A.
