export interface IDeal {
  uid: string;
  vendorName: string;
  vendorTeamUid: string | null;
  logoUid: string | null;
  category: string;
  audience: string;
  shortDescription: string;
  fullDescription?: string;
  redemptionInstructions?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  isRedeemed: boolean;
  isUsing: boolean;
  teamsRedemptionCount: number;
  teamsUsingCount: number;
  logoUrl: string | null;
}

export interface IDealFilterOption {
  value: string;
  label: string;
  count: number;
}

export interface IDealFilterValues {
  categories: IDealFilterOption[];
  audiences: IDealFilterOption[];
}
