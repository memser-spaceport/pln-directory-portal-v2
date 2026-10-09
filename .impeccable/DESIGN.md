# PLAA design constraints

Preserve the existing layout, illustration, and content. Homepage hero background, text links, and section headings use `#0C5259` via the existing brand tokens. Primary actions on `/alignment-asset` use `#0C5259`: alias `--pl-blue-500` to `--color-brand` and use `#09434A` for `--pl-blue-600` hover ONLY inside `.plaa-home`. Both hero CTAs (“Contribute now” / “Get started”) use white with teal text and a brand-tinted hover for contrast. These homepage-only aliases must never move to `:root`, the shared layout, or global theme files; other pages, including PLAA subpages, retain their existing colors. Keep white text and secondary ghost controls on the dark hero for contrast. Do not recolor the global Directory shell.

## PLAA top banner

The member-only top carousel uses `#0C5259` for both snapshot and buyback slides, scoped through its CSS-module `.slide > div` selector. Render it only on `/alignment-asset` and `/alignment-asset/*`, never substring matches on other routes. Keep standalone banner styles, HighlightsBar variants, global navigation and non-PLAA pages unchanged. Do not broaden the homepage token scope to recolor this shared header.

## Homepage activity suggestions

Use the same current catalog as the production Activities page, never a separate homepage example list. Exclude `isSunset` records before ranking/limiting suggestions. Never suggest the legacy `build-ai-app` destination. A replacement “Build an AI App” record must explicitly have `audience: 'all-plaa-participants'` and `cta: 'submit'`; unknown eligibility means omit it. The current catalog has no verified replacement. Derive points, category, verification label and destination ID from the selected record; “Manual Review” is a review method, not a claim that something was already reviewed.

## Trust & Holdings monthly graph

Show total PLAA in circulation (`totalPlaa`, not the month-over-month delta or a cumulative sum) as a red `#DC2626` line, labeled “PLAA issuance” in the top legend. Use a separate count axis, not either dollar scale. Its font family, 12px size and 500 weight match the date-axis labels; red/NAV lines share a 2px stroke. Keep quarterly plots, table data, and existing series unchanged. Portfolio & Holdings must use authenticated API history, never demo fixtures or image snapshots. Preserve all API history in Table View and the existing latest-12 monthly plot window. Do not invent unavailable buyback/portfolio details or substitute data when authentication/API requests fail. Keep the monthly series OVERLAPPING in one 420px plot, not a separate upper band (explicit owner correction). Scale the red line just above each month's bar/amount label using the independent circulation axis; do not change data values. Bring bar totals back to the normal 10px offset, retaining price-label collision handling. Use whole-number count-axis ticks and paint issuance behind readable amount/price labels.

## References

- Aura — **Steal:** explains a complex financial product with diagrams instead of paragraphs — restrained palette and generous whitespace so the one illustrated mechanic per section is the only thing to look at
- ustwo — **Steal:** the professional/fun balance — simple, near-default layout carrying bold flat colour blocks; the palette does the personality so the structure can stay credible. **Closest match for my own site.**

These references support retaining the existing illustration and flat hero fill, not expanding this color-only change into a redesign.
