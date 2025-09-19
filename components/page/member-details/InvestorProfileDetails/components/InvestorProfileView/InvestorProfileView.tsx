'use client';

import React from 'react';
import { clsx } from 'clsx';
import { IUserInfo } from '@/types/shared.types';
import { EditButton } from '@/components/page/member-details/components/EditButton';

import s from './InvestorProfileView.module.scss';
import { formatUSD } from '@/utils/formatUSD';

interface Props {
  isLoggedIn: boolean;
  userInfo: IUserInfo;
  isEditable: boolean;
  showIncomplete: boolean;
  onEdit?: () => void;
  typicalCheckSize: string | undefined;
  investmentFocusAreas: string[] | undefined;
  investInStartupStages: string[] | undefined;
  investInFundTypes: string[] | undefined;
  secRulesAccepted: boolean | undefined;
}

export const InvestorProfileView = ({
  typicalCheckSize,
  investmentFocusAreas,
  investInStartupStages,
  investInFundTypes,
  secRulesAccepted,
  isLoggedIn,
  isEditable,
  showIncomplete,
  onEdit,
}: Props) => {
  return (
    <>
      {showIncomplete && (
        <div className={s.incompleteStrip}>
          <span>
            <AlertIcon />
          </span>{' '}
          Add your investor details to connect with founders during Demo Days.
        </div>
      )}

      <div
        className={clsx(s.root, {
          [s.missingData]: showIncomplete && isLoggedIn,
        })}
      >
        <div className={s.header}>
          <h3 className={s.title}>Investor Profile</h3>
          {isEditable && onEdit && <EditButton onClick={onEdit} />}
        </div>

        <div className={s.content}>
          <div className={s.section}>
            <div className={s.col}>
              {(typicalCheckSize || isEditable) && (
                <div className={s.keywordsWrapper}>
                  <span className={s.keywordsLabel}>Check Size:</span>
                  <span className={s.badgesWrapper}>
                    {typicalCheckSize && secRulesAccepted ? (
                      <div className={s.badge}>{formatUSD.format(+typicalCheckSize)}</div>
                    ) : (
                      <button
                        type="button"
                        className={s.addKeywordsBadge}
                        onClick={() => {
                          onEdit?.();
                        }}
                      >
                        <AddIcon /> Add
                      </button>
                    )}
                  </span>
                </div>
              )}
              {(!!investmentFocusAreas?.length || isEditable) && (
                <div className={s.keywordsWrapper}>
                  <span className={s.keywordsLabel}>Investment Focus:</span>
                  <span className={s.badgesWrapper}>
                    {investmentFocusAreas?.length && secRulesAccepted ? (
                      investmentFocusAreas?.map((item: string) => (
                        <div key={item} className={s.badge}>
                          {item}
                        </div>
                      ))
                    ) : (
                      <button
                        type="button"
                        className={s.addKeywordsBadge}
                        onClick={() => {
                          onEdit?.();
                        }}
                      >
                        <AddIcon /> Add
                      </button>
                    )}
                  </span>
                </div>
              )}
              {(!!investInStartupStages?.length || isEditable) && (
                <div className={s.keywordsWrapper}>
                  <span className={s.keywordsLabel}>Startup Stages:</span>
                  <span className={s.badgesWrapper}>
                    {investInStartupStages?.length && secRulesAccepted ? (
                      investInStartupStages?.map((item: string) => (
                        <div key={item} className={s.badge}>
                          {item}
                        </div>
                      ))
                    ) : (
                      <button
                        type="button"
                        className={s.addKeywordsBadge}
                        onClick={() => {
                          onEdit?.();
                        }}
                      >
                        <AddIcon /> Add
                      </button>
                    )}
                  </span>
                </div>
              )}
              {isEditable && (
                <div className={s.keywordsWrapper}>
                  <span className={s.keywordsLabel}>Investment Types in VC Funds:</span>
                  <span className={s.badgesWrapper}>
                    {investInFundTypes?.length && secRulesAccepted ? (
                      investInFundTypes?.map((item: string) => (
                        <div key={item} className={s.badge}>
                          {item}
                        </div>
                      ))
                    ) : (
                      <button
                        type="button"
                        className={s.addKeywordsBadge}
                        onClick={() => {
                          onEdit?.();
                        }}
                      >
                        <AddIcon /> Add
                      </button>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const AlertIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M7.59375 5.90625C7.59375 5.68375 7.65973 5.46624 7.78335 5.28123C7.90697 5.09623 8.08267 4.95203 8.28823 4.86689C8.4938 4.78174 8.72 4.75946 8.93823 4.80287C9.15646 4.84627 9.35691 4.95342 9.51425 5.11075C9.67158 5.26809 9.77873 5.46854 9.82214 5.68677C9.86555 5.905 9.84327 6.1312 9.75812 6.33677C9.67297 6.54234 9.52878 6.71804 9.34377 6.84165C9.15876 6.96527 8.94126 7.03125 8.71875 7.03125C8.42038 7.03125 8.13424 6.91272 7.92326 6.70175C7.71228 6.49077 7.59375 6.20462 7.59375 5.90625ZM16.5938 9C16.5938 10.5019 16.1484 11.9701 15.314 13.2189C14.4796 14.4676 13.2936 15.441 11.906 16.0157C10.5184 16.5905 8.99158 16.7408 7.51854 16.4478C6.04549 16.1548 4.69242 15.4316 3.63041 14.3696C2.56841 13.3076 1.84517 11.9545 1.55217 10.4815C1.25916 9.00842 1.40954 7.48157 1.98429 6.094C2.55905 4.70642 3.53236 3.52044 4.78114 2.68603C6.02993 1.85162 7.4981 1.40625 9 1.40625C11.0133 1.40848 12.9435 2.20925 14.3671 3.63287C15.7907 5.0565 16.5915 6.9867 16.5938 9ZM14.9063 9C14.9063 7.83185 14.5599 6.68994 13.9109 5.71866C13.2619 4.74739 12.3395 3.99037 11.2602 3.54334C10.181 3.09631 8.99345 2.97934 7.84775 3.20724C6.70205 3.43513 5.64966 3.99765 4.82365 4.82365C3.99765 5.64965 3.43513 6.70205 3.20724 7.84775C2.97935 8.99345 3.09631 10.181 3.54334 11.2602C3.99037 12.3394 4.74739 13.2619 5.71867 13.9109C6.68994 14.5599 7.83186 14.9062 9 14.9062C10.5659 14.9046 12.0672 14.2818 13.1745 13.1745C14.2818 12.0672 14.9046 10.5659 14.9063 9ZM9.84375 11.5791V9.28125C9.84375 8.90829 9.69559 8.5506 9.43187 8.28688C9.16815 8.02316 8.81046 7.875 8.4375 7.875C8.23824 7.8747 8.04531 7.94494 7.89287 8.07326C7.74043 8.20158 7.63833 8.37972 7.60464 8.57611C7.57095 8.7725 7.60786 8.97447 7.70882 9.14626C7.80978 9.31805 7.96828 9.44857 8.15625 9.51469V11.8125C8.15625 12.1855 8.30441 12.5431 8.56813 12.8069C8.83186 13.0706 9.18954 13.2188 9.5625 13.2188C9.76176 13.219 9.9547 13.1488 10.1071 13.0205C10.2596 12.8922 10.3617 12.714 10.3954 12.5176C10.4291 12.3213 10.3921 12.1193 10.2912 11.9475C10.1902 11.7757 10.0317 11.6452 9.84375 11.5791Z"
      fill="#D97706"
    />
  </svg>
);

const AddIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M8 1.25C6.66498 1.25 5.35994 1.64588 4.2499 2.38758C3.13987 3.12928 2.27471 4.18349 1.76382 5.41689C1.25292 6.65029 1.11925 8.00749 1.3797 9.31686C1.64015 10.6262 2.28303 11.829 3.22703 12.773C4.17104 13.717 5.37377 14.3598 6.68314 14.6203C7.99251 14.8808 9.34971 14.7471 10.5831 14.2362C11.8165 13.7253 12.8707 12.8601 13.6124 11.7501C14.3541 10.6401 14.75 9.33502 14.75 8C14.748 6.2104 14.0362 4.49466 12.7708 3.22922C11.5053 1.96378 9.7896 1.25199 8 1.25ZM8 13.25C6.96165 13.25 5.94662 12.9421 5.08326 12.3652C4.2199 11.7883 3.547 10.9684 3.14964 10.0091C2.75228 9.04978 2.64831 7.99418 2.85088 6.97578C3.05345 5.95738 3.55347 5.02191 4.28769 4.28769C5.02192 3.55346 5.95738 3.05345 6.97578 2.85088C7.99418 2.6483 9.04978 2.75227 10.0091 3.14963C10.9684 3.54699 11.7883 4.2199 12.3652 5.08326C12.9421 5.94661 13.25 6.96165 13.25 8C13.2485 9.39193 12.6949 10.7264 11.7107 11.7107C10.7264 12.6949 9.39193 13.2485 8 13.25ZM11.25 8C11.25 8.19891 11.171 8.38968 11.0303 8.53033C10.8897 8.67098 10.6989 8.75 10.5 8.75H8.75V10.5C8.75 10.6989 8.67098 10.8897 8.53033 11.0303C8.38968 11.171 8.19892 11.25 8 11.25C7.80109 11.25 7.61032 11.171 7.46967 11.0303C7.32902 10.8897 7.25 10.6989 7.25 10.5V8.75H5.5C5.30109 8.75 5.11032 8.67098 4.96967 8.53033C4.82902 8.38968 4.75 8.19891 4.75 8C4.75 7.80109 4.82902 7.61032 4.96967 7.46967C5.11032 7.32902 5.30109 7.25 5.5 7.25H7.25V5.5C7.25 5.30109 7.32902 5.11032 7.46967 4.96967C7.61032 4.82902 7.80109 4.75 8 4.75C8.19892 4.75 8.38968 4.82902 8.53033 4.96967C8.67098 5.11032 8.75 5.30109 8.75 5.5V7.25H10.5C10.6989 7.25 10.8897 7.32902 11.0303 7.46967C11.171 7.61032 11.25 7.80109 11.25 8Z"
      fill="#455468"
    />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M11.0306 5.96938C11.1005 6.03905 11.156 6.12185 11.1939 6.21301C11.2317 6.30418 11.2512 6.40191 11.2512 6.50063C11.2512 6.59934 11.2317 6.69708 11.1939 6.78824C11.156 6.8794 11.1005 6.9622 11.0306 7.03188L7.53063 10.5319C7.46095 10.6018 7.37816 10.6573 7.28699 10.6951C7.19583 10.733 7.09809 10.7525 6.99938 10.7525C6.90067 10.7525 6.80293 10.733 6.71176 10.6951C6.6206 10.6573 6.53781 10.6018 6.46813 10.5319L4.96813 9.03187C4.89836 8.96211 4.84302 8.87929 4.80527 8.78814C4.76751 8.69698 4.74808 8.59929 4.74808 8.50062C4.74808 8.40196 4.76751 8.30427 4.80527 8.21311C4.84302 8.12196 4.89836 8.03914 4.96813 7.96938C5.03789 7.89961 5.12072 7.84427 5.21187 7.80651C5.30302 7.76876 5.40072 7.74932 5.49938 7.74932C5.59804 7.74932 5.69574 7.76876 5.78689 7.80651C5.87804 7.84427 5.96086 7.89961 6.03063 7.96938L7 8.9375L9.96938 5.9675C10.0392 5.89789 10.122 5.84272 10.2131 5.80513C10.3042 5.76755 10.4018 5.7483 10.5004 5.74847C10.599 5.74865 10.6965 5.76825 10.7875 5.80615C10.8785 5.84405 10.9611 5.89952 11.0306 5.96938ZM14.75 8C14.75 9.33502 14.3541 10.6401 13.6124 11.7501C12.8707 12.8601 11.8165 13.7253 10.5831 14.2362C9.34971 14.7471 7.99251 14.8808 6.68314 14.6203C5.37377 14.3599 4.17104 13.717 3.22703 12.773C2.28303 11.829 1.64015 10.6262 1.3797 9.31686C1.11925 8.00749 1.25292 6.65029 1.76382 5.41689C2.27471 4.18349 3.13987 3.12928 4.2499 2.38758C5.35994 1.64588 6.66498 1.25 8 1.25C9.7896 1.25199 11.5053 1.96378 12.7708 3.22922C14.0362 4.49466 14.748 6.2104 14.75 8ZM13.25 8C13.25 6.96165 12.9421 5.94661 12.3652 5.08326C11.7883 4.2199 10.9684 3.54699 10.0091 3.14963C9.04978 2.75227 7.99418 2.6483 6.97578 2.85088C5.95738 3.05345 5.02192 3.55346 4.28769 4.28769C3.55347 5.02191 3.05345 5.95738 2.85088 6.97578C2.64831 7.99418 2.75228 9.04978 3.14964 10.0091C3.547 10.9684 4.2199 11.7883 5.08326 12.3652C5.94662 12.9421 6.96165 13.25 8 13.25C9.39193 13.2485 10.7264 12.6949 11.7107 11.7107C12.6949 10.7264 13.2485 9.39193 13.25 8Z"
      fill="#455468"
    />
  </svg>
);
