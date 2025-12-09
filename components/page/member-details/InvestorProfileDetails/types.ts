export interface TEditInvestorProfileForm {
  // type: { label: string; value: string } | null;
  team: { label: string; value: string } | null;
  typicalCheckSize: string;
  investmentFocusAreas: string[];
  investInStartupStages: { label: string; value: string }[];
  investInFundTypes: { label: string; value: string }[];
  teamRole: string;
  website: string;

  teamInvestmentFocusAreas: string[];
  teamTypicalCheckSize: string;
  teamInvestInStartupStages: { label: string; value: string }[];
  teamInvestInFundTypes: { label: string; value: string }[];

  secRulesAccepted: boolean;
  isInvestViaFund: boolean;
}

export interface TEditInvestorProfileFormTeam {
  typicalCheckSize: string;
  investmentFocusAreas: string[];
  displayAsInvestor: boolean;
}
