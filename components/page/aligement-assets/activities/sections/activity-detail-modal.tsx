'use client';

import Link from 'next/link';
import { Modal } from '@/components/common/Modal';
import { CloseIcon } from '@/components/icons';
import { Activity, PopupLink } from '../types';
import { useAlignmentAssetsAnalytics } from '@/analytics/alignment-assets.analytics';

interface ActivityDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: Activity | null;
}

/**
 * ActivityDetailModal - Modal popup showing activity details and points breakdown
 */
export default function ActivityDetailModal({ isOpen, onClose, activity }: ActivityDetailModalProps) {
  const { onActivitiesModalLinkClicked } = useAlignmentAssetsAnalytics();

  if (!activity) return null;

  const { popupContent } = activity;
  
  // Combine submissionLink with links array for rendering
  const allLinks = popupContent.links || (popupContent.submissionLink ? [popupContent.submissionLink] : []);

  const handleLinkClick = (linkText: string, url: string) => {
    onActivitiesModalLinkClicked({
      activityId: activity.id,
      activityName: activity.activity,
      category: activity.category,
      points: activity.points,
    }, linkText, url);
  };

  /**
   * Helper function to render text with embedded links
   */
  function renderTextWithLinks(text: string, links?: PopupLink[]) {
    if (!links || links.length === 0) {
      return text;
    }

    // Sort links by their position in the text (to process in order)
    const sortedLinks = [...links].sort((a, b) => {
      const posA = text.indexOf(a.text);
      const posB = text.indexOf(b.text);
      return posA - posB;
    });

    const parts: (string | JSX.Element)[] = [];
    let remainingText = text;
    let keyIndex = 0;

    for (const link of sortedLinks) {
      const linkIndex = remainingText.indexOf(link.text);
      if (linkIndex === -1) continue;

      // Add text before the link
      if (linkIndex > 0) {
        parts.push(remainingText.substring(0, linkIndex));
      }

      // Add the link
      parts.push(
        <Link
          key={keyIndex++}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="activity-modal__link"
          onClick={() => handleLinkClick(link.text, link.url)}
        >
          {link.text}
        </Link>
      );

      // Update remaining text
      remainingText = remainingText.substring(linkIndex + link.text.length);
    }

    // Add any remaining text
    if (remainingText) {
      parts.push(remainingText);
    }

    return parts;
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <div className="activity-modal">
          <button className="activity-modal__close" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>

          <div className="activity-modal__content">
            <h2 className="activity-modal__title">{popupContent.title}</h2>
            
            {popupContent.subtitle && (
              <h3 className="activity-modal__subtitle">{popupContent.subtitle}</h3>
            )}
            
            <p className="activity-modal__description">
              {renderTextWithLinks(popupContent.description, allLinks)}
            </p>

            {popupContent.requirements && popupContent.requirements.length > 0 && (
              <ul className="activity-modal__requirements">
                {popupContent.requirements.map((req, index) => (
                  <li key={index} className="activity-modal__requirement">
                    <strong>{req.label}:</strong> {req.value}
                  </li>
                ))}
              </ul>
            )}
            
            {popupContent.submissionNote && (
              <p className="activity-modal__submission-note">
                {renderTextWithLinks(popupContent.submissionNote, allLinks)}
              </p>
            )}

            {/* Points Awarded Section */}
            {(popupContent.pointsAwarded.items.length > 0 || popupContent.categories) && (
              <div className="activity-modal__points">
                <h3 className="activity-modal__points-title">{popupContent.pointsAwarded.title}</h3>
                
                {popupContent.pointsAwarded.items.length > 0 && (
                  <ul className="activity-modal__points-list">
                    {popupContent.pointsAwarded.items.map((item, index) => (
                      <li key={index} className="activity-modal__points-item">
                        {item.value ? (
                          <><strong>{item.label}:</strong> {item.value}</>
                        ) : item.subItems ? (
                          <><strong>{item.label}:</strong></>
                        ) : (
                          item.label
                        )}
                        {item.subItems && (
                          <ul className="activity-modal__points-sublist">
                            {item.subItems.map((subItem, subIndex) => (
                              <li key={subIndex} className="activity-modal__points-subitem">
                                {subItem.label}: {subItem.value}
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Categories (for talent referral with two columns) */}
                {popupContent.categories && (
                  <div className="activity-modal__categories">
                    {popupContent.categories.map((category, catIndex) => (
                      <div key={catIndex} className="activity-modal__category">
                        <h4 className="activity-modal__category-title">{category.title}</h4>
                        <ul className="activity-modal__category-list">
                          {category.tiers.map((tier, tierIndex) => (
                            <li key={tierIndex} className="activity-modal__category-item">
                              • {tier.label}: {tier.points}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {/* Additional Note */}
                {popupContent.additionalNote && (
                  <p className="activity-modal__additional-note">{popupContent.additionalNote}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </Modal>

      <style jsx>{`
        .activity-modal {
          background: white;
          border-radius: 16px;
          padding: 32px;
          position: relative;
          max-height: 80vh;
          overflow-y: auto;
        }

        .activity-modal__close {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          cursor: pointer;
          color: #64748b;
          transition: color 0.15s ease;
          border-radius: 4px;
        }

        .activity-modal__close:hover {
          color: #0f172a;
          background: #f1f5f9;
        }

        .activity-modal__content {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .activity-modal__title {
          font-size: 20px;
          font-weight: 700;
          line-height: 24px;
          color: #0f172a;
          margin: 0;
          padding-right: 24px;
        }

        .activity-modal__subtitle {
          font-size: 16px;
          font-weight: 600;
          line-height: 20px;
          color: #475569;
          margin: -8px 0 0 0;
        }

        .activity-modal__requirements {
          list-style: disc;
          padding-left: 20px;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .activity-modal__requirement {
          font-size: 14px;
          line-height: 20px;
          color: #475569;
        }

        .activity-modal__requirement strong {
          color: #0f172a;
          font-weight: 600;
        }

        .activity-modal__description {
          font-size: 14px;
          font-weight: 400;
          line-height: 22px;
          color: #475569;
          margin: 0;
        }

        .activity-modal__submission-note {
          font-size: 14px;
          font-weight: 400;
          line-height: 22px;
          color: #475569;
          margin: 0;
        }

        .activity-modal__points {
          margin-top: 8px;
        }

        .activity-modal__points-title {
          font-size: 16px;
          font-weight: 600;
          line-height: 20px;
          color: #0f172a;
          margin: 0 0 12px 0;
        }

        .activity-modal__points-list {
          list-style: disc;
          padding-left: 20px;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .activity-modal__points-item {
          font-size: 14px;
          line-height: 20px;
          color: #475569;
        }

        .activity-modal__points-item strong {
          color: #0f172a;
          font-weight: 600;
        }

        .activity-modal__points-sublist {
          list-style: disc;
          padding-left: 20px;
          margin-top: 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .activity-modal__points-subitem {
          font-size: 14px;
          line-height: 18px;
          color: #475569;
        }

        .activity-modal__categories {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .activity-modal__category {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .activity-modal__category-title {
          font-size: 14px;
          font-weight: 600;
          line-height: 18px;
          color: #0f172a;
          margin: 0;
        }

        .activity-modal__category-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .activity-modal__category-item {
          font-size: 14px;
          line-height: 18px;
          color: #475569;
        }

        .activity-modal__additional-note {
          font-size: 14px;
          font-weight: 400;
          line-height: 22px;
          color: #64748b;
          margin: 8px 0 0 0;
          font-style: italic;
        }

        @media (max-width: 768px) {
          .activity-modal {
            padding: 24px;
            margin: 16px;
            max-height: calc(100vh - 32px);
          }

          .activity-modal__categories {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .activity-modal__title {
            font-size: 18px;
          }
        }
      `}</style>

      <style jsx global>{`
        .activity-modal__link {
          color: #156ff7;
          text-decoration: underline;
          text-underline-position: from-font;
        }

        .activity-modal__link:hover {
          text-decoration: none;
        }
      `}</style>
    </>
  );
}


