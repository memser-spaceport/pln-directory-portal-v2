'use client';

import { useState } from 'react';
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import { useAlignmentAssetsAnalytics } from '@/analytics/alignment-assets.analytics';
import { useScrollDepthTracking } from '@/hooks/useScrollDepthTracking';
import { DonutSlice, NavPoint, TrustHoldingsData } from '@/services/plaa/trust-holdings.service';

type ViewMode = 'quarterly' | 'monthly';

// Presentation theme — the chart series palette (the dataset itself comes from
// the API; these are view concerns kept alongside the component).
const SERIES_COLORS = {
  plvh: '#30c593',
  digital: '#0090ff',
  treasuries: '#64748b',
  nav: '#1e3a8a',
};

/** Combined digital-asset value (BTC + ETH + FIL) for the stacked bar. */
const digitalTotal = (p: { btc: number; eth: number; fil: number }) => p.btc + p.eth + p.fil;

const KEY_ITEMS = [
  { label: 'PLVH', color: SERIES_COLORS.plvh, line: false },
  { label: 'Digital assets', color: SERIES_COLORS.digital, line: false },
  { label: 'US Treasuries', color: SERIES_COLORS.treasuries, line: false },
  { label: 'NAV / PLAA', color: SERIES_COLORS.nav, line: true },
];

const formatCurrency = (value: number) => {
  if (!value) return '—';
  const fractionDigits = Number.isInteger(value) ? 0 : 2;
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: fractionDigits, maximumFractionDigits: 2 })}`;
};
// Whole rounded dollars — used for the BTC / ETH / FIL / PLVH asset columns
const formatAsset = (value: number) =>
  value ? `$${Math.round(value).toLocaleString('en-US')}` : '—';
// NAV per PLAA is shown with two decimals in the chart pills and table.
const formatPerPlaa = (value: number) => `$${value.toFixed(2)}`;
const formatMillions = (value: number) => `$${(value / 1_000_000).toFixed(2)}M`;
const formatCount = (value: number) => value.toLocaleString('en-US');

// Pill label centered on each point of the NAV / PLAA line (the line passes
// through the pill centers, matching the Figma design).
const PILL_HEIGHT = 26;
const renderNavLabel = (props: any) => {
  const { x, y, value } = props;
  if (x == null || y == null) return <g />;
  const text = formatPerPlaa(value);
  const width = 22 + text.length * 7;
  return (
    <g transform={`translate(${x - width / 2}, ${y - PILL_HEIGHT / 2})`}>
      <rect width={width} height={PILL_HEIGHT} rx={6} fill={SERIES_COLORS.nav} />
      <text x={width / 2} y={PILL_HEIGHT / 2 + 4} textAnchor="middle" fill="#ffffff" fontSize={12} fontWeight={700}>
        {text}
      </text>
    </g>
  );
};

// Total trust value drawn above each stacked bar. The final (PLVH-bearing) bar
// is highlighted in green to match the design.
const renderTotalLabel = (rows: NavPoint[]) => (props: any) => {
  const { x, y, width, value, index } = props;
  if (!value) return null;
  const highlight = rows[index] && rows[index].plvh > 0;
  return (
    <text
      x={x + width / 2}
      y={y - 10}
      textAnchor="middle"
      fill={highlight ? SERIES_COLORS.plvh : '#475569'}
      fontSize={13}
      fontWeight={700}
    >
      {formatMillions(value)}
    </text>
  );
};

// X-axis tick: the final category (current quarter) is highlighted in blue.
const renderAxisTick = (lastLabel: string) => (props: any) => {
  const { x, y, payload } = props;
  const isLast = payload.value === lastLabel;
  return (
    <text
      x={x}
      y={y}
      dy={16}
      textAnchor="middle"
      fill={isLast ? '#0090ff' : '#64748b'}
      fontSize={12}
      fontWeight={isLast ? 600 : 500}
    >
      {payload.value}
    </text>
  );
};

function NavChart({ data }: { data: NavPoint[] }) {
  // Stacked bars use the combined digital-asset value (BTC + ETH + FIL)
  const chartData = data.map((d) => ({ ...d, digital: digitalTotal(d) }));
  return (
    <div className="th-chart">
      <ResponsiveContainer width="100%" height={420}>
        <ComposedChart data={chartData} margin={{ top: 48, right: 16, left: 16, bottom: 8 }} barCategoryGap="35%">
          <CartesianGrid strokeDasharray="0" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="label"
            axisLine={{ stroke: '#cbd5e1' }}
            tickLine={false}
            tick={renderAxisTick(chartData[chartData.length - 1]?.label)}
            interval={0}
          />
          <YAxis yAxisId="nav" hide domain={[0, (max: number) => max * 1.15]} />
          <YAxis yAxisId="perPlaa" hide domain={[0, 30]} />
          <Bar yAxisId="nav" dataKey="treasuries" stackId="nav" fill={SERIES_COLORS.treasuries} barSize={92} />
          <Bar yAxisId="nav" dataKey="digital" stackId="nav" fill={SERIES_COLORS.digital} barSize={92} />
          <Bar yAxisId="nav" dataKey="plvh" stackId="nav" fill={SERIES_COLORS.plvh} barSize={92} radius={[4, 4, 0, 0]}>
            <LabelList dataKey="nav" content={renderTotalLabel(chartData)} />
          </Bar>
          <Line
            yAxisId="perPlaa"
            type="linear"
            dataKey="navPerPlaa"
            stroke={SERIES_COLORS.nav}
            strokeWidth={2}
            dot={{ r: 3, fill: SERIES_COLORS.nav, strokeWidth: 0 }}
            label={renderNavLabel}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// Asset columns show a muted dash when the holding is not yet held.
const assetCell = (value: number) =>
  value ? formatAsset(value) : <span className="th-table__dash">—</span>;

function NavTable({ data }: { data: NavPoint[] }) {
  return (
    <div className="th-table-wrapper">
      <table className="th-table">
        <thead>
          <tr>
            <th>DATE</th>
            <th>TOTAL PLAA</th>
            <th>NAV</th>
            <th>NAV / PLAA</th>
            <th>US TREASURIES</th>
            <th>BTC</th>
            <th>ETH</th>
            <th>FIL</th>
            <th>PLVH</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.date}>
              <td className="th-table__date">{row.date}</td>
              <td>{formatCount(row.totalPlaa)}</td>
              <td className="th-table__nav">{formatCurrency(row.nav)}</td>
              <td className="th-table__perplaa">{formatPerPlaa(row.navPerPlaa)}</td>
              <td>{formatCurrency(row.treasuries)}</td>
              <td>{assetCell(row.btc)}</td>
              <td>{assetCell(row.eth)}</td>
              <td>{assetCell(row.fil)}</td>
              <td>{assetCell(row.plvh)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Donut({
  slices,
  centerValue,
  centerLabel,
  valueSize = 38,
}: {
  slices: DonutSlice[];
  centerValue: string;
  centerLabel: string;
  valueSize?: number;
}) {
  return (
    <div className="th-donut">
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie
            data={slices}
            dataKey="value"
            nameKey="name"
            innerRadius={95}
            outerRadius={140}
            paddingAngle={2}
            stroke="none"
            startAngle={90}
            endAngle={-270}
            isAnimationActive={false}
          >
            {slices.map((slice) => (
              <Cell key={slice.name} fill={slice.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="th-donut__center">
        <span className="th-donut__value" style={{ fontSize: valueSize }}>
          {centerValue}
        </span>
        <span className="th-donut__label">{centerLabel}</span>
      </div>
    </div>
  );
}

export default function TrustHoldings({ data }: { data: TrustHoldingsData }) {
  const [view, setView] = useState<ViewMode>('quarterly');
  const { onNavMenuClicked } = useAlignmentAssetsAnalytics();
  useScrollDepthTracking('trust-holdings');

  const navData = view === 'quarterly' ? data.quarterly : data.monthly;

  return (
    <div className="th">
      {/* Header */}
      <header className="th__header">
        <h1 className="th__title">Alignment Asset Trust &amp; Holdings</h1>
        <p className="th__subtitle">
          The information provided is for illustrative and educational purposes only and does not constitute financial,
          investment, or legal advice. NAV figures are approximations based on internal methodology and are subject to
          change. Read our Disclaimers &amp; Methodology section below for details.
        </p>
      </header>

      {/* Trust NAV Over Time */}
      <section className="th-card">
        <div className="th-nav-summary">
          <span className="th-nav-summary__label">PLAA / NAV</span>
          <span className="th-nav-summary__value">{data.navPerPlaaHeadline}</span>
          <span className="th-nav-summary__caption">Est. Net Asset Value per PLAA as of June 30, 2026</span>
        </div>

        <p className="th-card__eyebrow">Est. AS OF JUNE 1ST, 2026</p>
        <p className="th-card__lead">
          Trust Total Net Asset Value{' '}
          <span className="th-card__note">
            **PLVH portfolio holdings were added in Q2 2026, crypto assets were added in Q4 2025.
          </span>
        </p>

        {/* Controls */}
        <div className="th-controls">
          <div className="th-toggle" role="tablist" aria-label="NAV view">
            <button
              role="tab"
              aria-selected={view === 'quarterly'}
              className={`th-toggle__btn ${view === 'quarterly' ? 'th-toggle__btn--active' : ''}`}
              onClick={() => setView('quarterly')}
            >
              Quarterly
            </button>
            <button
              role="tab"
              aria-selected={view === 'monthly'}
              className={`th-toggle__btn ${view === 'monthly' ? 'th-toggle__btn--active' : ''}`}
              onClick={() => setView('monthly')}
            >
              Monthly
            </button>
          </div>

          <ul className="th-key">
            {KEY_ITEMS.map((item) => (
              <li key={item.label} className="th-key__item">
                <span
                  className={`th-key__marker ${item.line ? 'th-key__marker--line' : ''}`}
                  style={{ backgroundColor: item.color }}
                />
                {item.label}
              </li>
            ))}
          </ul>
        </div>

        {view === 'quarterly' ? <NavChart data={navData} /> : <NavTable data={navData} />}

        {/* Buyback information */}
        <p className="th-section-eyebrow">BUYBACK INFORMATION</p>
        <div className="th-metrics">
          {data.buybackMetrics.map((metric) => (
            <div key={metric.label} className="th-metric">
              <span className="th-metric__label">{metric.label}</span>
              <span className="th-metric__value">{metric.value}</span>
            </div>
          ))}
        </div>

        <a
          className="th-link"
          href="https://broken-teal-e30.notion.site/Buyback-Auction-Results-372bae1511cc80d5ad6ad4c2758bb4a5"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            onNavMenuClicked(
              'View past buyback results',
              'https://broken-teal-e30.notion.site/Buyback-Auction-Results-372bae1511cc80d5ad6ad4c2758bb4a5'
            )
          }
        >
          View past buyback results →
        </a>
      </section>

      {/* CTA */}
      <section className="th-cta">
        <div className="th-cta__text">
          <h2 className="th-cta__title">Interested in collecting Alignment Asset?</h2>
          <p className="th-cta__subtitle">Complete activities to support the network &amp; increase your PLAA holdings</p>
        </div>
        <a
          className="th-cta__button"
          href="/alignment-asset/activities"
          onClick={() => onNavMenuClicked('Explore Ways To Participate', '/alignment-asset/activities')}
        >
          Explore Ways To Participate
        </a>
      </section>

      {/* PLVH Portfolio Summary */}
      <section className="th-card th-card--padded">
        <h2 className="th-heading">PLAA Venture Portfolio Summary</h2>
        <p className="th-heading__sub">
          An aggregate view of the Protocol Labs portfolio companies held by the PLAA Trust through the PLVH SPV, added in
          Q2 2026.
        </p>

        <div className="th-split">
          <Donut slices={data.focusAreas} centerValue={String(data.portfolioCompanies)} centerLabel="PORTFOLIO COMPANIES" />

          <div className="th-legend">
            <p className="th-section-eyebrow">FOCUS AREA BREAKDOWN</p>
            <p className="th-legend__sub">Share of PLVH exposure by category · 6 categories · as of Jun 30, 2026</p>
            <ul className="th-legend__list">
              {data.focusAreas.map((slice) => (
                <li key={slice.name} className="th-legend__row">
                  <span className="th-legend__dot" style={{ backgroundColor: slice.color }} />
                  <span className="th-legend__name">{slice.name}</span>
                  <span className="th-legend__pct">{slice.value}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Current Trust Composition */}
      <section className="th-card th-card--padded">
        <h2 className="th-heading">Current Trust Composition</h2>
        <p className="th-heading__sub">
          Composition of all trust assets as a share of net asset value · as of June 30th, 2026.
        </p>

        <div className="th-split">
          <Donut slices={data.trustComposition} centerValue={data.trustTotalValue} centerLabel="TOTAL TRUST VALUE" valueSize={30} />

          <div className="th-legend">
            <ul className="th-legend__list th-legend__list--detailed">
              {data.trustComposition.map((slice) => (
                <li key={slice.name} className="th-legend__row th-legend__row--detailed">
                  <span className="th-legend__dot" style={{ backgroundColor: slice.color }} />
                  <span className="th-legend__nc">
                    <span className="th-legend__name">{slice.name}</span>
                    <span className="th-legend__desc">{slice.description}</span>
                  </span>
                  <span className="th-legend__amount">{slice.amount}</span>
                  <span className="th-legend__pct">{slice.value}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Disclaimers & Methodology */}
      <section className="th-card th-card--padded">
        <h2 className="th-heading">Disclaimers &amp; Methodology</h2>
        <ul className="th-disclaimers">
          {data.disclaimers.map((item, index) => (
            <li key={index} className="th-disclaimers__item">
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* PLAA definition callout */}
      <aside className="th-note" role="note">
        <span className="th-note__icon" aria-hidden="true">i</span>
        <p className="th-note__text">
          PLAA refers to both PLAA1 tokens and off-chain, contractual rights to those tokens. Both are redeemable when
          you participate in a periodic reverse auction buyback. Buybacks provide PLAA holders with exposure to Protocol
          Labs Network&rsquo;s portfolio of frontier technology investments, as well as cryptocurrencies and other
          digital assets. Whether you hold PLAA1 tokens or contractual rights, the experience is the same, so we just
          call it PLAA.
        </p>
      </aside>

      <style jsx global>{`
        .th {
          display: flex;
          flex-direction: column;
          gap: 24px;
          width: 100%;
          color: #475569;
          font-family: 'Inter', sans-serif;
        }

        .th__header {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .th__title {
          margin: 0;
          font-size: 32px;
          font-weight: 700;
          line-height: 45px;
          color: #0f172a;
        }

        .th__subtitle {
          margin: 0;
          max-width: 1034px;
          font-size: 16px;
          line-height: 22px;
          color: #475569;
        }

        /* Cards */
        .th-card {
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          background-color: #ffffff;
          padding: 40px;
        }

        .th-card--padded {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        /* NAV summary */
        .th-nav-summary {
          display: flex;
          flex-direction: column;
          gap: 14px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px 20px;
          background-color: #ffffff;
          margin-bottom: 24px;
        }

        .th-nav-summary__label {
          font-size: 12px;
          font-weight: 600;
          line-height: 17px;
          letter-spacing: 0.6px;
          color: #156ff7;
        }

        .th-nav-summary__value {
          font-size: 42px;
          font-weight: 700;
          line-height: 59px;
          color: #0f172a;
        }

        .th-nav-summary__caption {
          font-size: 16px;
          font-weight: 500;
          line-height: 22px;
          color: #94a3b8;
        }

        .th-card__eyebrow {
          margin: 0 0 20px;
          font-size: 11px;
          font-weight: 500;
          line-height: 15px;
          color: #94a3b8;
        }

        .th-card__lead {
          margin: 0 0 24px;
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
        }

        .th-card__note {
          display: block;
          margin-top: 4px;
          font-weight: 400;
          color: #94a3b8;
        }


        /* Controls */
        .th-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .th-toggle {
          display: inline-flex;
          gap: 4px;
          padding: 4px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background-color: #f1f5f9;
        }

        .th-toggle__btn {
          padding: 7px 18px;
          border: none;
          border-radius: 8px;
          background-color: transparent;
          font-size: 13px;
          font-weight: 500;
          color: #64748b;
          cursor: pointer;
          transition: background-color 0.15s ease, color 0.15s ease;
        }

        .th-toggle__btn--active {
          background-color: #ffffff;
          color: #0f172a;
          font-weight: 600;
          box-shadow: 0px 1px 2px 0px rgba(15, 23, 42, 0.08);
        }

        .th-key {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .th-key__item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 500;
          color: #475569;
        }

        .th-key__marker {
          width: 12px;
          height: 12px;
          border-radius: 4px;
        }

        .th-key__marker--line {
          width: 18px;
          height: 3px;
          border-radius: 2px;
        }

        .th-chart {
          width: 100%;
          margin-top: 8px;
          margin-bottom: 32px;
        }

        /* Table */
        .th-table-wrapper {
          width: 100%;
          overflow-x: auto;
          margin-top: 8px;
          margin-bottom: 32px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
        }

        .th-table {
          width: 100%;
          min-width: 1000px;
          border-collapse: collapse;
          font-size: 13.5px;
        }

        .th-table th {
          text-align: left;
          padding: 14px 16px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: #94a3b8;
          background-color: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }

        .th-table td {
          padding: 16px;
          border-bottom: 1px solid #f1f5f9;
          color: #475569;
        }

        .th-table tbody tr:last-child td {
          border-bottom: none;
        }

        .th-table td.th-table__date {
          font-weight: 500;
          color: #0f172a;
        }

        .th-table td.th-table__nav {
          font-weight: 700;
          color: #0f172a;
        }

        .th-table td.th-table__perplaa {
          font-weight: 500;
          color: #475569;
        }

        .th-table__dash {
          color: #cbd5e1;
        }

        /* Metrics */
        .th-section-eyebrow {
          margin: 0 0 16px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: #156ff7;
        }

        .th-metrics {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 20px;
        }

        .th-metric {
          flex: 1 1 200px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          background-color: #ffffff;
        }

        .th-metric__label {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: #64748b;
        }

        .th-metric__value {
          font-size: 24px;
          font-weight: 700;
          color: #0f172a;
        }

        .th-link {
          display: inline-block;
          font-size: 14px;
          font-weight: 600;
          color: #156ff7;
          text-decoration: none;
        }

        .th-link:hover {
          text-decoration: underline;
        }

        /* CTA */
        .th-cta {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          align-items: center;
          justify-content: space-between;
          border: 1px solid #dbeafe;
          border-radius: 12px;
          padding: 26px 40px;
          background-color: #eef4ff;
        }

        .th-cta__text {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .th-cta__title {
          margin: 0;
          font-size: 22px;
          font-weight: 700;
          color: #0f172a;
        }

        .th-cta__subtitle {
          margin: 0;
          font-size: 15px;
          color: #475569;
        }

        .th-cta__button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 13px 24px;
          border-radius: 8px;
          background-color: #156ff7;
          color: #ffffff;
          font-size: 15px;
          font-weight: 600;
          text-decoration: none;
          box-shadow: 0px 1px 1px 0px rgba(15, 23, 42, 0.08);
          white-space: nowrap;
        }

        .th-cta__button:hover {
          background-color: #1260d9;
        }

        /* Section headings */
        .th-heading {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          color: #0f172a;
        }

        .th-heading__sub {
          margin: 0 0 16px;
          font-size: 15px;
          line-height: 21px;
          color: #475569;
        }

        /* Donut + legend split */
        .th-split {
          display: flex;
          flex-wrap: wrap;
          gap: 48px;
          align-items: center;
          margin-top: 8px;
        }

        .th-donut {
          position: relative;
          width: 320px;
          height: 320px;
          flex-shrink: 0;
        }

        /* Donuts are decorative — disable hover/click interaction. */
        .th-donut .recharts-wrapper,
        .th-donut svg {
          pointer-events: none;
        }

        .th-donut__center {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          pointer-events: none;
        }

        .th-donut__value {
          font-size: 38px;
          font-weight: 700;
          color: #0f172a;
        }

        .th-donut__label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.04em;
          color: #94a3b8;
        }

        .th-legend {
          flex: 1 1 360px;
          min-width: 280px;
        }

        .th-legend__sub {
          margin: 0 0 16px;
          font-size: 13px;
          color: #94a3b8;
        }

        .th-legend__list {
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .th-legend__row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid #f1f5f9;
          font-size: 15px;
          color: #0f172a;
        }

        .th-legend__list--detailed .th-legend__row:first-child {
          padding-top: 0;
        }

        .th-legend__row:last-child {
          border-bottom: none;
        }

        .th-legend__dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .th-legend__name {
          flex: 1;
          font-weight: 600;
          color: #0f172a;
        }

        .th-legend__row--detailed {
          align-items: flex-start;
          gap: 14px;
        }

        .th-legend__row--detailed .th-legend__dot {
          margin-top: 5px;
        }

        .th-legend__nc {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .th-legend__desc {
          font-size: 12.5px;
          font-weight: 400;
          color: #94a3b8;
        }

        .th-legend__amount {
          font-size: 15px;
          font-weight: 600;
          color: #0f172a;
        }

        .th-legend__pct {
          min-width: 48px;
          text-align: right;
          font-size: 16px;
          font-weight: 700;
          color: #64748b;
        }

        /* Disclaimers */
        .th-disclaimers {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin: 8px 0 0;
          padding-left: 18px;
        }

        .th-disclaimers__item {
          font-size: 14px;
          line-height: 20px;
          color: #475569;
        }

        .th-disclaimers__item::marker {
          color: #cbd5e1;
        }

        /* PLAA definition callout — subtle blue→green gradient border + fill */
        .th-note {
          display: flex;
          gap: 16px;
          align-items: flex-start;
          border: 1px solid transparent;
          border-radius: 16px;
          padding: 20px 28px;
          background: linear-gradient(90deg, #f4f8ff, #f3fbf7) padding-box,
            linear-gradient(90deg, #156ff7, #30c593) border-box;
        }

        .th-note__icon {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          margin-top: 1px;
          border-radius: 50%;
          background-color: #475569;
          color: #ffffff;
          font-size: 13px;
          font-weight: 700;
          font-style: normal;
        }

        .th-note__text {
          margin: 0;
          font-size: 15px;
          font-style: italic;
          line-height: 24px;
          color: #475569;
        }

        @media (max-width: 768px) {
          .th-card {
            padding: 24px 20px;
          }

          .th__title {
            font-size: 26px;
          }

          .th-cta {
            padding: 24px 20px;
          }

          .th-split {
            gap: 24px;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
