'use client';

import { Fragment, useId, useState } from 'react';
import Image from 'next/image';
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
import { BuybackMetric, DonutSlice, NavPoint, TrustHoldingsData } from '@/services/plaa/trust-holdings.service';
import NavSummaryCard from '../nav-summary-card/nav-summary-card';
import { BuybackSimulationSectionData } from '../rounds/types/current-round.types';
import { MONTHLY_WINDOW, takeRecentMonths } from './nav-window';
import MonthlyActivity from './monthly-activity';
import { MONTHLY_RECONCILIATION } from './reconciliation/monthly-reconciliation';

// This component renders whatever it's handed — it doesn't know which
// rounds ran an auction.
export interface TrustBuyback {
  roundNumber: number;
  monthYear: string;
  auctionNumber: number | null;
  section: BuybackSimulationSectionData;
}

type ViewMode = 'monthly-graph' | 'table';

const VIEW_OPTIONS: { id: ViewMode; label: string }[] = [
  { id: 'monthly-graph', label: 'Chart View' },
  { id: 'table', label: 'Table View' },
];

const SERIES_COLORS = {
  plvh: '#30c593',
  digital: '#0090ff',
  treasuries: '#64748b',
  nav: '#1e3a8a',
  issuance: '#dc2626',
};

// Maroon, outside the series palette — reads against every bar and the green total.
const BUYBACK_COLOR = '#800000';

// Single source for the chart's margin — used by the ComposedChart itself
// and by perPlaaPixelY below, so the two can never drift apart.
const CHART_MARGIN = { top: 48, right: 16, left: 16, bottom: 8 };
const AXIS_TEXT_STYLE = { fontFamily: 'inherit', fontSize: 12, fontWeight: 500, fill: '#64748b' };
const NAV_LINE_WIDTH = 2;

const digitalTotal = (p: { btc: number; eth: number; fil: number }) => p.btc + p.eth + p.fil;

const KEY_ITEMS = [
  { label: 'PLVH', color: SERIES_COLORS.plvh, line: false, dashed: false },
  { label: 'Digital assets', color: SERIES_COLORS.digital, line: false, dashed: false },
  { label: 'US Treasuries', color: SERIES_COLORS.treasuries, line: false, dashed: false },
  { label: 'NAV / PLAA', color: SERIES_COLORS.nav, line: true, dashed: false },
  { label: 'Buyback clearing price', color: BUYBACK_COLOR, line: true, dashed: true },
  { label: 'PLAA issuance', color: SERIES_COLORS.issuance, line: true, dashed: false, monthlyOnly: true },
];

const keyMarkerStyle = (item: { color: string; dashed: boolean }) =>
  item.dashed
    ? { backgroundImage: `repeating-linear-gradient(to right, ${item.color} 0 4px, transparent 4px 8px)` }
    : { backgroundColor: item.color };

const formatCurrency = (value: number) => {
  if (!value) return '—';
  const fractionDigits = Number.isInteger(value) ? 0 : 2;
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: fractionDigits, maximumFractionDigits: 2 })}`;
};
const formatAsset = (value: number) => (value ? `$${Math.round(value).toLocaleString('en-US')}` : '—');
const formatPerPlaa = (value: number) => `$${value.toFixed(2)}`;
const formatMillions = (value: number) => `$${(value / 1_000_000).toFixed(2)}M`;
const formatCount = (value: number) => value.toLocaleString('en-US');

const renderIssuanceDot = ({ cx, cy, payload, index }: { cx?: number; cy?: number; payload?: NavPoint; index?: number }) => (
  <circle key={`issuance-${index}`} cx={cx} cy={cy} r={3} fill={SERIES_COLORS.issuance} strokeWidth={0}>
    <title>{payload ? `${payload.label}: ${formatCount(payload.totalPlaa)} PLAA in circulation` : ''}</title>
  </circle>
);

// Pill centers sit on the line's points (Figma design).
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

// Approximates the label's text footprint, no live DOM measurement.
const TOTAL_LABEL_CLEARANCE = 6;
const TOTAL_LABEL_ASCENT = 13;
const TOTAL_LABEL_DESCENT = 4;
const MIN_TOTAL_LABEL_Y = CHART_MARGIN.top / 2; // stays clear of the chart's top edge

// Synthesized by NavChart's chartData map, not part of the NavPoint API shape.
type ChartRow = NavPoint & { buyback: number | null };

// Half-height of the thin band a bar-total label must clear around the
// buyback track where it's just a dashed stroke, not a chip.
const INTERPOLATED_LINE_HALF_BAND = 4;

// The buyback dashed track interpolates across gaps via connectNulls,
// straight-line by category position, not by date — mirrored here so the
// collision math matches what's actually drawn.
function interpolatedBuybackY(rows: ChartRow[], index: number): number | null {
  if (rows[index]?.buyback != null) return null; // real chip already covers this index
  let before = -1;
  for (let i = index - 1; i >= 0; i--) {
    if (rows[i]?.buyback != null) { before = i; break; }
  }
  let after = -1;
  for (let i = index + 1; i < rows.length; i++) {
    if (rows[i]?.buyback != null) { after = i; break; }
  }
  if (before === -1 || after === -1) return null;
  const t = (index - before) / (after - before);
  return rows[before].buyback! + (rows[after].buyback! - rows[before].buyback!) * t;
}

// The final (PLVH) bar's total is highlighted in green, offset above its
// bar unless that collides with the NAV/PLAA pill or buyback chip at the
// same index — the label moves to clear it, since it's the only one of
// the three not anchored to a real plotted value.
const renderTotalLabel = (rows: NavPoint[]) => (props: any) => {
  const { x, y, width, value, index } = props;
  if (!value) return null;
  const row = rows[index] as ChartRow | undefined;
  const highlight = row && row.plvh > 0;
  const defaultBaseline = y - 10;

  // [top, bottom] of each price-series band this label might overlap.
  const bands: Array<[number, number]> = [];
  if (row?.navPerPlaa != null) {
    const cy = perPlaaPixelY(row.navPerPlaa);
    bands.push([cy - PILL_HEIGHT / 2, cy + PILL_HEIGHT / 2]);
  }
  if (row?.buyback != null) {
    const cy = perPlaaPixelY(row.buyback);
    bands.push([cy - BUYBACK_CHIP_HEIGHT / 2, cy + BUYBACK_CHIP_HEIGHT / 2]);
  } else {
    const interpolated = interpolatedBuybackY(rows as ChartRow[], index);
    if (interpolated != null) {
      const cy = perPlaaPixelY(interpolated);
      bands.push([cy - INTERPOLATED_LINE_HALF_BAND, cy + INTERPOLATED_LINE_HALF_BAND]);
    }
  }

  const defaultLabelTop = defaultBaseline - TOTAL_LABEL_ASCENT;
  const defaultLabelBottom = defaultBaseline + TOTAL_LABEL_DESCENT;
  const collidingTops = bands
    .filter(([bandTop, bandBottom]) => defaultLabelTop - TOTAL_LABEL_CLEARANCE < bandBottom && bandTop < defaultLabelBottom + TOTAL_LABEL_CLEARANCE)
    .map(([bandTop]) => bandTop);
  // Clearing the nearest colliding band clears every band, since the rest sit at or below it.
  const baseline = collidingTops.length
    ? Math.max(MIN_TOTAL_LABEL_Y + TOTAL_LABEL_ASCENT, Math.min(...collidingTops) - TOTAL_LABEL_CLEARANCE - TOTAL_LABEL_DESCENT)
    : defaultBaseline;

  return (
    <text
      x={x + width / 2}
      y={baseline}
      textAnchor="middle"
      fill={highlight ? SERIES_COLORS.plvh : '#475569'}
      stroke="#f8fafc"
      strokeWidth={4}
      paintOrder="stroke"
      fontSize={13}
      fontWeight={700}
    >
      {formatMillions(value)}
    </text>
  );
};

// Chip centers sit on the dotted track's points, same as the NAV pills.
const BUYBACK_CHIP_HEIGHT = 22;
const renderBuybackChip = (props: any) => {
  const { cx, cy, index, payload } = props;
  const text = payload?.buybackLabel;
  if (!text || cx == null || cy == null) return <g key={`buyback-${index}`} />;
  const width = 20 + text.length * 7;
  return (
    <g key={`buyback-${index}`} transform={`translate(${cx - width / 2}, ${cy - BUYBACK_CHIP_HEIGHT / 2})`}>
      <rect width={width} height={BUYBACK_CHIP_HEIGHT} rx={6} fill={BUYBACK_COLOR} />
      <text
        x={width / 2}
        y={BUYBACK_CHIP_HEIGHT / 2 + 4}
        textAnchor="middle"
        fill="#ffffff"
        fontSize={11.5}
        fontWeight={700}
      >
        {text}
      </text>
    </g>
  );
};

// Plot area is 334px, not 420 - 48 - 8 = 364: recharts reserves extra space
// for the XAxis band beyond CHART_MARGIN.bottom. Verified against rendered
// CartesianGrid line positions (48, 207.3, 294.65, 382).
const PER_PLAA_PLOT_HEIGHT = 334;
// Headroom above the real ~13-21 price range keeps the series in the plot's lower band.
const PER_PLAA_DOMAIN_MAX = 42;
const perPlaaPixels = (units: number) => (units / PER_PLAA_DOMAIN_MAX) * PER_PLAA_PLOT_HEIGHT;
const perPlaaUnits = (pixels: number) => (pixels / PER_PLAA_PLOT_HEIGHT) * PER_PLAA_DOMAIN_MAX;
const MARKER_CLEARANCE = (PILL_HEIGHT + BUYBACK_CHIP_HEIGHT) / 2 + 3;

// Absolute SVG y for a perPlaa value — same conversion plottedClearingPrice
// uses below, just returned as a position instead of a delta.
const perPlaaPixelY = (units: number) => CHART_MARGIN.top + PER_PLAA_PLOT_HEIGHT - perPlaaPixels(units);

// A price within MARKER_CLEARANCE of NAV/PLAA gets lifted or dropped by the
// overlap so the chip and pill don't collide; the track still meets the
// chip, and the chip still reads the true reported price.
function plottedClearingPrice(price: number, navPerPlaa: number): number {
  const overlap = Math.max(0, MARKER_CLEARANCE - perPlaaPixels(Math.abs(price - navPerPlaa)));
  if (!overlap) return price;
  return price >= navPerPlaa ? price + perPlaaUnits(overlap) : price - perPlaaUnits(overlap);
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

// Normalizes a label to a key that survives formatting drift between the
// two APIs feeding it — exact-string matching would silently drop a marker
// the day either side reformats "Jul '26" as "July 2026".
//
//   Jul 26 · Jul '26 · July 2026 → M7-2026
function periodKey(label: string): string | null {
  const text = label.trim();
  // A 4-digit year, or a 2-digit one that isn't part of a longer number.
  const year = text.match(/(\d{4})(?!\d)|(?:^|\D)(\d{2})(?!\d)/);
  if (!year) return null;
  const digits = year[1] ?? year[2];
  const fullYear = digits.length === 4 ? Number(digits) : 2000 + Number(digits);

  const name = text.match(/^([A-Za-z]{3,})/);
  if (!name) return null;
  const stem = name[1].slice(0, 3).toLowerCase();
  const monthIndex = MONTH_NAMES.findIndex((month) => month.slice(0, 3).toLowerCase() === stem);
  return monthIndex < 0 ? null : `M${monthIndex + 1}-${fullYear}`;
}

// value positions the chip; text fills it.
interface BuybackMarker {
  value: number;
  text: string;
}

// Each auction is matched to its own month. Newest auction wins when two share
// a month. A price that never settled reads 'TBD' and plots nothing.
function buybackMarkersByPeriod(buybacks: TrustBuyback[]): Record<string, BuybackMarker> {
  const markers: Record<string, BuybackMarker> = {};
  buybacks.forEach((entry) => {
    const text = entry.section.summary.items.find((item) => item.label === 'Clearing Price')?.value;
    const value = text ? Number(text.replace(/[^0-9.]/g, '')) : NaN;
    if (!text || !Number.isFinite(value)) return;
    const key = periodKey(entry.monthYear);
    if (key && !(key in markers)) markers[key] = { value, text };
  });
  return markers;
}

// Final category (latest month) highlighted in blue.
const renderAxisTick = (lastLabel: string) => (props: any) => {
  const { x, y, payload } = props;
  const isLast = payload.value === lastLabel;
  return (
    <text
      x={x}
      y={y}
      dy={16}
      textAnchor="middle"
      {...AXIS_TEXT_STYLE}
      fill={isLast ? '#0090ff' : AXIS_TEXT_STYLE.fill}
      fontWeight={isLast ? 600 : AXIS_TEXT_STYLE.fontWeight}
    >
      {payload.value}
    </text>
  );
};

function NavChart({
  data,
  markers,
  showIssuance = false,
}: {
  data: NavPoint[];
  markers: Record<string, BuybackMarker>;
  showIssuance?: boolean;
}) {
  // A period with no auction plots no point — breaks the buyback track into
  // dotted spans between auctions.
  const chartData = data.map((d) => {
    const marker = markers[periodKey(d.label) ?? ''];
    return {
      ...d,
      digital: digitalTotal(d),
      buyback: marker ? plottedClearingPrice(marker.value, d.navPerPlaa) : null,
      buybackLabel: marker?.text ?? '',
    };
  });
  // A short series gets wide bars (per design); denser series get
  // proportionally narrower bars.
  const dense = chartData.length > 8;
  const barSize = dense ? 40 : 92;
  const hasBuybacks = chartData.some((d) => d.buyback != null);
  if (!chartData.length) {
    return <p className="th-chart__empty">No data available for this view yet.</p>;
  }
  return (
    <div className={`th-chart ${dense || showIssuance ? 'th-chart--dense' : ''}`}>
      <div className="th-chart__inner">
      <ResponsiveContainer width="100%" height={420}>
        <ComposedChart data={chartData} margin={CHART_MARGIN} barCategoryGap="42%">
          <CartesianGrid strokeDasharray="0" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="label"
            axisLine={{ stroke: '#cbd5e1' }}
            tickLine={false}
            tick={renderAxisTick(chartData[chartData.length - 1]?.label)}
            interval={0}
          />
          <YAxis yAxisId="nav" hide domain={[0, (max: number) => max * 1.15]} />
          <YAxis yAxisId="perPlaa" hide domain={[0, PER_PLAA_DOMAIN_MAX]} />
          {showIssuance && (
            <YAxis
              yAxisId="issuance"
              orientation="right"
              width={110}
              domain={[0, (max: number) => Math.max(1, max)]}
              padding={{ bottom: 32 }}
              allowDecimals={false}
              tickFormatter={formatCount}
              tick={AXIS_TEXT_STYLE}
              tickLine={false}
              axisLine={false}
              label={{
                ...AXIS_TEXT_STYLE,
                value: 'PLAA in circulation',
                angle: -90,
                position: 'insideRight',
                style: { textAnchor: 'middle' },
              }}
            />
          )}
          {showIssuance && (
            <Line
              className="th-issuance-line"
              yAxisId="issuance"
              type="linear"
              dataKey="totalPlaa"
              name="PLAA issuance"
              stroke={SERIES_COLORS.issuance}
              strokeWidth={NAV_LINE_WIDTH}
              dot={renderIssuanceDot}
              activeDot={false}
              isAnimationActive={false}
            />
          )}
          <Bar yAxisId="nav" dataKey="treasuries" stackId="nav" fill={SERIES_COLORS.treasuries} barSize={barSize} />
          <Bar yAxisId="nav" dataKey="digital" stackId="nav" fill={SERIES_COLORS.digital} barSize={barSize} />
          <Bar yAxisId="nav" dataKey="plvh" stackId="nav" fill={SERIES_COLORS.plvh} barSize={barSize} radius={[4, 4, 0, 0]}>
            <LabelList dataKey="nav" content={renderTotalLabel(chartData)} />
          </Bar>
          <Line
            yAxisId="perPlaa"
            type="linear"
            dataKey="navPerPlaa"
            stroke={SERIES_COLORS.nav}
            strokeWidth={NAV_LINE_WIDTH}
            dot={{ r: 3, fill: SERIES_COLORS.nav, strokeWidth: 0 }}
            label={renderNavLabel}
            isAnimationActive={false}
          />
          {/* Auctions are months apart, so the track is dotted through the
              periods that had none rather than implying a price in between. */}
          {hasBuybacks && (
            <Line
              yAxisId="perPlaa"
              type="linear"
              dataKey="buyback"
              stroke={BUYBACK_COLOR}
              strokeWidth={1.5}
              strokeDasharray="4 5"
              connectNulls
              dot={renderBuybackChip}
              activeDot={false}
              isAnimationActive={false}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}

// Column headers come from the first entry's own summary items, not a
// literal list, so they stay in step without being named here. Round is its
// own column — "Buyback #2" and "Round 18" are separate numbering schemes.
function BuybackResultsAccordion({ buybacks }: { buybacks: TrustBuyback[] }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  // Union of every row's own labels, first-seen order — a metric on only
  // some rounds still gets a column, matched by label not position.
  const metricLabels: string[] = [];
  buybacks.forEach((entry) => {
    entry.section.summary.items.forEach((item) => {
      if (!metricLabels.includes(item.label)) metricLabels.push(item.label);
    });
  });

  return (
    <div className={`th-accordion ${open ? 'th-accordion--open' : ''}`}>
      <button
        type="button"
        className="th-accordion__trigger"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="th-accordion__heading">
          <span className="th-accordion__title">Past Buyback Key Results</span>
          <span className="th-accordion__meta">
            {buybacks.length} completed {buybacks.length === 1 ? 'auction' : 'auctions'}
          </span>
        </span>
        <Image
          src={open ? '/icons/arrow-up.svg' : '/icons/arrow-down-light.svg'}
          alt=""
          width={14}
          height={14}
          aria-hidden="true"
        />
      </button>

      <div id={panelId} className="th-accordion__panel" hidden={!open}>
        <div className="th-table-wrapper">
          <table className="th-table th-table--buyback">
            <thead>
              <tr>
                <th>AUCTION</th>
                <th>ROUND</th>
                {metricLabels.map((label) => (
                  <th key={label}>{label.toUpperCase()}</th>
                ))}
                <th>TOTAL FILLED</th>
              </tr>
            </thead>
            <tbody>
              {buybacks.map((entry) => (
                <tr key={entry.roundNumber}>
                  <td className="th-table__date th-buyback-row__auction">
                    {entry.section.summary.title.replace(/ - Key Results$/, '')}
                  </td>
                  <td className="th-buyback-row__round">
                    Round {entry.roundNumber} · {entry.monthYear}
                  </td>
                  {metricLabels.map((label) => (
                    <td key={label}>{entry.section.summary.items.find((item) => item.label === label)?.value ?? '—'}</td>
                  ))}
                  <td>{entry.section.totalFilled ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const assetCell = (value: number) =>
  value ? formatAsset(value) : <span className="th-table__dash">—</span>;

const NAV_TABLE_COLUMNS = 9;

// Each month expands into its Contributions & Expenses breakdown, one at a
// time. The panel row stays mounted so it can animate; collapsed, it has no
// height or border, so the table reads exactly as before.
function NavTable({ data }: { data: NavPoint[] }) {
  const [openDate, setOpenDate] = useState<string | null>(null);
  const tableId = useId();

  return (
    <div className="th-table-wrapper">
      <table className="th-table th-table--expandable">
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
          {data.map((row, index) => {
            const open = openDate === row.date;
            const panelId = `${tableId}-activity-${index}`;
            const toggle = () => setOpenDate(open ? null : row.date);
            return (
              <Fragment key={row.date}>
                {/* The whole row toggles; the button in the date cell is the
                    keyboard/AT control and its click bubbles up to here. */}
                <tr className={`th-nav-row ${open ? 'th-nav-row--open' : ''}`} onClick={toggle}>
                  <td className="th-table__date">
                    <button type="button" className="th-nav-row__toggle" aria-expanded={open} aria-controls={panelId}>
                      <span>{row.date}</span>
                      <Image
                        className="th-nav-row__chevron"
                        src="/icons/arrow-down-light.svg"
                        alt=""
                        width={10}
                        height={10}
                        aria-hidden="true"
                      />
                    </button>
                  </td>
                  <td>{formatCount(row.totalPlaa)}</td>
                  <td className="th-table__nav">{formatCurrency(row.nav)}</td>
                  <td className="th-table__perplaa">{formatPerPlaa(row.navPerPlaa)}</td>
                  <td>{formatCurrency(row.treasuries)}</td>
                  <td>{assetCell(row.btc)}</td>
                  <td>{assetCell(row.eth)}</td>
                  <td>{assetCell(row.fil)}</td>
                  <td>{assetCell(row.plvh)}</td>
                </tr>
                <tr className={`th-activity-row ${open ? 'th-activity-row--open' : ''}`}>
                  <td colSpan={NAV_TABLE_COLUMNS}>
                    <div id={panelId} className="th-activity-row__collapse" aria-hidden={!open}>
                      <div className="th-activity-row__inner">
                        <MonthlyActivity
                          month={row.date}
                          reconciliation={MONTHLY_RECONCILIATION[periodKey(row.date) ?? '']}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              </Fragment>
            );
          })}
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

// Last Clearing Price/Date come from the newest completed auction, not
// data.buybackMetrics — that field is entered separately and drifts behind
// the auction record. Falls back to it only when there's no completed
// auction. Next Anticipated always comes from buybackMetrics — a schedule
// decision, not an auction result.
function capstoneMetrics(data: TrustHoldingsData, buybacks: TrustBuyback[]): BuybackMetric[] {
  const latest = buybacks[0]; // completed buybacks arrive newest first
  const clearingPrice = latest?.section.summary.items.find((item) => item.label === 'Clearing Price')?.value;
  const nextAnticipated = data.buybackMetrics.find((m) => m.label === 'NEXT ANTICIPATED BUYBACK')?.value ?? '—';

  return latest && clearingPrice
    ? [
        { label: 'Last Clearing Price', value: clearingPrice },
        { label: 'Date', value: latest.monthYear },
        { label: 'Next Anticipated', value: nextAnticipated },
      ]
    : data.buybackMetrics;
}

export default function TrustHoldings({ data, buybacks = [] }: { data: TrustHoldingsData; buybacks?: TrustBuyback[] }) {
  const [view, setView] = useState<ViewMode>('monthly-graph');
  const { onNavMenuClicked } = useAlignmentAssetsAnalytics();
  useScrollDepthTracking('trust-holdings');

  // Table keeps the full series; Chart View is limited to MONTHLY_WINDOW months.
  const monthlyWindow = takeRecentMonths(data.monthly, MONTHLY_WINDOW);
  const buybackMarkers = buybackMarkersByPeriod(buybacks);
  const metrics = capstoneMetrics(data, buybacks);


  const latestMonthly = data.monthly[data.monthly.length - 1];

  return (
    <div className="th">
      {/* Header */}
      <header className="th__header">
        <h1 className="th__title">Alignment Asset Portfolio &amp; Holdings</h1>
        <p className="th__subtitle">
          The information provided is for illustrative and educational purposes only and does not constitute financial,
          investment, or legal advice. NAV figures are approximations based on internal methodology and are subject to
          change. Read our Disclaimers &amp; Methodology section below for details.
        </p>
      </header>

      {/* Trust NAV Over Time */}
      <section className="th-card th-card--nav">
        <NavSummaryCard navUsd={latestMonthly?.nav ?? null} totalUnits={latestMonthly?.totalPlaa ?? null} />

        <div className="th-card__body">
          <div className="th-nav-meta-block">
            <h2 className="th-heading th-heading--title-weight">Trust Total Net Asset Value</h2>
            <p className="th-heading__sub th-heading__sub--muted">Estimated as of {data.asOfDate}</p>
          </div>

          <p className="th-card__note th-card__note--standalone">
            **PLVH portfolio holdings were added in Q2 2026, crypto assets were added in Q4 2025.
          </p>

          {/* Controls */}
          <div className="th-controls">
            <div className="th-toggle" role="group" aria-label="NAV view">
              {VIEW_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={view === option.id}
                  className={`th-toggle__btn ${view === option.id ? 'th-toggle__btn--active' : ''}`}
                  onClick={() => setView(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <ul className="th-key">
              {KEY_ITEMS.filter((item) => !item.monthlyOnly || view === 'monthly-graph').map((item) => (
                <li key={item.label} className="th-key__item">
                  <span
                    className={`th-key__marker ${item.line ? 'th-key__marker--line' : ''}`}
                    style={keyMarkerStyle(item)}
                  />
                  {item.label}
                </li>
              ))}
            </ul>
          </div>

          {view === 'monthly-graph' && <NavChart data={monthlyWindow} markers={buybackMarkers} showIssuance />}
          {view === 'table' && <NavTable data={data.monthly} />}
        </div>
      </section>

      {/* Buybacks & Past Results */}
      <section className="th-card th-card--padded">
        <h2 className="th-heading">Buybacks &amp; Past Results</h2>
        <p className="th-heading__sub th-heading__sub--muted">Factual record of the most recent rights buyback</p>

        <div className="th-buyback-panel">
          <div className="th-metrics">
            {metrics.map((metric) => (
              <div key={metric.label} className="th-metric">
                <span className="th-metric__label">{metric.label}</span>
                <span className="th-metric__value">{metric.value}</span>
              </div>
            ))}
          </div>

          <p className="th-buyback-panel__note">
            This is the last price at which rights were bought back. It is not a guarantee or estimate of the current
            value of any right.
          </p>

        </div>

        {buybacks.length > 0 && (
          <div className="th-accordions">
            <BuybackResultsAccordion buybacks={buybacks} />
          </div>
        )}
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
            <p className="th-legend__sub">Share of PLVH exposure by category · 6 categories · as of {data.asOfDate}</p>
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
          Composition of all trust assets as a share of net asset value · as of {data.asOfDate}.
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

      {/* What is PLAA callout */}
      <section className="th-callout">
        <span className="th-callout__icon" aria-hidden="true">
          i
        </span>
        <p className="th-callout__text">
          PLAA refers to both PLAA1 tokens and off-chain, contractual rights to those tokens. Both are redeemable when you
          participate in a periodic reverse auction buyback. Buybacks provide PLAA holders with exposure to Protocol Labs
          Network&rsquo;s portfolio of frontier technology investments, as well as cryptocurrencies and other digital
          assets. Whether you hold PLAA1 tokens or contractual rights, the experience is the same, so we just call it
          PLAA.
        </p>
      </section>

      <style jsx global>{`
        .th {
          display: flex;
          flex-direction: column;
          gap: 28px;
          width: 100%;
          color: #475569;
          font-family: 'Inter', sans-serif;
        }

        .th__header {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .th__title {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
          line-height: 28px;
          color: #0f172a;
        }

        .th__subtitle {
          margin: 0;
          max-width: 1052px;
          font-size: 14px;
          line-height: 20px;
          color: #475569;
        }

        /* Cards */
        .th-card {
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          background-color: #ffffff;
          padding: 34px 40px;
        }

        /* NAV section's own padding moved onto .th-card__body — NavSummaryCard
           needs to bleed flush to this card's own top-left corner, which a
           uniform padding here would block. overflow: hidden keeps that bleed
           clipped to the card's rounded corners. */
        .th-card--nav {
          padding: 0;
          overflow: hidden;
        }

        .th-card__body {
          padding: 24px 40px 36px;
        }

        /* Padded sections space their heading/subtitle/content by ~18px (Figma). */
        .th-card--padded {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        /* Figma puts the note on its own line (U+2028 U+2028) with a blank line above it,
           and at a smaller size than the title (~13px vs 24px). */
        .th-card__note {
          display: block;
          margin-top: 12px;
          font-size: 13px;
          font-weight: 400;
          line-height: 18px;
          color: #94a3b8;
        }

        .th-card__note--standalone {
          margin: 0 0 20px;
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
          border-radius: 9px;
          background-color: #eef1f5;
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
          gap: 7px;
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

        /* Chart sits on a subtle panel band (Figma "crow": #f8fafc, 16px top pad). */
        .th-chart {
          width: 100%;
          margin-top: 8px;
          padding-top: 16px;
          background-color: #f8fafc;
        }

        .th-chart__inner {
          width: 100%;
        }

        /* Keep monthly bars, price pills, and the circulation axis legible
           on narrow screens by scrolling the graph instead of shrinking it. */
        @media (max-width: 900px) {
          .th-chart--dense {
            overflow-x: auto;
          }

          .th-chart--dense .th-chart__inner {
            min-width: 760px;
          }
        }

        .th-chart__empty {
          margin: 8px 0 0;
          padding: 48px 16px;
          background-color: #f8fafc;
          color: #64748b;
          font-size: 14px;
          text-align: center;
        }

        .th-chart__note {
          margin: 0;
          padding: 0 16px 16px;
          background-color: #f8fafc;
          font-size: 13px;
          line-height: 18px;
          color: #64748b;
        }

        /* Table */
        /* Inline-size container so the activity panel can cap itself at the
           visible width (cqw) while the table scrolls under it. */
        .th-table-wrapper {
          container-type: inline-size;
          width: 100%;
          overflow-x: auto;
          margin-top: 8px;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
        }

        .th-table {
          width: 100%;
          min-width: 938px;
          border-collapse: collapse;
          font-size: 12px;
        }

        .th-table th {
          text-align: right;
          padding: 15px 24px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: #94a3b8;
          border-bottom: 1px solid #eef1f5;
        }

        .th-table td {
          text-align: right;
          padding: 17px 24px;
          border-bottom: 1px solid #eef1f5;
          color: #475569;
        }

        /* DATE column left-aligned; all numeric columns right-aligned. */
        .th-table th:first-child,
        .th-table td:first-child {
          text-align: left;
        }

        /* Child combinators keep this off the tables nested in the
           activity panel. */
        .th-table > tbody > tr:last-child > td {
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

        /* Expandable monthly rows. Collapsed, a row looks as it always has —
           just a pointer cursor, a hover tint and a small chevron. */
        .th-nav-row {
          cursor: pointer;
        }

        .th-nav-row:hover td,
        .th-nav-row--open td {
          background-color: #f8fafc;
        }

        .th-table .th-nav-row--open td {
          border-bottom-color: transparent;
        }

        /* The last month would otherwise draw a line against the wrapper's own
           border now that the (empty) panel row is the tbody's last child. */
        .th-table--expandable tbody tr.th-nav-row:nth-last-child(2):not(.th-nav-row--open) td {
          border-bottom: none;
        }

        .th-nav-row__toggle {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 0;
          border: none;
          background: none;
          font: inherit;
          color: inherit;
          cursor: pointer;
          white-space: nowrap;
        }

        .th-nav-row__toggle:focus-visible {
          outline: 2px solid #156ff7;
          outline-offset: 4px;
          border-radius: 4px;
        }

        .th-nav-row__chevron {
          opacity: 0.55;
          transition: transform 0.2s ease, opacity 0.2s ease;
        }

        .th-nav-row:hover .th-nav-row__chevron {
          opacity: 0.9;
        }

        .th-nav-row--open .th-nav-row__chevron {
          transform: rotate(180deg);
          opacity: 0.9;
        }

        .th-table .th-activity-row td {
          padding: 0;
          border-bottom: none;
          background-color: #f8fafc;
        }

        .th-table .th-activity-row--open td {
          border-bottom: 1px solid #eef1f5;
        }

        /* Height animates via grid rows (0fr → 1fr), no measuring. Visibility
           flips after the close finishes so collapsed content isn't read out. */
        .th-activity-row__collapse {
          display: grid;
          grid-template-rows: 0fr;
          visibility: hidden;
          transition: grid-template-rows 0.22s ease, visibility 0s linear 0.22s;
        }

        .th-activity-row--open .th-activity-row__collapse {
          grid-template-rows: 1fr;
          visibility: visible;
          transition: grid-template-rows 0.22s ease;
        }

        /* clip, not hidden — hidden would make this the sticky panel's
           scroll container and it would stop pinning on horizontal scroll. */
        .th-activity-row__inner {
          min-height: 0;
          overflow: clip;
        }

        @media (prefers-reduced-motion: reduce) {
          .th-activity-row__collapse,
          .th-activity-row--open .th-activity-row__collapse,
          .th-nav-row__chevron {
            transition: none;
          }
        }

        /* NAV reconciliation + Contributions & Expenses. Sticky-left keeps it
           in view when the wide table is scrolled sideways on small screens. */
        .th-ce {
          position: sticky;
          left: 0;
          box-sizing: border-box;
          max-width: min(1040px, 100cqw);
          padding: 4px 24px 20px 42px;
        }

        .th-ce__title {
          margin: 0 0 6px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: #156ff7;
        }

        /* Stacked by default; side by side once the table area can fit both. */
        .th-ce__sections {
          display: grid;
          gap: 20px 48px;
        }

        @container (min-width: 820px) {
          .th-ce__sections {
            grid-template-columns: 1fr 1fr;
            align-items: start;
          }
        }

        .th-ce__review {
          margin: 0 0 10px;
          font-size: 12px;
          line-height: 17px;
          color: #b45309;
        }

        .th-ce__marker {
          margin-left: 2px;
          font-size: 9px;
          font-weight: 700;
          color: #b45309;
        }

        .th-ce__caption {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          clip: rect(0 0 0 0);
          white-space: nowrap;
        }

        .th-ce__table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .th-table .th-ce__table th,
        .th-table .th-ce__table td {
          padding: 9px 0;
          border-bottom: 1px solid #e2e8f0;
          background: none;
          text-align: left;
        }

        .th-table .th-ce__table thead th {
          padding: 6px 0;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: #94a3b8;
        }

        .th-table .th-ce__table thead th:last-child,
        .th-table .th-ce__table td {
          text-align: right;
        }

        .th-table .th-ce__table tbody th {
          padding-right: 16px;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: normal;
          text-transform: none;
          color: #475569;
        }

        .th-table .th-ce__table td {
          font-weight: 600;
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
        }

        .th-table .th-ce__table tbody tr:last-child th,
        .th-table .th-ce__table tbody tr:last-child td {
          border-bottom: none;
        }

        .th-table td.th-ce__amount--in {
          color: #16a34a;
        }

        .th-table td.th-ce__amount--out {
          color: #b42318;
        }

        .th-table td.th-ce__amount--none {
          font-weight: 400;
          color: #94a3b8;
        }

        /* Bridge groups: a subtotal row, its movements indented beneath. */
        .th-table .th-ce__table tr.th-ce__row--group th,
        .th-table .th-ce__table tr.th-ce__row--group td {
          padding-top: 12px;
          font-weight: 600;
          color: #0f172a;
        }

        .th-table .th-ce__table tr.th-ce__row--item th {
          padding-left: 14px;
        }

        .th-table .th-ce__table tr.th-ce__row--context td {
          padding: 6px 0 9px 14px;
          text-align: left;
          white-space: normal;
          font-size: 12px;
          font-weight: 400;
          color: #64748b;
        }

        /* Opening/closing NAV and subtotals. */
        .th-table .th-ce__table tr.th-ce__row--balance th,
        .th-table .th-ce__table tr.th-ce__row--balance td {
          font-weight: 700;
          color: #0f172a;
        }

        /* An inset shadow, not border-top — in a collapsed table the row
           above's border-bottom wins the shared edge. */
        .th-table .th-ce__table tr.th-ce__row--close th,
        .th-table .th-ce__table tr.th-ce__row--close td {
          box-shadow: inset 0 1px 0 #94a3b8;
        }

        .th-table .th-ce__table tr.th-ce__row--flag th,
        .th-table .th-ce__table tr.th-ce__row--flag td {
          color: #b45309;
        }

        .th-ce__footnotes {
          margin: 12px 0 0;
          padding-left: 16px;
          font-size: 12px;
          line-height: 17px;
          color: #64748b;
        }

        .th-ce__footnotes li::marker {
          color: #b45309;
          font-weight: 700;
        }

        .th-ce__note {
          margin: 10px 0 0;
          font-size: 12px;
          line-height: 17px;
          color: #94a3b8;
        }

        @media (max-width: 768px) {
          .th-ce {
            padding: 4px 16px 16px 24px;
          }
        }

        /* Sized to the visible table area, not the viewport — the page's own
           gutters leave far less than 100vw on a phone. */
        @container (max-width: 360px) {
          .th-ce {
            padding: 4px 12px 14px;
          }

          .th-table .th-ce__table th,
          .th-table .th-ce__table td,
          .th-table .th-ce__table tbody th {
            font-size: 12px;
          }

          .th-table .th-ce__table tbody th {
            padding-right: 8px;
          }
        }

        /* Metrics */
        .th-section-eyebrow {
          margin: 0 0 2px;
          font-size: 12px;
          font-weight: 600;
          line-height: 17px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: #0b4f66;
        }

        .th-buyback-panel {
          display: flex;
          flex-direction: column;
          gap: 18px;
          border: 1px solid #eef1f5;
          border-radius: 16px;
          padding: 24px;
          background-color: #f8fafc;
        }

        .th-buyback-panel__note {
          margin: 0;
          font-size: 13px;
          line-height: 18px;
          color: #64748b;
        }

        .th-accordions {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 24px;
        }

        .th-accordion {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          background-color: #ffffff;
          overflow: hidden;
        }

        .th-accordion--open {
          border-color: #cbd5e1;
        }

        .th-accordion__trigger {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 16px 20px;
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
        }

        .th-accordion__trigger:hover {
          background-color: #f8fafc;
        }

        .th-accordion__heading {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .th-accordion__title {
          font-size: 15px;
          font-weight: 600;
          color: #16161f;
        }

        .th-accordion__meta {
          font-size: 13px;
          color: #64748b;
        }

        .th-accordion__panel {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 0 20px 20px;
        }

        .th-accordion__panel[hidden] {
          display: none;
        }

        /* Nine columns, two of which carry unbreakable labels — the NAV
           table's 24px gutters would push Total Filled off the card and force
           a scroll on desktop, so this table runs tighter. */
        .th-table--buyback {
          min-width: 860px;
        }

        .th-table--buyback th,
        .th-table--buyback td {
          padding: 14px 12px;
        }

        /* Every column reads left-aligned here, headers and values together —
           a header sitting at the opposite edge from its own figures is worse
           than losing the numeric right-alignment. */
        .th-table--buyback th,
        .th-table--buyback td {
          text-align: left;
        }

        .th-buyback-row__auction,
        .th-buyback-row__round {
          white-space: nowrap;
        }

        .th-metrics {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
        }


        .th-metric {
          flex: 1 1 200px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          border: 1px solid #e8edf3;
          border-radius: 12px;
          padding: 20px 24px 22px;
          background-color: #ffffff;
        }

        .th-metric__label {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.4px;
          text-transform: uppercase;
          color: #0f172a;
        }

        /* Per-card label accents (the tiles render in a fixed order: price, date, next). */
        .th-metric:nth-child(1) .th-metric__label {
          color: #16a34a;
        }

        .th-metric:nth-child(2) .th-metric__label {
          color: #0b4f66;
        }

        .th-metric__value {
          font-size: 24px;
          font-weight: 700;
          color: #0f172a;
        }

        /* CTA */
        .th-cta {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          align-items: center;
          justify-content: space-between;
          border: 1px solid #d6e4ff;
          border-radius: 14px;
          padding: 26px 32px 26px 40px;
          background-color: #eef4ff;
        }

        .th-cta__text {
          display: flex;
          flex-direction: column;
          gap: 4px;
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

        /* Matches .th__title's weight/line-height (the page's own topline) instead
           of the bolder weight the other section headings on this page use. */
        .th-heading--title-weight {
          font-weight: 600;
          line-height: 28px;
        }

        .th-heading__sub {
          margin: 0;
          font-size: 15px;
          line-height: 21px;
          color: #475569;
        }

        .th-heading__sub--muted {
          color: #64748b;
        }

        .th-nav-meta-block {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin: 20px 0;
        }

        /* Donut + legend split */
        .th-split {
          display: flex;
          flex-wrap: wrap;
          gap: 48px;
          align-items: center;
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
          margin: 0 0 12px;
          font-size: 13px;
          line-height: 18px;
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
          padding: 11px 0;
          border-bottom: 1px solid #e2e8f0;
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
          min-width: 62px;
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
          margin: 0;
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

        /* What is PLAA callout — subtle blue→green gradient fill + 1px gradient border. */
        .th-callout {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          border-radius: 16px;
          padding: 28px 32px;
          border: 1px solid transparent;
          background:
            linear-gradient(to right, #f4f9ff, #f3fbf8) padding-box,
            linear-gradient(to right, #156ff7, #30c593) border-box;
        }

        .th-callout__icon {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          margin-top: 1px;
          border-radius: 50%;
          background-color: #475569;
          color: #ffffff;
          font-size: 13px;
          font-weight: 700;
          font-style: normal;
          line-height: 1;
        }

        .th-callout__text {
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
            font-size: 20px;
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
