---
title: "[DEV] Knowledge Base — PRD & Design Spec"
slug: "_knowledge-base-prd"
summary: "Internal PRD for the Knowledge Base feature. Covers product intent, user flows, component architecture, CMS approach, and design decisions. Remove before production launch."
category: "_Internal"
tags: ["internal", "PRD", "spec", "design", "dev"]
author: "PL Venture Studio Team"
authorUid: ""
authorRole: "Protocol Labs Venture Studio"
authorImageUrl: ""
authorOfficeHoursUrl: null
publishedAt: "2026-03-18"
updatedAt: "2026-03-18"
viewCount: 0
upvotes: 0
readingTime: 8
---

> ⚠️ **This article is for the dev team and designers only.** It documents the feature PRD, user flows, and implementation spec for the Knowledge Base. Remove it with `git rm content/knowledge-base/_knowledge-base-prd.md` before merging to production.

---

## What Is This Feature?

The Knowledge Base is a founder-facing resource library for the Protocol Labs / PLVS community — think YC's BookFace or Notion's wiki, built into the PLN Directory. It gives whitelisted founders a single place to find high-quality guides on legal, fundraising, hiring, PR, tokenomics, and other topics relevant to building in the PL ecosystem.

The key differentiator: every article is linked to a real author in the PLN directory, and founders can book a 1:1 office hours call with that author directly from the article page.

---

## Goals

1. **Reduce repeated Q&A** — founders ask the same questions (SAFE mechanics, O-1B visas, how to structure a token launch). Good articles replace 80% of those conversations.
2. **Surface the PL network's expertise** — PLCS legal team, PLVS program leads, and experienced founders have knowledge worth sharing. The KB gives them a publishing channel.
3. **Drive office hours bookings** — each article has a first-class CTA to book time with the author. Content that converts to live connection is more valuable than content that sits on a shelf.
4. **Feel alive** — views, upvotes, last updated timestamps, and a Q&A section signal that this is a maintained resource, not a static doc dump.

---

## Who Can Access It?

| Role | Access |
|------|--------|
| Whitelisted founders (PLN members) | Read all articles, upvote, post Q&A |
| Authors (whitelisted members) | All of the above + "Book a call" CTA links to their calendar |
| Admins (`isAdminUser`) | All of the above + admin panel to create/edit articles, "Edit Article" button on article pages |
| Public / logged-out | No access — redirected to login |

Auth is handled by existing PLN session infrastructure. No new auth layer needed.

---

## User Flows

### Flow 1: Founder browses the Knowledge Base

```
/knowledge-base (list page)
  ├── Left sidebar: sections → articles (collapsible, Notion-style)
  │     ├── Legal & Finance
  │     │     ├── PLVS Legal Resources for Founders
  │     │     ├── Entity Structuring for Web3 Startups
  │     │     └── SAFEs, Convertible Notes & Token Side Letters
  │     ├── Seed / Series A
  │     │     ├── Fundraising in Web3
  │     │     └── Preparing Your Cap Table for Series A
  │     └── ... (5 more sections)
  ├── Main area: About copy + stats + Recently Updated + Browse by Topic grid
  └── Inline search filters articles in the sidebar in real time
```

Founder clicks an article → navigates to `/knowledge-base/[slug]`

### Flow 2: Founder reads an article

```
/knowledge-base/[slug] (article detail page)
  ├── Breadcrumb: Knowledge Base → [Category]
  ├── ArticleHeader: title, author chip, meta (reading time, views, last updated)
  ├── ArticleBody: rendered markdown content
  ├── UpvoteButton: toggles count (optimistic UI, resets on refresh in prototype)
  ├── KBAuthorOfficeHours: author card + "Book a call" button → opens calendar URL
  ├── QASection: mock Q&A thread with post input
  └── (Admin only) "Edit Article" button → /admin/knowledge-base/edit/[slug]
```

### Flow 3: Admin creates or edits an article

```
/admin/knowledge-base (admin list)
  └── → /admin/knowledge-base/new (or /edit/[slug])
        ├── All frontmatter fields (title, slug, summary, category, tags, author info, dates, etc.)
        ├── Markdown body editor (textarea)
        ├── Sidebar: shows target file path + branch
        └── Save → [prototype] simulated success message
                  [MVP] GitHub Contents API commit → live in ~2 min
```

---

## Content Architecture

### CMS Approach

**Prototype (current):** Static `.md` files in `content/knowledge-base/`. Devs add/edit files directly. Admin UI shows a simulated success on save — no real write happens.

**MVP (next):** Admin UI calls `POST /api/knowledge-base/publish` → Next.js route → GitHub Contents API `PUT /repos/.../contents/content/knowledge-base/{slug}.md` → direct commit to `design-preview`. Vercel redeploys automatically (~2 min to live). Needs `GITHUB_ADMIN_PAT` env var.

**Why no PR flow:** The whitelist IS the review gate. Trusted authors commit directly — no PR → auto-merge webhook complexity needed. Content remains fully version-controlled (history, revert, blame all work).

### Frontmatter Schema

```yaml
---
title: "Article Title"
slug: "article-slug"                        # matches filename
summary: "One-sentence description"
category: "Legal & Finance"                 # maps to sidebar section
tags: ["tag1", "tag2"]
author: "Author Name"
authorUid: "abc123"                         # PLN member UID → live officeHours lookup
authorRole: "Protocol Labs Founder"
authorImageUrl: "https://..."
authorOfficeHoursUrl: "https://calendly.com/..."   # fallback if UID lookup fails
publishedAt: "2026-01-15"
updatedAt: "2026-03-10"
viewCount: 312                              # static in prototype; increment via API in MVP
upvotes: 47                                 # static in prototype
readingTime: 6                              # minutes; set manually for now
---
```

### Section → Category Mapping

| Sidebar Section | Frontmatter `category` value |
|-----------------|------------------------------|
| Legal & Finance | `"Legal & Finance"` |
| US Visa / Immigration | `"US Visa / Immigration"` |
| Press & PR | `"Press & PR"` |
| Hire Handbook | `"Hire Handbook"` |
| Seed / Series A | `"Seed / Series A"` |
| PL Brand Use Rules | `"PL Brand Use Rules"` |
| Crypto & Token Launch | `"Crypto & Token Launch"` |
| (Dev only) | `"_Internal"` |

---

## Component Map

```
app/knowledge-base/
├── page.tsx                          Server Component → getAllArticles() → KnowledgeBaseListPage
├── loading.tsx
└── [slug]/
    ├── page.tsx                      Server Component → getArticleBySlug() + getMemberInfo(authorUid)
    └── loading.tsx

app/admin/knowledge-base/
├── page.tsx                          Admin-gated → AdminKBListPage
├── new/page.tsx                      AdminArticleForm (isEdit=false)
└── edit/[slug]/page.tsx              AdminArticleForm (isEdit=true, prefilled)

components/page/knowledge-base/
├── KnowledgeBaseListPage/            'use client' — search state, bookmark state (localStorage)
├── KnowledgeBaseArticlePage/         'use client' — assembles article layout
├── ArticleCard/                      (legacy — used in early prototype, replaced by sidebar nav)
├── ArticleHeader/                    title, breadcrumb, meta bar
├── ArticleBody/                      renders markdown via markdown-to-jsx; h2/h3 get auto-generated id attrs
├── TableOfContents/                  'use client' — sticky left-rail TOC with active-section tracking
├── ArticleStats/                     views, reading time, last updated
├── UpvoteButton/                     'use client', local useState optimistic toggle
├── KBAuthorOfficeHours/              'use client', author card + booking CTA
├── CategoryFilter/                   horizontal pill filter (list page)
├── SearchBar/                        client-side search input
├── QASection/                        'use client', mock Q&A via useState
├── AdminKBListPage/                  admin article list + info banner
└── AdminArticleForm/                 create/edit form with markdown editor

types/
└── knowledge-base.types.ts           IKBArticleMeta, IKBArticle

utils/
├── knowledge-base.utils.ts           getAllArticles(), getArticleBySlug() — server-only, fs + gray-matter
└── knowledge-base-toc.utils.ts       slugifyHeading(), extractHeadings() — client-safe, no Node deps
```

### Key Component Notes

**`KnowledgeBaseListPage`**
- Two-column layout: sticky left sidebar (272px) + scrollable main content
- Sidebar sections are collapsible; articles nest beneath with left-border accent on hover
- Search filters article list in sidebar in real time (client-side, no API)
- Bookmark button on each article persisted to `localStorage` — survives page refresh
- Topic cards in main area link to the first article in each section (`<Link href={firstArticleSlug}>`)
- Empty sections render as non-clickable divs (`.topicCardEmpty`)

**`KBAuthorOfficeHours`**
- Does NOT reuse `OfficeHoursView` — that component is tightly coupled to `IMember`
- Simplified: `window.open(normalizeOfficeHoursUrl(url), '_blank')`
- Priority: live `officeHoursUrl` from `getMemberInfo(authorUid)` → fallback to `authorOfficeHoursUrl` in frontmatter

**`UpvoteButton`**
- Prototype: local toggle only — resets on page refresh. No API call.
- MVP: `POST /api/knowledge-base/upvote` → increment in DB or GitHub file

**`QASection`**
- Prototype: mock Q&A stored in `useState`. No persistence.
- MVP: real comments via DB + API (separate ticket)

**`TableOfContents`**
- Parses H2/H3 headings from `article.content` via `extractHeadings()` (same slug logic as the id stamps in `ArticleBody`)
- `IntersectionObserver` tracks which heading is in view; highlights the active link with a blue left-border accent
- Click handler: finds heading element by id → smooth scrolls with 88px offset for sticky navbar; falls back to native anchor nav if element not found
- Hidden below 1100px viewport width; article layout falls back to 2-column at that breakpoint
- Renders nothing if the article has no H2/H3 headings

**`ArticleBody`**
- Renders markdown via `MarkdownToJSX` directly (not via shared `<Markdown>` component — needed custom h2/h3 overrides)
- H2 and H3 are overridden with custom components that stamp `id={slugifyHeading(extractText(children))}` on every heading
- `extractText()` handles plain strings, arrays, and nested React elements (e.g. `## Heading with **bold**`)
- `slugifyHeading()` is the same function used by `extractHeadings()` in the TOC — guarantees IDs always match

**`AdminArticleForm`**
- On save: sets `publishStatus: 'success'` and shows a simulated success message with the target file path
- No real file write in prototype — see CMS Approach above
- The sidebar shows: target file path, branch (`design-preview`), and a note clarifying this is prototype-only

---

## Data Flow (Server → Client)

```
content/knowledge-base/*.md
        │
        ▼ (fs + gray-matter, Node.js only)
utils/knowledge-base.utils.ts
        │
        ├──► getAllArticles()
        │         └──► app/knowledge-base/page.tsx (Server Component)
        │                   └──► <KnowledgeBaseListPage articles={articles} />
        │
        └──► getArticleBySlug(slug)
                  └──► app/knowledge-base/[slug]/page.tsx (Server Component)
                            ├── getMemberInfo(authorUid) → live officeHoursUrl
                            └──► <KnowledgeBaseArticlePage article={...} liveOfficeHoursUrl={...} />
```

---

## Navigation Changes

- **Desktop navbar** (`/components/core/navbar/nav-bar.tsx`): "Knowledge Base" item added with `KnowledgeBaseIcon` SVG
- **Mobile bottom nav** (`/components/core/MobileBottomNav/MobileBottomNav.tsx`): KB entry added to `navItems` array

---

## Seed Content (11 articles)

| Article | Section |
|---------|---------|
| PLVS Legal Resources for Founders | Legal & Finance |
| Entity Structuring for Web3 Startups | Legal & Finance |
| SAFEs, Convertible Notes & Token Side Letters | Legal & Finance |
| Fundraising in Web3: A Founder's Guide | Seed / Series A |
| Preparing Your Cap Table for Series A | Seed / Series A |
| Hiring Your First 10 Engineers in Web3 | Hire Handbook |
| How to Structure Your First Engineering Interview Process | Hire Handbook |
| US Visa & Immigration Guide for Founders | US Visa / Immigration |
| Press & PR Playbook for Web3 Founders | Press & PR |
| PL Brand Use Rules for Founders | PL Brand Use Rules |
| Crypto & Token Launch: What Founders Need to Know | Crypto & Token Launch |

All articles include a `## References & Further Reading` section with clickable links to source material (YC, a16z, Sequoia, First Round Capital, Paul Graham, USCIS, etc.).

---

## What's Not Built Yet (MVP Backlog)

| Feature | Notes |
|---------|-------|
| GitHub Contents API write | Wire up `POST /api/knowledge-base/publish` → PAT-authenticated commit |
| Real view count tracking | Increment on article load via lightweight API or PostHog event |
| Real upvote persistence | Store in DB, de-dupe by user |
| Real Q&A / comments | DB-backed, threaded, with notifications |
| Author notification | Email author when someone posts a Q&A question |
| Search API | Replace client-side title search with full-text (Algolia or Postgres FTS) |
| Article versioning UI | Show edit history (already in git, just needs a UI) |
| Related articles | "You might also like" based on tags/category |

---

## How to Remove This Article

When ready to ship to production:

```bash
git rm content/knowledge-base/_knowledge-base-prd.md
git commit -m "Remove internal PRD article before production launch"
```

The `_Internal` category will disappear from the sidebar automatically once the file is gone — no code changes needed.
