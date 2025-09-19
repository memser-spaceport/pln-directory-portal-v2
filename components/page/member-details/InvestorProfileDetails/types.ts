export interface TEditInvestorProfileForm {
  typicalCheckSize?: string;
  investmentFocusAreas: string[];
  investInStartupStages: { label: string; value: string }[];
  investInFundTypes: { label: string; value: string }[];
  secRulesAccepted: boolean;
  investThroughFund: boolean;
}

export interface TEditInvestorProfileFormTeam {
  typicalCheckSize: string;
  investmentFocusAreas: string[];
  displayAsInvestor: boolean;
}
