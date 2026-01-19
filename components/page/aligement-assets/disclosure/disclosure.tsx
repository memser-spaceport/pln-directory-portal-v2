'use client';

import { useScrollDepthTracking } from '@/hooks/useScrollDepthTracking';

const disclosureContent = [
  'Protocol Labs, Inc. ("PL-Init") and Polaris, Inc. ("Polaris") are contributors to the PLAA1 Trust, a trust in the process of being formed and managed by a state-chartered, independent trust company, Surus Trust Company. PLAA1 Trust may issue units of value related to the PLAA1 Trust ("Alignment Asset"). The Alignment Asset is part of a series of experiments in network-wide alignment mechanisms. PL-Init and Polaris are involved in several ways that may impact the success of the Alignment Asset and PLAA1 Trust. For example, among other things, PL-Init may participate in governance decisions and make contributions to PLAA1 Trust, and Polaris may measure network activities that the trust company uses to allocate the Alignment Asset. PL-Init and Polaris stand to profit from the Alignment Asset: their team members may receive the Alignment Asset, and both companies may benefit from the increased network coordination and value creation presented by the Alignment Asset. Different network companies\' individual interests and activities, including PL-init\'s and Polaris\', may create slightly different incentives for them.',
  'PL-Init and Polaris are not acting as investment advisors, financial advisors, sponsors, brokers, solicitors, or underwriters. When PL-Init and Polaris communicate or share materials related to the Alignment Asset ("AA Comms"), they are not accounting for anyone\'s specific financial, legal, or tax situation, investment goals, or restrictions. AA Comms should not be taken as investment advice and are not intended to provide a basis for making investment choices. Any views or opinions in AA Comms are not advising recipients personally about the nature, potential, or value of the Alignment Asset. AA Comms should not be taken as an opinion that any particular investment or strategy is appropriate. Recipients should make their own independent decisions about the Alignment Asset, as they alone are responsible for their investment decisions.',
  'AA Comms may include information from third parties that neither PL-Init nor Polaris independently verified or audited. Information presented is current on the date posted and may change at any time without notice. While information in AA Comms is believed to be accurate on the date made, PL-Init and Polaris make no warranty, express or implied, about the completeness or accuracy of this information, nor can they accept responsibility for any errors or missing information. There is no representation or warranty about the achievement or reasonableness of projections and targets in AA Comms. PL-Init and Polaris have no obligation to provide recipients with any additional information or keep info updated.',
  'The opinions and conclusions in AA Comms reflect PL-Init\'s and/or Polaris\' views based on each company\'s own research methods, sources, and analysis. There may be inherent limitations, like incomplete data, faulty research processes, sampling errors, human errors, improper weighting of data, and other factors that influenced their opinions and conclusions. Recipients should not view opinions or conclusions in AA Comms as definite or complete — others could reach different conclusions or interpretations by using different or more complete data, or a different perspective.'
];

const Disclosure = () => {
  useScrollDepthTracking('disclosure');
  return (
    <>
      <div className="disclosure">
        <div className="disclosure__title">
          <div>Alignment Asset Disclosure</div>
          <div className="disclosure__date">Last Updated: April 9, 2025</div>
        </div>
        <div className="disclosure__content">
          {disclosureContent.map((item, index) => (
            <div key={index}>{item}</div>
          ))}
        </div>
      </div>
      <style jsx>{`
        .disclosure {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .disclosure__title {
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-weight: 600;
          font-size: 20px;
          color: #16161f;
        }

        .disclosure__date {
          font-weight: 500;
          font-style: Italic;
          font-size: 14px;
          line-height: 27px;
          color: #64748b;
        }

        .disclosure__content {
          display: flex;
          flex-direction: column;
          gap: 16px;
          font-weight: 400;
          font-size: 14px;
          line-height: 20px;
          color: #475569;
        }
      `}</style>
    </>
  );
};

export default Disclosure;
