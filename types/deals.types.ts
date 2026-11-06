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
  isHighValue?: boolean;
  /** The offer's headline value, short enough for a pill ("12 mo free", "$50K credits"; LAB-3071). Null when unset. */
  offerValue?: string | null;
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
