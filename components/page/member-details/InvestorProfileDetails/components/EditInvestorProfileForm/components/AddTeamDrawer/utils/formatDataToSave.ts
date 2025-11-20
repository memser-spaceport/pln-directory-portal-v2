import map from 'lodash/map';

import { IUserInfo } from '@/types/shared.types';

export function formatDataToSave(data: any, userInfo: IUserInfo) {
  function formatIdNameToUidTitle(obj: { id: string; name: string }) {
    const { id, name } = obj;

    return {
      uid: id,
      title: name,
    };
  }

  return {
    name: data.name,
    shortDescription: data.description,
    teamProfile: data.image,
    requestorEmail: userInfo?.email,
    isFund: data.isInvestmentFund,
    investorProfile: {
      investInFundTypes: map(data.fundTypes, 'label'),
      investInStartupStages: map(data.startupStages, 'label'),
      typicalCheckSize: Number(data.checkSize),
      investmentFocus: data.investmentFocus,
    },
    contactMethod: data.contactMethod ?? '',
    website: data.website,
    industryTags: map(data.industryTags, formatIdNameToUidTitle),
    fundingStage: data.fundingStage ? formatIdNameToUidTitle(data.fundingStage) : null,
    role: data.role,
    technologies: [],
  };
}
