import React from 'react';
import { formatUSD } from '@/utils/formatUSD';
import s from '../InvestorProfileView.module.scss';

interface Props {
  typicalCheckSize?: string | undefined;
  investmentFocusAreas?: string[] | undefined;
  investInStartupStages?: string[] | undefined;
  investInFundTypes?: string[] | undefined;
  secRulesAccepted?: boolean | undefined;
  isEditable: boolean;
  onEdit?: () => void;
}

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13.5 8C13.5 8.13261 13.4473 8.25979 13.3536 8.35355C13.2598 8.44732 13.1326 8.5 13 8.5H8.5V13C8.5 13.1326 8.44732 13.2598 8.35355 13.3536C8.25979 13.4473 8.13261 13.5 8 13.5C7.86739 13.5 7.74021 13.4473 7.64645 13.3536C7.55268 13.2598 7.5 13.1326 7.5 13V8.5H3C2.86739 8.5 2.74021 8.44732 2.64645 8.35355C2.55268 8.25979 2.5 8.13261 2.5 8C2.5 7.86739 2.55268 7.74021 2.64645 7.64645C2.74021 7.55268 2.86739 7.5 3 7.5H7.5V3C7.5 2.86739 7.55268 2.74021 7.64645 2.64645C7.74021 2.55268 7.86739 2.5 8 2.5C8.13261 2.5 8.25979 2.55268 8.35355 2.64645C8.44732 2.74021 8.5 2.86739 8.5 3V7.5H13C13.1326 7.5 13.2598 7.55268 13.3536 7.64645C13.4473 7.74021 13.5 7.86739 13.5 8Z"
      fill="currentColor"
    />
  </svg>
);

export const InvestmentDetailsSection: React.FC<Props> = ({
  typicalCheckSize,
  investmentFocusAreas,
  investInStartupStages,
  secRulesAccepted,
  isEditable,
  onEdit,
}) => {
  const hasStartupStages = !!investInStartupStages?.length && secRulesAccepted;
  const hasTypicalCheckSize = !!typicalCheckSize && secRulesAccepted;
  const hasInvestmentFocus = !!investmentFocusAreas?.length && secRulesAccepted;

  return (
    <div className={s.section}>
      <div className={s.keywordsWrapper}>
        <span className={s.keywordsLabel}>Startup Stages</span>
        <span className={s.badgesWrapper}>
          {hasStartupStages ? (
            investInStartupStages?.join(', ')
          ) : isEditable ? (
            <button type="button" className={s.addPill} onClick={onEdit}>
              <PlusIcon />
              <span>Add startup stages</span>
            </button>
          ) : (
            '-'
          )}
        </span>
      </div>

      <div className={s.keywordsWrapper}>
        <span className={s.keywordsLabel}>Typical Check Size</span>
        <span className={s.badgesWrapper}>
          {hasTypicalCheckSize ? (
            <div className={s.badge}>{formatUSD.format(+typicalCheckSize)}</div>
          ) : isEditable ? (
            <button type="button" className={s.addPill} onClick={onEdit}>
              <PlusIcon />
              <span>Typical check size</span>
            </button>
          ) : (
            '-'
          )}
        </span>
      </div>

      <div className={s.keywordsWrapper}>
        <span className={s.keywordsLabel}>Investment Focus</span>
        <span className={s.badgesWrapper}>
          {hasInvestmentFocus ? (
            investmentFocusAreas?.join(', ')
          ) : isEditable ? (
            <button type="button" className={s.addPill} onClick={onEdit}>
              <PlusIcon />
              <span>Investment focus</span>
            </button>
          ) : (
            '-'
          )}
        </span>
      </div>
    </div>
  );
};
