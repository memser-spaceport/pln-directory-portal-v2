'use client';

import Image from 'next/image';
import Link from 'next/link';
import { HeroSectionData } from '../types';

interface HeroSectionProps {
  data: HeroSectionData;
}

/**
 * HeroSection - Displays the main title, subtitle, and action buttons
 * @param data - Hero section data from master JSON
 */
export default function HeroSection({ data }: HeroSectionProps) {
  return (
    <>
      <section className="hero-section">
        <div className="hero-section__content">
          <div className="hero-section__header">
            <h1 className="hero-section__title">{data.title}</h1>
            <p className="hero-section__subtitle">{data.subtitle}</p>
          </div>
          
          <div className="hero-section__actions">
            {data.actions.map((action, index) => (
              <Link 
                key={`${action.type}-${action.label}`}
                href={action.url} 
                target={action.openInNewTab ? '_blank' : undefined}
                rel={action.openInNewTab ? 'noopener noreferrer' : undefined}
                className={`hero-section__btn hero-section__btn--${action.type}`}
              >
                {action.icon && (
                  <Image src={action.icon} alt="" width={23} height={23} className="hero-section__btn-icon" />
                )}
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <style jsx>{`
        .hero-section {
          width: 100%;
        }

        .hero-section__content {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .hero-section__header {
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: flex-start;
          width: 100%;
        }

        .hero-section__title {
          font-size: 24px;
          font-weight: 700;
          line-height: 28px;
          color: #0f172a;
          margin: 0;
        }

        .hero-section__subtitle {
          font-size: 14px;
          font-weight: 400;
          line-height: 28px;
          color: #475569;
          margin: 0;
        }

        .hero-section__actions {
          display: flex;
          gap: 16px;
          align-items: center;
          flex-wrap: wrap;
        }
      `}</style>

      <style jsx global>{`
        .hero-section__btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          height: 40px;
          padding: 10px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          line-height: 20px;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 0px 1px 1px 0px rgba(15, 23, 42, 0.08);
          text-decoration: none;
        }

        .hero-section__btn--primary {
          background-color: #156ff7;
          color: white;
          border: 1px solid #cbd5e1;
        }

        .hero-section__btn--primary:hover {
          background-color: #1d4ed8;
        }

        .hero-section__btn--secondary {
          background-color: transparent;
          color: #156ff7;
          border: 1px solid #156ff7;
        }

        .hero-section__btn--secondary:hover {
          background-color: #f1f5f9;
        }

        .hero-section__btn-icon {
          width: 23px;
          height: 23px;
        }

        @media (max-width: 768px) {
          .hero-section__actions {
            flex-direction: column;
            align-items: stretch;
          }
          
          .hero-section__btn {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}
