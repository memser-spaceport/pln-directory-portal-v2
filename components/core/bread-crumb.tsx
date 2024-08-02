'use client';

import Link from "next/link";

interface IBreadcrumb {
  backLink: string;
  directoryName: string;
  pageName: string;
}

interface IBreadcrumbItem {
  label: string;
  href?: string;
}

export function BreadCrumb(props: IBreadcrumb) {
  const breadcrumbItems = [{ label: props?.directoryName, href: props?.backLink }, { label: props?.pageName }];
  return (
    <>
      <nav aria-label="breadcrumb" className="breadcrumb">
        <a href="/">
          <img loading="lazy" src="/icons/home.svg" className="breadcrumb__home" />
        </a>
        <span className="breadcrumb__item__separator">/</span>
        {breadcrumbItems.map((item, itemIndex: number) => (
          <div key={item.label} className={`breadcrumb__item ${itemIndex === breadcrumbItems.length - 1 ? 'breadcrumb__item--last' : ''}`}>
            {item.href && (
              <Link href={item.href} className="breadcrumb__item__link">
                {item.label}
              </Link>
            )}
            {!item.href && <p className="breadcrumb__name">{item.label}</p>}
            {itemIndex !== breadcrumbItems.length - 1 && <span className="breadcrumb__item__separator">/</span>}
          </div>
        ))}
      </nav>
      <style jsx>{`
        .breadcrumb {
          display: flex;
          font-size: 14px;
          width: full;
          height: 100%;
          align-items: center;
          padding: 0 20px;
          gap: 16px;
          background-color: rgb(255 255 255/0.95);
        }
        .breadcrum__home {
          height: 16px;
          width: 16px;
        }

        .breadcrumb__item__separator {
          color: #475569;
        }
        .breadcrumb__item {
          display: flex;
          max-width: 150px;
          gap: 16px;
          color: rgb(71 85 105);
        }
        .breadcrumb__item--last {
          display: flex;
          font-weight: 500;
          width: 150px;
          overflow: hidden;
          display: inline-block;
          text-overflow: ellipsis;
          white-space: nowrap;
          display: inline-block;
          cursor: default;
          font-size: 14px;
          color: #0f172a;
        }

        .breadcrumb__name {
          width: 150px;
          color: #000;
          text-overflow: ellipsis;
          overflow: hidden;
        }

        .breadcrumb__item__link:hover {
          color: rgb(51 65 85);
        }
        .breadcrumb__item__link:active {
          color: rgb(15 23 42);
        }
        .breadcrumb__item_separator {
          margin: 14px 0px;
          color: #475569;
        }

        @media (min-width: 1024px) {
          .breadcrumb {
            padding: 0 64px;
          }
        }
      `}</style>
    </>
  );
}
