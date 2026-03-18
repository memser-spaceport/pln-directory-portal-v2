---
title: "SAFEs, Convertible Notes, and Token Side Letters Explained"
slug: "understanding-safes-and-convertible-instruments"
summary: "A plain-English breakdown of the instruments founders use to raise early capital — SAFEs, convertible notes, token side letters — what each means, and how to negotiate them."
category: "Legal & Finance"
tags: ["SAFE", "convertible note", "fundraising", "token", "side letter", "equity", "legal"]
author: "PLCS Legal Team"
authorUid: ""
authorRole: "Protocol Labs Corporate Services"
authorImageUrl: ""
authorOfficeHoursUrl: "https://plnetwork.io"
publishedAt: "2026-02-10"
updatedAt: "2026-03-14"
viewCount: 287
upvotes: 58
readingTime: 6
---

## The SAFE: What It Is and Why It Exists

Y Combinator created the SAFE (Simple Agreement for Future Equity) in 2013 to replace convertible notes as the standard early-stage investment instrument. The goal: remove the complexity and founder-hostile features of notes while giving investors something clean and standardized.

A SAFE is not a loan. It has no interest rate, no maturity date, and no debt. It's a contract that gives an investor the right to receive equity in a future priced round — typically at a discount to the round price, or at a capped valuation, or both.

**The standard YC SAFE has two key terms:**
- **Valuation cap:** The maximum price at which the SAFE converts to equity. If you raise a Series A at a $30M valuation and your SAFE had a $10M cap, the SAFE investor converts as if the company was worth $10M — a 3x price advantage.
- **Discount rate:** The SAFE converts at a percentage discount to the Series A price (typically 10–20%). A 20% discount means the SAFE investor pays $0.80 for every $1.00 worth of shares.

Most SAFEs use one or the other (cap only is most common). Some use both — convert at whichever is better for the investor.

## Post-Money vs. Pre-Money SAFEs

In 2018, YC changed their standard SAFE from pre-money to post-money. This is important and trips up a lot of founders.

**Pre-money SAFE:** The cap is applied to the company's valuation before the new investment. SAFE investors' ownership percentage is diluted by the new round. Founders often underestimate how much they're giving away.

**Post-money SAFE:** The cap includes the SAFE investment itself. The investor's ownership percentage is fixed at the time of signing. `Ownership = Investment ÷ Valuation Cap`. This is more transparent.

*Example: $500k SAFE on a $10M post-money cap = 5% ownership, guaranteed, regardless of how many other SAFEs are outstanding.*

YC's post-money SAFE is now standard. Use it. The documents are free at [ycombinator.com/documents](https://www.ycombinator.com/documents).

## Convertible Notes: When to Use Them

Convertible notes are debt instruments that convert to equity. They predate SAFEs and are still used, particularly by investors who want:
- **Interest accrual** (typically 5–8% annually) — adds to the principal that converts
- **Maturity date** — the note has a deadline (usually 12–24 months) by which it must either convert or be repaid
- **Senior debt treatment** in bankruptcy — notes rank above equity

For founders: convertible notes are slightly more investor-friendly than SAFEs because of the interest and maturity date pressure. Unless an investor specifically requires a note, prefer a SAFE.

When notes make sense:
- Investor specifically requests it
- Your jurisdiction doesn't have SAFE precedent (notes are more universally understood)
- You're in a jurisdiction where SAFEs create tax issues

## MFN Clauses

Both SAFEs and notes often include a Most-Favored-Nation (MFN) clause: if you give a later investor better terms, the MFN investor automatically gets those terms too.

If you're raising a rolling pre-seed over 6–18 months and plan to improve your terms for later investors (higher cap, less discount), this can create complications. Model this out before you sign your first SAFE.

## Token Side Letters: The Web3 Add-On

For founders building in web3, many investors — especially crypto-native ones — will ask for a token side letter alongside the SAFE. This is a separate contract giving them the right to receive a token allocation when (and if) you launch a token.

**Standard terms:**
- **Allocation size:** Typically 10–20% of the investor's SAFE investment amount, converted to tokens at the initial token price
- **Vesting:** Should mirror your core team's token vesting — 3–4 years with a 6–12 month cliff
- **Trigger:** Activates when you launch a "network token" — define this carefully
- **MFN on tokens:** Some investors ask for most-favored-nation on token terms too

**Watch out for:**
- Undefined "token" triggers — a side letter that activates on any token (including test tokens or governance tokens) can cause problems
- Short vesting on the token side letter — misaligned investor unlocks create sell pressure at launch
- Investors asking for pro-rata rights on both equity *and* tokens — negotiate these separately
- Token side letters with no vesting — avoid completely

**Negotiating posture:** Token side letters are becoming table stakes for crypto-native investors. Don't refuse them, but do negotiate the allocation percentage (start at 10%, not 20%) and require real vesting.

## Pro-Rata Rights

Pro-rata rights give an investor the right (not obligation) to participate in future rounds to maintain their ownership percentage. Almost all SAFE investors ask for pro-rata.

**Major pro-rata:** The right to invest in the priced Series A. Standard and expected.

**Minor pro-rata:** The right to invest in future rounds beyond Series A. More negotiable — push back on minor pro-rata for small-check angels who take up cap table space without adding enough value.

**Side letter pro-rata:** Some investors write their pro-rata rights into a side letter rather than the SAFE itself — this is fine, just make sure you're tracking all your side letter commitments.

## What to Send Investors After a SAFE Closes

1. Countersigned SAFE document
2. Wire confirmation
3. Cap table update (keep this current — investors will ask)
4. Invite to your investor update email list

A clean, organized fundraise builds trust early. Investors who feel respected in the pre-close process are better partners post-close.

## Resources

- Free SAFE documents: [ycombinator.com/documents](https://www.ycombinator.com/documents)
- PLCS office hours for term sheet review before signing
- PLVS program leads can connect you with founders who've recently closed SAFEs to compare notes

---

## References & Further Reading

- **[YC — SAFE Primer](https://www.ycombinator.com/library/Am-safe-primer)** · Y Combinator's official explanation of the SAFE instrument, including the 2018 post-money update, MFN clauses, and dilution mechanics.
- **[YC — Free SAFE Documents](https://www.ycombinator.com/documents)** · The actual SAFE templates (post-money cap, discount, MFN variants) used as the basis for the instrument descriptions in this article.
- **[a16z — Cap Table 101](https://a16z.com/2017/03/01/cap-table/)** · Andreessen Horowitz's breakdown of cap table mechanics, pro-rata rights, the option pool shuffle, and convertible instrument conversion behavior at a priced round.
- **[YC — A Guide to Seed Fundraising](https://www.ycombinator.com/library/4A-a-guide-to-seed-fundraising)** (Geoff Ralston) · Covers MFN usage, how to anchor valuation conversations, and when convertible notes vs SAFEs make sense.
