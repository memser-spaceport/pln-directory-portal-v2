import { TrustStatement } from './reconciliation';

// MOCKUP DATA — not served by plaa-service. Transcribed by hand from the
// Surus monthly statements for the PLAA1 Trust (account 20 00 5002 0 00).
// Amounts are copied exactly as printed; reconciliation.ts does the maths.
// Nothing here feeds the NAV table, NAV/PLAA or any asset column.
//
// Transcription rules:
// - Everything sits in the statement month it posted in, even a fee for the
//   prior month or a payout for an earlier auction.
// - Money market purchases/redemptions move cash into the fund and back —
//   both are inside the cash holding, so they're not movements.
// - "ADJUST COST BASIS FIL-FILECOIN" lines carry no amount and are skipped.
// - Auction payouts are one aggregated movement per month. Participant
//   names and individual amounts stay on the PDF.
// - Federated money market interest is reported under DIVIDENDS in the
//   Cash Activity Summary; the Activity Detail calls it interest.
//
// No July statement for the trust account exists in the set reviewed — the
// "7.26 PLAA Custody Statement" is the Protocol Labs custody account
// (60 00 5004 3 00), which held nothing. So August's opening values come
// from the August statement's "Value on JUL 31" column, which only gives
// the two asset classes, not individual assets.
//
// PLAA SPV LLC holds the Trust's Class B interest in PL Venture Holdings.
// Two things move it, both reaching Surus as "ADJUST COST BASIS" lines:
// the ownership percentage (signed Schedule I, from Javier) and the dollar
// value of that interest (PLVH valuation, from Patrick). Per the PLAA team.
// An adjustment that comes with a larger interest is a contribution; one
// that only revalues the same interest is an asset value change.
// Ownership % of Class B is not the SPV's share of trust assets.

const ACCOUNT = '20 00 5002 0 00';
const MONEY_MARKET = 'Federated Hermes Government Obligations Fund';

const OWNERSHIP_SOURCE = 'Signed Schedule I (Javier), per the PLAA team';

export const TRUST_STATEMENTS: TrustStatement[] = [
  {
    periodKey: 'M8-2026',
    file: '8.26 PLAA Trust Statement.pdf',
    account: ACCOUNT,
    openingDate: 'Jul 31',
    closingDate: 'Aug 31',
    openingNav: '8,392,030.90',
    closingNav: '11,465,145.94',
    spvOwnership: { classBPercent: '83.25', source: OWNERSHIP_SOURCE },
    holdings: [
      {
        id: 'cash',
        name: MONEY_MARKET,
        assets: ['Cash equivalents'],
        opening: '517,171.20',
        closing: '564,234.05',
        basis: 'carrying',
      },
      {
        // Jul 31 carrying value per the PLAA team ($6,762,564.75 →
        // $9,666,661.00) — not printed on a trust statement.
        id: 'spv',
        name: 'PLAA SPV LLC',
        assets: ['PLAA SPV LLC'],
        opening: '6,762,564.75',
        closing: '9,666,661.00',
        basis: 'carrying',
      },
      {
        // Opening = Miscellaneous Assets at Jul 31 ($7,874,859.70) less the
        // SPV's $6,762,564.75. Closing = Aug 31 BTC + ETH + FIL. Per-asset
        // July values aren't on any trust statement we have, so the three
        // reconcile as one holding.
        id: 'digital',
        name: 'BTC, ETH & FIL',
        assets: ['BTC', 'ETH', 'FIL'],
        opening: '1,112,294.95',
        closing: '1,234,250.89',
        basis: 'market',
        valuationLabel: 'BTC, ETH & FIL (combined)',
        valuationNote:
          'Combined for BTC, ETH and FIL — their individual Jul 31 values are not on the trust statements, so the movement cannot be split by asset.',
      },
    ],
    movements: [
      {
        category: 'interest',
        amount: '2.66',
        holding: 'cash',
        source: '08/03 FEDERATED JULY INTEREST',
        status: 'verified',
      },
      {
        category: 'interest',
        amount: '1,330.07',
        holding: 'cash',
        source: '08/03 FEDERATED JULY INTEREST',
        status: 'verified',
      },
      {
        category: 'admin',
        amount: '-14,583.33',
        holding: 'cash',
        source: '08/05 TRUST FEE FOR MONTH ENDED 07/31/26',
        status: 'verified',
      },
      {
        category: 'auctionProceeds',
        amount: '-19,686.55',
        holding: 'cash',
        source: 'AUCTION PROCEEDS PAYABLE — 3 payouts (08/07, 08/12, 08/25), 977 tokens at $20.15 clearing price',
        status: 'verified',
      },
      {
        category: 'cashContribution',
        amount: '80,000.00',
        holding: 'cash',
        source: '08/27 ADDITION TO ACCOUNT',
        status: 'verified',
      },
      {
        category: 'assetContribution',
        amount: '109,225.47',
        holding: 'digital',
        asset: 'FIL',
        label: 'FIL Contributions',
        source: '08/27 RECEIVED FROM PL — 150,000 FIL at $0.728/unit (cost recorded $109,225.47)',
        status: 'verified',
      },
      {
        category: 'spvContribution',
        amount: '2,904,096.25',
        holding: 'spv',
        asset: 'PLAA SPV LLC',
        source: '08/31 ADJUST COST BASIS — PLAA SPV LLC',
        status: 'verified',
        note: 'Class B ownership established at 83.25%; carrying value set from the PLVH valuation (Patrick).',
      },
    ],
  },
  {
    periodKey: 'M9-2026',
    file: '9.26 PLAA1 Statement.pdf',
    account: ACCOUNT,
    openingDate: 'Aug 31',
    closingDate: 'Sep 30',
    openingNav: '11,465,145.94',
    closingNav: '13,472,330.42',
    spvOwnership: { classBPercent: '93.78', priorClassBPercent: '83.25', source: OWNERSHIP_SOURCE },
    // Opening values and unrealized gain/loss: the August statement's
    // Portfolio Assets Detail. Closing: September's.
    holdings: [
      {
        id: 'cash',
        name: MONEY_MARKET,
        assets: ['Cash equivalents'],
        opening: '564,234.05',
        closing: '659,517.11',
        basis: 'carrying',
      },
      {
        id: 'btc',
        name: 'BTC-BITCOIN',
        assets: ['BTC'],
        opening: '158,700.87',
        closing: '168,801.48',
        openingUnrealized: '-33,503.21',
        closingUnrealized: '-23,402.60',
        basis: 'market',
        valuationLabel: 'BTC & ETH',
      },
      {
        id: 'eth',
        name: 'ETH-ETHEREUM',
        assets: ['ETH'],
        opening: '115,987.80',
        closing: '126,201.19',
        openingUnrealized: '-32,799.29',
        closingUnrealized: '-22,585.90',
        basis: 'market',
        valuationLabel: 'BTC & ETH',
      },
      {
        id: 'fil',
        name: 'FIL-FILECOIN',
        assets: ['FIL'],
        opening: '959,562.22',
        closing: '1,673,616.64',
        openingUnrealized: '-122,877.55',
        closingUnrealized: '397,815.10',
        basis: 'market',
        valuationLabel: 'FIL',
      },
      {
        id: 'spv',
        name: 'PLAA SPV LLC',
        assets: ['PLAA SPV LLC'],
        opening: '9,666,661.00',
        closing: '10,844,194.00',
        openingUnrealized: '0.00',
        closingUnrealized: '0.00',
        basis: 'carrying',
      },
    ],
    movements: [
      {
        category: 'interest',
        amount: '3.72',
        holding: 'cash',
        source: '09/03 FEDERATED AUGUST INTEREST',
        status: 'verified',
      },
      {
        category: 'interest',
        amount: '1,537.67',
        holding: 'cash',
        source: '09/03 FEDERATED AUGUST INTEREST',
        status: 'verified',
      },
      {
        category: 'legal',
        amount: '-1,425.00',
        holding: 'cash',
        source: '09/08 LEGAL FEE PAID TO MORRIS NICHOLS INVOICE #2609414 DATED 8/31/26',
        status: 'verified',
      },
      {
        category: 'admin',
        amount: '-14,583.33',
        holding: 'cash',
        source: '09/09 TRUST FEE FOR MONTH ENDED 08/31/26',
        status: 'verified',
      },
      {
        category: 'cashContribution',
        amount: '110,000.00',
        holding: 'cash',
        source: '09/14 ADDITION TO ACCOUNT',
        status: 'verified',
      },
      {
        category: 'assetContribution',
        amount: '193,361.77',
        holding: 'fil',
        asset: 'FIL',
        label: 'FIL Contributions',
        source: '09/14 RECEIVED FROM PL — 200,000 FIL at $0.967/unit (cost recorded $193,361.77)',
        status: 'verified',
      },
      {
        category: 'spvContribution',
        amount: '1,182,382.00',
        holding: 'spv',
        asset: 'PLAA SPV LLC',
        source: '09/14 ADJUST COST BASIS — PLAA SPV LLC',
        status: 'verified',
        note: 'Recorded at $10,849,043.00 as Class B ownership rose to 93.78%.',
      },
      {
        category: 'legal',
        amount: '-250.00',
        holding: 'cash',
        source: '09/29 BLUE SKY FILING FEES',
        status: 'verified',
      },
      {
        category: 'spvValuation',
        amount: '-4,849.00',
        holding: 'spv',
        asset: 'PLAA SPV LLC',
        source: '09/30 ADJUST COST BASIS — PLAA SPV LLC',
        status: 'verified',
        note: "Adjusted to $10,844,194.00 on Patrick's updated PLVH valuation.",
      },
    ],
  },
];
