'use client';

import { useScrollDepthTracking } from '@/hooks/useScrollDepthTracking';

const disclosureContent = [
  'Protocol Labs, Inc. ("PL-Init") and Polaris Labs, Inc. ("Polaris") are contributors to the PLAA1 Trust, a grantor trust structured as a Delaware statutory trust ("PLAA1 Trust" or "Trust") for which Surus Trust Company, LLC ("Surus") serves as the trustee of the Trust.',
  'The Trust seeks to track the overall performance and development of the Protocol Labs Network through investments and other activities associated with the Protocol Labs Network and administered by the Trustee. To facilitate participation in the program, the Trust will issue rights to eligible participants that permit participation in auction events and certain other program activities ("PLAA"). However, PLAA does not represent an ownership interest in the Trust, the Protocol Labs Network, or any network participant, and does not entitle holders to participate directly in the revenues, profits, assets, net asset value or appreciation of the Protocol Labs Network or the Trust. PLAA also does not confer any voting, governance or similar rights with respect to the Trust, the Protocol Labs Network or any network participant. Rather, PLAA provides holders with the ability to participate in auction events and certain other program activities in accordance with the terms of the Trust Documents.',
  'PLAA that is accepted in an auction event will be settled through the issuance of Alignment Asset Tokens as part of the Trust\'s settlement process. The Alignment Asset Tokens are used solely in connection with settlement and are not intended to be held by participants on an ongoing basis. In connection with a settlement event, Alignment Asset Tokens will be issued and then immediately purchased by the Trust in exchange for cash or other consideration in accordance with the terms of the Trust Documents. PLAA and settled Alignment Asset Tokens are experimental in nature, and recipients should understand that their design, implementation, and utility may change materially over time.',
  'PL-Init and Polaris are involved in aspects of the program that may affect PLAA, the Alignment Asset Tokens and the PLAA1 Trust. For example, PL-Init may participate in governance decisions affecting the Protocol Labs Network and is the primary contributor of assets to the PLAA1 Trust. Meanwhile, Polaris measures network activities that are used by the Trust in determining allocations of PLAA to participants. In addition, personnel of PL-Init and Polaris may receive PLAA and therefore may have interests that differ from those of other participants in the Protocol Labs Network. As a result, conflicts of interest may arise. In particular, (i) PL-Init\'s participation in governance decisions may influence outcomes in ways that benefit PL-Init or personnel at the expense of recipients of PLAA or other participants in the Protocol Labs Network; (ii) Polaris\'s role in measuring network activities used to determine Token allocations of PLAA may create a conflict, as Polaris\'s measurement methodology may affect allocations to its own personnel and affiliates; and (iii) PL-Init, Polaris and their personnel are direct economic beneficiaries of PLAA and may otherwise pursue objectives or take positions that advance their own interests, which may not always align with the interests of recipients of PLAA or other participants in the Protocol Labs Network. Recipients should carefully consider these conflicts when evaluating any information provided by PL-Init or Polaris.',
  'PL-Init and Polaris are not acting as investment advisers, financial advisers, sponsors, brokers, solicitors, underwriters, or fiduciaries with respect to the PLAA1 Trust, PLAA, or any Alignment Asset Tokens. When PL-Init and Polaris communicate or share materials relating to the PLAA1 Trust, PLAA, or any Alignment Asset Tokens ("AA Comms"), they do not take into account any recipient\'s particular financial, legal, tax, or investment circumstances, objectives or restrictions. AA Comms are provided for informational purposes only and should not be construed as investment, legal, tax, or financial advice or as a recommendation to hold, transfer, or dispose of any PLAA or Alignment Asset Tokens. Any views or opinions expressed in AA Comms are general in nature and are not directed to any particular recipient. Recipients are solely responsible for evaluating the merits and risks associated with PLAA and any Alignment Asset Tokens and for making their own independent decisions with respect thereto.',
  'AA Comms may include information from third parties that neither PL-Init nor Polaris independently verified or audited. Information presented is current on the date posted and may change at any time without notice. While information in AA Comms is believed to be accurate on the date made, PL-Init and Polaris make no warranty, express or implied, about the completeness or accuracy of this information, nor can they accept responsibility for any errors or missing information. There is no representation or warranty about the achievement or reasonableness of projections and targets in AA Comms. PL-Init and Polaris have no obligation to provide recipients with any additional information or update or correct any info in AA Comms following publication.',
  'The opinions and conclusions in AA Comms reflect PL-Init\'s and/or Polaris\' views based on each company\'s own research methods, sources, and analysis. There may be inherent limitations, like incomplete data, faulty research processes, sampling errors, human errors, improper weighting of data, and other factors that influenced their opinions and conclusions. Recipients should not view opinions or conclusions in AA Comms as definite or complete — others could reach different conclusions or interpretations by using different or more complete data, or a different perspective.',
  'Certain statements in AA Comms may constitute forward-looking statements, including statements about the expected benefits, utility, value, or performance of PLAA and corresponding settled Alignment Asset Tokens. These statements involve known and unknown risks, uncertainties, and other factors and are based on current expectations and assumptions that may prove to be incorrect. Actual results may differ materially from those expressed or implied in any forward-looking statement. PL-Init and Polaris undertake no obligation to update or revise any forward-looking statements, whether as a result of new information, future developments, or otherwise.',
];

const Disclosure = () => {
  useScrollDepthTracking('disclosure');
  return (
    <>
      <div className="disclosure">
        <div className="disclosure__title">
          <div>Alignment Asset Tokens Disclosure</div>
          <div className="disclosure__date">Last Updated: July 2, 2026</div>
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
