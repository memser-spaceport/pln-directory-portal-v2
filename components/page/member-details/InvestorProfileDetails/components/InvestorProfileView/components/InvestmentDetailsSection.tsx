import React from 'react';
import { formatUSD } from '@/utils/formatUSD';
import s from '../InvestorProfileView.module.scss';

interface Props {
  typicalCheckSize: number | undefined;
  investmentFocusAreas: string[] | undefined;
  investInStartupStages: string[] | undefined;
  investInFundTypes: string[] | undefined;
  secRulesAccepted: boolean | undefined;
  isEditable: boolean;
  onEdit?: () => void;
}

const AddIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M8 1.25C6.66498 1.25 5.35994 1.64588 4.2499 2.38758C3.13987 3.12928 2.27471 4.18349 1.76382 5.41689C1.25292 6.65029 1.11925 8.00749 1.3797 9.31686C1.64015 10.6262 2.28303 11.829 3.22703 12.773C4.17104 13.717 5.37377 14.3598 6.68314 14.6203C7.99251 14.8808 9.34971 14.7471 10.5831 14.2362C11.8165 13.7253 12.8707 12.8601 13.6124 11.7501C14.3541 10.6401 14.75 9.33502 14.75 8C14.748 6.2104 14.0362 4.49466 12.7708 3.22922C11.5053 1.96378 9.7896 1.25199 8 1.25ZM8 13.25C6.96165 13.25 5.94662 12.9421 5.08326 12.3652C4.2199 11.7883 3.547 10.9684 3.14964 10.0091C2.75228 9.04978 2.64831 7.99418 2.85088 6.97578C3.05345 5.95738 3.55347 5.02191 4.28769 4.28769C5.02192 3.55346 5.95738 3.05345 6.97578 2.85088C7.99418 2.6483 9.04978 2.75227 10.0091 3.14963C10.9684 3.54699 11.7883 4.2199 12.3652 5.08326C12.9421 5.94661 13.25 6.96165 13.25 8C13.2485 9.39193 12.6949 10.7264 11.7107 11.7107C10.7264 12.6949 9.39193 13.2485 8 13.25ZM11.25 8C11.25 8.19891 11.171 8.38968 11.0303 8.53033C10.8897 8.67098 10.6989 8.75 10.5 8.75H8.75V10.5C8.75 10.6989 8.67098 10.8897 8.53033 11.0303C8.38968 11.171 8.19892 11.25 8 11.25C7.80109 11.25 7.61032 11.171 7.46967 11.0303C7.32902 10.8897 7.25 10.6989 7.25 10.5V8.75H5.5C5.30109 8.75 5.11032 8.67098 4.96967 8.53033C4.82902 8.38968 4.75 8.19891 4.75 8C4.75 7.80109 4.82902 7.61032 4.96967 7.46967C5.11032 7.32902 5.30109 7.25 5.5 7.25H7.25V5.5C7.25 5.30109 7.32902 5.11032 7.46967 4.96967C7.61032 4.82902 7.80109 4.75 8 4.75C8.19892 4.75 8.38968 4.82902 8.53033 4.96967C8.67098 5.11032 8.75 5.30109 8.75 5.5V7.25H10.5C10.6989 7.25 10.8897 7.32902 11.0303 7.46967C11.171 7.61032 11.25 7.80109 11.25 8Z"
      fill="#455468"
    />
  </svg>
);

export const InvestmentDetailsSection: React.FC<Props> = ({
  typicalCheckSize,
  investmentFocusAreas,
  investInStartupStages,
  investInFundTypes,
  secRulesAccepted,
  isEditable,
  onEdit,
}) => {
  return (
    <div className={s.section}>
      {(!!investInStartupStages?.length || isEditable) && (
        <div className={s.keywordsWrapper}>
          <span className={s.keywordsLabel}>Startup Stages:</span>
          <span className={s.badgesWrapper}>
            {investInStartupStages?.length && secRulesAccepted
              ? investInStartupStages?.join(', ')
              : // <button
                //   type="button"
                //   className={s.addKeywordsBadge}
                //   onClick={() => {
                //     onEdit?.();
                //   }}
                // >
                //   <AddIcon /> Add
                // </button>
                '-'}
          </span>
        </div>
      )}

      {(typicalCheckSize || isEditable) && (
        <div className={s.keywordsWrapper}>
          <span className={s.keywordsLabel}>Typical Check Size:</span>
          <span className={s.badgesWrapper}>
            {typicalCheckSize && secRulesAccepted ? (
              <div className={s.badge}>{formatUSD.format(+typicalCheckSize)}</div>
            ) : (
              // <button
              //   type="button"
              //   className={s.addKeywordsBadge}
              //   onClick={() => {
              //     onEdit?.();
              //   }}
              // >
              //   <AddIcon /> Add
              // </button>
              '-'
            )}
          </span>
        </div>
      )}

      {(!!investmentFocusAreas?.length || isEditable) && (
        <div className={s.keywordsWrapper}>
          <span className={s.keywordsLabel}>Investment Focus:</span>
          <span className={s.badgesWrapper}>
            {investmentFocusAreas?.length && secRulesAccepted
              ? investmentFocusAreas?.map((item: string) => (
                  <div key={item} className={s.badge}>
                    {item}
                  </div>
                ))
              : // <button
                //   type="button"
                //   className={s.addKeywordsBadge}
                //   onClick={() => {
                //     onEdit?.();
                //   }}
                // >
                //   <AddIcon /> Add
                // </button>
                '-'}
          </span>
        </div>
      )}

      {/*{isEditable && (*/}
      {/*  <div className={s.keywordsWrapper}>*/}
      {/*    <span className={s.keywordsLabel}>Investment Types in VC Funds:</span>*/}
      {/*    <span className={s.badgesWrapper}>*/}
      {/*      {investInFundTypes?.length && secRulesAccepted ? (*/}
      {/*        investInFundTypes?.map((item: string) => (*/}
      {/*          <div key={item} className={s.badge}>*/}
      {/*            {item}*/}
      {/*          </div>*/}
      {/*        ))*/}
      {/*      ) : (*/}
      {/*        <button*/}
      {/*          type="button"*/}
      {/*          className={s.addKeywordsBadge}*/}
      {/*          onClick={() => {*/}
      {/*            onEdit?.();*/}
      {/*          }}*/}
      {/*        >*/}
      {/*          <AddIcon /> Add*/}
      {/*        </button>*/}
      {/*      )}*/}
      {/*    </span>*/}
      {/*  </div>*/}
      {/*)}*/}
    </div>
  );
};
