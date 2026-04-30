'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { ChartSectionData } from '../types';

interface ChartSectionProps {
  data: ChartSectionData;
}


function computeNiceMaxAndTicks(rawMax: number, tickCount = 5): { niceMax: number; ticks: number[] } {
  if (rawMax <= 0) {
    return { niceMax: 1000, ticks: [0, 200, 400, 600, 800, 1000] };
  }

  const roughStep = rawMax / tickCount;
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const residual = roughStep / magnitude;

  let niceStep: number;
  if (residual <= 1.5) niceStep = 1 * magnitude;
  else if (residual <= 3) niceStep = 2 * magnitude;
  else if (residual <= 7) niceStep = 5 * magnitude;
  else niceStep = 10 * magnitude;

  const niceMax = Math.ceil(rawMax / niceStep) * niceStep;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => Math.round((niceMax / tickCount) * i));

  return { niceMax, ticks };
}

/**
 * ChartSection - Displays bar chart of points collected per KPI pillar
 * @param data - Chart section data from master JSON
 */
export default function ChartSection({ data }: ChartSectionProps) {
  const { niceMax, ticks } = useMemo(() => {
    const highestValue = Math.max(...data.chartData.map((entry) => entry.value));
    return computeNiceMaxAndTicks(highestValue);
  }, [data.chartData]);
  return (
    <>
      <section className="chart-section">
        <div className="chart-section__container">
          {/* Header */}
          <div className="chart-section__header">
            <h2 className="chart-section__title">{data.title}</h2>
            <p className="chart-section__subtitle">{data.subtitle}</p>
          </div>

          {/* Chart */}
          <div className="chart-section__chart-wrapper">
            <div className="chart-section__chart">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={data.chartData}
                  margin={{ top: 40, right: 20, left: 20, bottom: 20 }}
                  barCategoryGap="20%"
                >
                  <CartesianGrid 
                    strokeDasharray="0" 
                    stroke="#cbd5e1" 
                    vertical={false}
                  />
                  <XAxis 
                    dataKey="name" 
                    axisLine={{ stroke: '#64748b' }}
                    tickLine={false}
                    tick={{ 
                      fill: '#475569', 
                      fontSize: 12, 
                      fontWeight: 600
                    }}
                    dy={10}
                  />
                  <YAxis 
                    domain={[0, niceMax]}
                    ticks={ticks}
                    axisLine={false}
                    tickLine={false}
                    tick={{ 
                      fill: '#475569', 
                      fontSize: 12, 
                      fontWeight: 600
                    }}
                    width={60}
                    tickFormatter={(value) => value.toLocaleString()}
                  />
                  <Bar 
                    dataKey="value" 
                    radius={[8, 8, 0, 0]}
                    barSize={40}
                  >
                    {data.chartData.map((entry, index) => (
                      <Cell key={`cell-${entry.name}-${entry.value}`} fill="#93c5fd" />
                    ))}
                    <LabelList 
                      dataKey="value" 
                      position="top"
                      formatter={(value: number) => value.toLocaleString()}
                      style={{
                        fill: '#475569',
                        fontSize: 12,
                        fontWeight: 600
                      }}
                      offset={10}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .chart-section {
          width: 100%;
        }

        .chart-section__container {
          background-color: white;
          border: 1px solid #cbd5e1;
          border-radius: 16px;
          padding: 24px 32px 32px 32px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .chart-section__header {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .chart-section__title {
          font-size: 18px;
          font-weight: 600;
          line-height: normal;
          color: #16161f;
          margin: 0;
        }

        .chart-section__subtitle {
          font-size: 14px;
          font-weight: 300;
          font-style: italic;
          line-height: normal;
          color: #475569;
          margin: 0;
        }

        .chart-section__chart-wrapper {
          width: 100%;
          overflow-x: auto;
          overflow-y: hidden;
        }

        .chart-section__chart {
          min-width: 800px;
          width: 100%;
        }

        @media (max-width: 768px) {
          .chart-section__container {
            padding: 16px;
          }

          .chart-section__title {
            font-size: 16px;
          }
        }
      `}</style>
    </>
  );
}
