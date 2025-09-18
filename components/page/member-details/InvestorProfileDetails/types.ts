export interface TEditInvestorProfileForm {
  typicalCheckSize?: string;
  investmentFocusAreas: string[];
  investToStartups: { label: string; value: string }[];
  investInVcFunds: { label: string; value: string }[];
  secRulesAccepted: boolean;
}

export interface TEditInvestorProfileFormTeam {
  typicalCheckSize: string;
  investmentFocusAreas: string[];
  displayAsInvestor: boolean;
}
