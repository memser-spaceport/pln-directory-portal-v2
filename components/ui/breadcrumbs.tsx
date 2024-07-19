'use client';
import React, { ReactNode } from 'react';

interface BreadcrumbItem {
  text?: string;
  url: string;
  icon?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  LinkComponent?: any;
}

const Breadcrumbs: React.FC<BreadcrumbProps> = ({ items, LinkComponent }) => {
  return (
    <>
      <nav className="breadcrumb" aria-label="breadcrumb">
        <div className="breadcrumb__cn">
          {items.map((item, index) => (
            <div key={index} className="breadcrumb__cn__item">
              {index < items.length - 1 ? (
                LinkComponent ? (
                  <LinkComponent href={item.url}>
                    <>
                      {item.icon && <img src={item.icon} alt="" style={{ marginRight: '5px' }} />}
                      {item.text ? item.text : ''}
                    </>
                  </LinkComponent>
                ) : (
                  <a href={item.url}>
                    {item.icon && <img src={item.icon} alt="" style={{ marginRight: '5px' }} />}
                    {item.text ? item.text : ''}
                  </a>
                )
              ) : (
                <>
                  {item.icon && <img src={item.icon} alt="" style={{ marginRight: '5px' }} />}
                  <p className="breadcrumb__cn__item__active">{item.text ? item.text : 'Current'}</p>
                </>
              )}
              {index < items.length - 1 && <p>/</p>}
            </div>
          ))}
        </div>
      </nav>
      <style jsx>
        {`
          .breadcrumb {
            padding: 0 38px;
          }
          .breadcrumb__cn {
            display: flex;
            gap: 16px;
            font-size: 14px;
            align-items: center;
            height: 48px;
            width: 100%;
            color: #475569;
          }
          .breadcrumb__cn__item {
            display: flex;
            gap: 16px;
            align-items: center;
          }
          .breadcrumb__cn__item__active {
            color: black;
            font-weight: 500;
          }
        `}
      </style>
    </>
  );
};

export default Breadcrumbs;
