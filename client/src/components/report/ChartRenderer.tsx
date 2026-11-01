import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { ChartData } from '../../types';

interface ChartRendererProps {
  chart: ChartData;
  isPrintMode?: boolean;
}

const EARTH_COLORS = [
  '#6B4F3A', // Primary Brown
  '#B5651D', // Terracotta
  '#7A8450', // Muted Olive
  '#A8452F', // Clay Red
  '#8D7B68', // Warm Taupe
  '#C29B38', // Amber Ochre
  '#5C715E', // Forest Sage
  '#4A3728', // Deep Roast
];

export const ChartRenderer: React.FC<ChartRendererProps> = ({ chart, isPrintMode = false }) => {
  if (!chart || !chart.data || chart.data.length === 0) return null;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-earth-surface border border-earth-sand p-2.5 rounded-xl shadow-warm text-xs font-sans">
          <p className="font-semibold text-earth-deep mb-1">{label}</p>
          <p className="text-earth-terracotta font-bold">
            {typeof payload[0].value === 'number'
              ? payload[0].value.toLocaleString()
              : payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  const animationProps = isPrintMode ? { isAnimationActive: false } : {};

  return (
    <div
      className="w-full bg-earth-surface border border-earth-sand rounded-2xl p-5 my-3 shadow-xs"
      aria-label={`Chart: ${chart.title}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-serif text-sm font-bold text-earth-deep tracking-tight">
          {chart.title}
        </h4>
        <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-md bg-earth-bg text-earth-muted border border-earth-sand">
          {chart.type}
        </span>
      </div>

      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          {chart.type === 'bar' ? (
            <BarChart data={chart.data} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E3D5C0" opacity={0.6} />
              <XAxis
                dataKey="label"
                tick={{ fill: '#7D6B5D', fontSize: 11 }}
                stroke="#E3D5C0"
                interval={0}
                angle={chart.data.length > 5 ? -25 : 0}
                textAnchor={chart.data.length > 5 ? 'end' : 'middle'}
              />
              <YAxis
                tick={{ fill: '#7D6B5D', fontSize: 11 }}
                stroke="#E3D5C0"
                tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="value"
                fill="#6B4F3A"
                radius={[6, 6, 0, 0]}
                {...animationProps}
              >
                {chart.data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={EARTH_COLORS[index % EARTH_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          ) : chart.type === 'line' ? (
            <LineChart data={chart.data} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E3D5C0" opacity={0.6} />
              <XAxis
                dataKey="label"
                tick={{ fill: '#7D6B5D', fontSize: 11 }}
                stroke="#E3D5C0"
              />
              <YAxis
                tick={{ fill: '#7D6B5D', fontSize: 11 }}
                stroke="#E3D5C0"
                tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#B5651D"
                strokeWidth={3}
                dot={{ fill: '#6B4F3A', r: 4 }}
                activeDot={{ r: 6, fill: '#3E2C20' }}
                {...animationProps}
              />
            </LineChart>
          ) : chart.type === 'area' ? (
            <AreaChart data={chart.data} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#B5651D" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#B5651D" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E3D5C0" opacity={0.6} />
              <XAxis
                dataKey="label"
                tick={{ fill: '#7D6B5D', fontSize: 11 }}
                stroke="#E3D5C0"
              />
              <YAxis
                tick={{ fill: '#7D6B5D', fontSize: 11 }}
                stroke="#E3D5C0"
                tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#B5651D"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#areaGradient)"
                {...animationProps}
              />
            </AreaChart>
          ) : (
            <PieChart>
              <Tooltip content={<CustomTooltip />} />
              <Pie
                data={chart.data}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ label, percent }) => `${label} ${(percent * 100).toFixed(0)}%`}
                labelLine={{ stroke: '#7D6B5D', strokeWidth: 1 }}
                {...animationProps}
              >
                {chart.data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={EARTH_COLORS[index % EARTH_COLORS.length]}
                  />
                ))}
              </Pie>
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

