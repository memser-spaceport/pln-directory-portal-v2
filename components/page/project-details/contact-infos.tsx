'use client';

import { Tooltip } from '@/components/core/tooltip/tooltip';

/**
 * The contact information interface.
 * @interface IContactInfos
 * @property {string} contactEmail - The contact email address.
 */
interface IContactInfos {
  contactEmail: string;
}

/**
 * component to render the contact information.
 *
 * @param {object} props - The component props.
 * @param {string} props.contactEmail - The contact email address.
 * @returns {JSX.Element} The rendered component.
 */
const ContactInfos = (props: IContactInfos) => {
  const contactEmail = props?.contactEmail;

  return (
    <>
      <div className="contacts">
        <div className="contacts__hdr">
          <h6 className="contacts__hdr__title">Contact Info</h6>
        </div>
        <div className="contacts__body">
          <div className="contacts__body__emailInfo">
            <span className="contacts__body__emailInfo__icon">
              <img src="/icons/message-blue.svg" alt="message icon" />
            </span>
            <Tooltip asChild content={contactEmail} trigger={<span className="contacts__body__emailInfo__email">{contactEmail}</span>} />
          </div>
        </div>
      </div>
      <style jsx>{`
        .contacts {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .contacts__hdr {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 14px;
          border-bottom: 1px solid #e2e8f0;
          color: #0f172a;
        }

        .contacts__hdr__title {
          font-size: 18px;
          font-weight: 600;
          line-height: 28px;
          letter-spacing: 0.01em;
        }

        .contacts__body__emailInfo {
          display: flex;
          gap: 8px;
          background-color: #f1f5f9;
          border-radius: 8px;
          height: 32px;
          align-items: center;
          padding: 0px 7px;
        }

        .contacts__body__emailInfo__icon {
          height: 20px;
          width: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #fff;
          border-radius: 4px;
        }

        .contacts__body__emailInfo__email {
          font-size: 13px;
          font-weight: 500;
          line-height: 20px;
          letter-spacing: 0px;
          color: #475569;
          text-overflow: ellipsis;
          overflow: hidden;
          white-space: nowrap;
          width: 85vw;
          display: inline-block;
        }

        @media (min-width: 1024px) {
          .contacts__body__emailInfo__email {
            width: 217px;
          }
        }
      `}</style>
    </>
  );
};

export default ContactInfos;
