'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { IKBArticle } from '@/types/knowledge-base.types';
import s from './AdminArticleForm.module.scss';

interface Props {
  mode: 'create' | 'edit';
  article?: IKBArticle;
}

type PublishStatus = 'idle' | 'loading' | 'success' | 'error';

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function AdminArticleForm({ mode, article }: Props) {
  const isEdit = mode === 'edit';

  const [title, setTitle] = useState(article?.title ?? '');
  const [slug, setSlug] = useState(article?.slug ?? '');
  const [summary, setSummary] = useState(article?.summary ?? '');
  const [category, setCategory] = useState(article?.category ?? '');
  const [tags, setTags] = useState(article?.tags?.join(', ') ?? '');
  const [author, setAuthor] = useState(article?.author ?? '');
  const [authorRole, setAuthorRole] = useState(article?.authorRole ?? '');
  const [authorUid, setAuthorUid] = useState(article?.authorUid ?? '');
  const [authorOfficeHoursUrl, setAuthorOfficeHoursUrl] = useState(article?.authorOfficeHoursUrl ?? '');
  const [readingTime, setReadingTime] = useState(String(article?.readingTime ?? '5'));
  const [content, setContent] = useState(article?.content ?? '');
  const [slugEdited, setSlugEdited] = useState(isEdit);
  const [publishStatus, setPublishStatus] = useState<PublishStatus>('idle');
  const [publishMessage, setPublishMessage] = useState('');

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slugEdited) {
      setSlug(slugify(val));
    }
  };

  const handleSlugChange = (val: string) => {
    setSlug(slugify(val));
    setSlugEdited(true);
  };

  const validate = () => {
    if (!title.trim()) return 'Title is required.';
    if (!slug.trim()) return 'Slug is required.';
    if (!category.trim()) return 'Category is required.';
    if (!author.trim()) return 'Author is required.';
    if (!content.trim()) return 'Content is required.';
    return null;
  };

  const handlePublish = () => {
    const error = validate();
    if (error) {
      setPublishStatus('error');
      setPublishMessage(error);
      return;
    }

    setPublishStatus('loading');

    // Simulate the GitHub API commit (no real API call in prototype)
    setTimeout(() => {
      setPublishStatus('success');
      if (isEdit) {
        setPublishMessage(
          `content/knowledge-base/${slug}.md on branch design-preview`
        );
      } else {
        setPublishMessage(
          `content/knowledge-base/${slug}.md on branch design-preview`
        );
      }
    }, 1200);
  };

  const previewFrontmatter = `---
title: "${title}"
slug: "${slug}"
summary: "${summary}"
category: "${category}"
tags: [${tags.split(',').map((t) => `"${t.trim()}"`).filter(Boolean).join(', ')}]
author: "${author}"
authorUid: "${authorUid}"
authorRole: "${authorRole}"
authorOfficeHoursUrl: "${authorOfficeHoursUrl}"
publishedAt: "${article?.publishedAt ?? new Date().toISOString().split('T')[0]}"
updatedAt: "${new Date().toISOString().split('T')[0]}"
viewCount: ${article?.viewCount ?? 0}
upvotes: ${article?.upvotes ?? 0}
readingTime: ${readingTime}
---`;

  return (
    <div className={s.root}>
      {/* Header */}
      <div className={s.header}>
        <div className={s.breadcrumb}>
          <Link href="/admin/knowledge-base" className={s.breadcrumbLink}>
            KB Admin
          </Link>
          <span className={s.breadcrumbSep}>›</span>
          <span>{isEdit ? `Edit: ${article?.title}` : 'New Article'}</span>
        </div>
        <div className={s.headerActions}>
          <Link href="/admin/knowledge-base" className={s.cancelBtn}>
            Cancel
          </Link>
          <button
            className={s.publishBtn}
            onClick={handlePublish}
            disabled={publishStatus === 'loading'}
          >
            {publishStatus === 'loading' ? (
              <><SpinnerIcon /> Publishing…</>
            ) : isEdit ? (
              <><SaveIcon /> Save Changes</>
            ) : (
              <><PublishIcon /> Publish Article</>
            )}
          </button>
        </div>
      </div>

      {/* Publish feedback */}
      {publishStatus === 'success' && (
        <div className={s.successBanner}>
          <CheckIcon />
          <div>
            <strong>{isEdit ? 'Changes saved!' : 'Article published!'}</strong>
            <p>
              {isEdit
                ? 'Updated file: '
                : 'Created new file: '}
              <code>{publishMessage}</code>
              <br />
              <span className={s.successNote}>
                In production, this commits directly to the branch via GitHub API — no PR needed. Deploy picks it up automatically.
              </span>
            </p>
          </div>
          <Link href={`/knowledge-base/${slug}`} className={s.previewLink} target="_blank">
            Preview article →
          </Link>
        </div>
      )}

      {publishStatus === 'error' && (
        <div className={s.errorBanner}>
          <ErrorIcon /> {publishMessage}
        </div>
      )}

      <div className={s.layout}>
        {/* Main fields */}
        <div className={s.main}>
          <div className={s.field}>
            <label className={s.label}>Title <span className={s.required}>*</span></label>
            <input
              className={s.input}
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. How to Fundraise in Web3"
            />
          </div>

          <div className={s.field}>
            <label className={s.label}>
              Slug <span className={s.required}>*</span>
              <span className={s.labelHint}>— auto-generated from title, used in the URL</span>
            </label>
            <div className={s.slugWrapper}>
              <span className={s.slugPrefix}>/knowledge-base/</span>
              <input
                className={s.slugInput}
                type="text"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="my-article-slug"
              />
            </div>
          </div>

          <div className={s.field}>
            <label className={s.label}>
              Summary <span className={s.labelHint}>— shown on article cards</span>
            </label>
            <textarea
              className={s.textarea}
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="1–2 sentence description of what this article covers."
            />
          </div>

          <div className={s.field}>
            <label className={s.label}>
              Content <span className={s.required}>*</span>
              <span className={s.labelHint}>— Markdown supported</span>
            </label>
            <textarea
              className={s.contentEditor}
              rows={24}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`## Overview\n\nWrite your article content here in Markdown.\n\n## Section 1\n\nUse **bold**, *italic*, lists, tables, and code blocks.\n\n- Bullet point 1\n- Bullet point 2`}
              spellCheck
            />
            <p className={s.fieldHint}>
              Tip: Use ## for section headings, **bold**, *italic*, and - for bullet lists.
            </p>
          </div>

          {/* Frontmatter preview */}
          <details className={s.frontmatterPreview}>
            <summary className={s.frontmatterToggle}>
              <CodeIcon /> Preview generated .md frontmatter
            </summary>
            <pre className={s.frontmatterCode}>{previewFrontmatter}</pre>
          </details>
        </div>

        {/* Sidebar metadata */}
        <aside className={s.sidebar}>
          <div className={s.sidebarCard}>
            <h3 className={s.sidebarTitle}>Categorization</h3>

            <div className={s.field}>
              <label className={s.label}>Category <span className={s.required}>*</span></label>
              <input
                className={s.input}
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Legal, Fundraising, Team Building"
              />
            </div>

            <div className={s.field}>
              <label className={s.label}>
                Tags <span className={s.labelHint}>— comma separated</span>
              </label>
              <input
                className={s.input}
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="web3, legal, fundraising"
              />
            </div>

            <div className={s.field}>
              <label className={s.label}>Reading Time (minutes)</label>
              <input
                className={s.input}
                type="number"
                min={1}
                max={60}
                value={readingTime}
                onChange={(e) => setReadingTime(e.target.value)}
              />
            </div>
          </div>

          <div className={s.sidebarCard}>
            <h3 className={s.sidebarTitle}>Author</h3>

            <div className={s.field}>
              <label className={s.label}>Name <span className={s.required}>*</span></label>
              <input
                className={s.input}
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g. PLCS Legal Team"
              />
            </div>

            <div className={s.field}>
              <label className={s.label}>Role / Team</label>
              <input
                className={s.input}
                type="text"
                value={authorRole}
                onChange={(e) => setAuthorRole(e.target.value)}
                placeholder="e.g. Protocol Labs Venture Studio"
              />
            </div>

            <div className={s.field}>
              <label className={s.label}>
                Member UID <span className={s.labelHint}>— links to PL Directory profile</span>
              </label>
              <input
                className={s.input}
                type="text"
                value={authorUid}
                onChange={(e) => setAuthorUid(e.target.value)}
                placeholder="e.g. cldvoe6id071fu21kkmems0nd"
              />
            </div>

            <div className={s.field}>
              <label className={s.label}>
                Office Hours URL <span className={s.labelHint}>— enables booking button</span>
              </label>
              <input
                className={s.input}
                type="text"
                value={authorOfficeHoursUrl}
                onChange={(e) => setAuthorOfficeHoursUrl(e.target.value)}
                placeholder="https://calendly.com/..."
              />
            </div>
          </div>

          <div className={s.sidebarCard}>
            <h3 className={s.sidebarTitle}>Publishing</h3>
            <div className={s.publishInfo}>
              <div className={s.publishInfoRow}>
                <span className={s.publishInfoLabel}>Branch</span>
                <code className={s.publishInfoValue}>design-preview</code>
              </div>
              <div className={s.publishInfoRow}>
                <span className={s.publishInfoLabel}>File path</span>
                <code className={s.publishInfoValue}>
                  content/knowledge-base/{slug || '<slug>'}.md
                </code>
              </div>
              <div className={s.publishInfoRow}>
                <span className={s.publishInfoLabel}>Action</span>
                <span className={s.publishInfoValue}>
                  {isEdit ? 'Update existing file' : 'Create new file'}
                </span>
              </div>
            </div>
            <p className={s.publishNote}>
              Publishes directly to the branch via GitHub API — no PR or manual review needed.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

const SaveIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M2 7.5L5.5 11L12 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PublishIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 1.5V9.5M4 4.5L7 1.5L10 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M1.5 10.5V12.5H12.5V10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const SpinnerIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
    <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="20" strokeDashoffset="10" />
  </svg>
);

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="9" cy="9" r="8" fill="#16a34a" />
    <path d="M5 9L8 12L13 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ErrorIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="8" cy="8" r="7" fill="#ef4444" />
    <path d="M5 5L11 11M11 5L5 11" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const CodeIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M4 4L1 6.5L4 9M9 4L12 6.5L9 9M7.5 2L5.5 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
