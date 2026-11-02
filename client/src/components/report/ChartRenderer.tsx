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
  ScatterChart,
  Scatter,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { ChartCandidate } from '../../types';
import { Database, HelpCircle, Lightbulb, TrendingUp } from 'lucide-react';

interface ChartRendererProps {
  chart: ChartCandidate;
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
          <p className="font-semibold text-earth-deep mb-1">{label || payload[0].payload?.label || 'Value'}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} className="font-bold" style={{ color: entry.color || '#B5651D' }}>
              {entry.name || 'Value'}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
              {chart.units && chart.units !== '$' ? ` ${chart.units}` : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const animationProps = isPrintMode ? { isAnimationActive: false } : {};

  // Render Matrix or Process diagram if non-tabular chart type
  if (chart.type === 'matrix') {
    return (
      <div className="w-full bg-earth-surface border border-earth-sand rounded-2xl p-5 my-4 shadow-warm" aria-label={chart.title}>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-serif text-base font-bold text-earth-deep">{chart.title}</h4>
          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-earth-bg text-earth-muted border border-earth-sand">2x2 Matrix</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
          {chart.data.map((item: any, idx: number) => (
            <div key={idx} className="p-3.5 rounded-xl bg-earth-bg border border-earth-sand flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-earth-deep">{item.label}</span>
                <div className="text-[11px] text-earth-muted mt-1">Risk: {item.risk} | Impact: {item.impact}</div>
              </div>
              <span className={`self-start mt-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                item.quadrant.includes('Immediately') ? 'bg-earth-clay/15 text-earth-clay' : 'bg-earth-sand text-earth-deep'
              }`}>
                {item.quadrant}
              </span>
            </div>
          ))}
        </div>
        <div className="pt-3 border-t border-earth-sand/60 text-xs space-y-1">
          <p className="text-earth-deep"><strong className="text-earth-primary">What this shows:</strong> {chart.whatItShows}</p>
          <p className="text-earth-olive font-medium"><strong className="text-earth-deep">So what:</strong> {chart.soWhat}</p>
        </div>
      </div>
    );
  }

  if (chart.type === 'process') {
    return (
      <div className="w-full bg-earth-surface border border-earth-sand rounded-2xl p-5 my-4 shadow-warm" aria-label={chart.title}>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-serif text-base font-bold text-earth-deep">{chart.title}</h4>
          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-earth-bg text-earth-muted border border-earth-sand">Process Flow</span>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 my-4 overflow-x-auto pb-2">
          {chart.data.map((step: any, idx: number) => (
            <div key={idx} className="flex-1 min-w-[120px] p-3 rounded-xl bg-earth-bg border border-earth-sand flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-earth-terracotta">Step {step.step} • {step.days}</span>
                <p className="text-xs font-semibold text-earth-deep mt-0.5">{step.name}</p>
              </div>
              <span className={`text-[10px] font-semibold mt-2 ${step.status.includes('Bottleneck') ? 'text-earth-clay' : 'text-earth-olive'}`}>
                {step.status}
              </span>
            </div>
          ))}
        </div>
        <div className="pt-3 border-t border-earth-sand/60 text-xs space-y-1">
          <p className="text-earth-deep"><strong className="text-earth-primary">What this shows:</strong> {chart.whatItShows}</p>
          <p className="text-earth-olive font-medium"><strong className="text-earth-deep">So what:</strong> {chart.soWhat}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full bg-earth-surface border border-earth-sand rounded-2xl p-5 my-4 shadow-warm flex flex-col justify-between print-avoid-break"
      aria-label={`Chart: ${chart.title}`}
    >
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h4 className="font-serif text-base font-bold text-earth-deep tracking-tight">
              {chart.title}
            </h4>
            <div className="flex items-center gap-1.5 text-[11px] text-earth-muted mt-0.5">
              <Database className="w-3 h-3 text-earth-primary shrink-0" />
              <span>{chart.sourceTag}</span>
            </div>
          </div>
          <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-md bg-earth-bg text-earth-muted border border-earth-sand shrink-0">
            {chart.type.replace('_', ' ')}
          </span>
        </div>

        {/* Visual Canvas */}
        <div className="w-full h-64 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            {chart.type === 'horizontal_bar' ? (
              <BarChart
                layout="vertical"
                data={chart.data}
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E3D5C0" opacity={0.6} horizontal={false} />
                <XAxis type="number" tick={{ fill: '#7D6B5D', fontSize: 10 }} stroke="#E3D5C0" />
                <YAxis dataKey="label" type="category" tick={{ fill: '#3E2C20', fontSize: 10 }} stroke="#E3D5C0" width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="#6B4F3A" radius={[0, 4, 4, 0]} {...animationProps}>
                  {chart.data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={EARTH_COLORS[index % EARTH_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            ) : chart.type === 'donut' ? (
              <PieChart>
                <Tooltip content={<CustomTooltip />} />
                <Pie
                  data={chart.data}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  label={({ label, percent }) => `${label} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#7D6B5D', strokeWidth: 1 }}
                  {...animationProps}
                >
                  {chart.data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={EARTH_COLORS[index % EARTH_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            ) : chart.type === 'pareto' ? (
              <ComposedChart data={chart.data} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E3D5C0" opacity={0.6} />
                <XAxis dataKey="label" tick={{ fill: '#7D6B5D', fontSize: 10 }} stroke="#E3D5C0" />
                <YAxis yAxisId="left" tick={{ fill: '#7D6B5D', fontSize: 10 }} stroke="#E3D5C0" />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} unit="%" tick={{ fill: '#7D6B5D', fontSize: 10 }} stroke="#E3D5C0" />
                <Tooltip content={<CustomTooltip />} />
                <Bar yAxisId="left" dataKey="value" fill="#6B4F3A" radius={[4, 4, 0, 0]} {...animationProps} />
                <Line yAxisId="right" type="monotone" dataKey="cumulativePercent" stroke="#B5651D" strokeWidth={2.5} dot={{ r: 3 }} {...animationProps} />
              </ComposedChart>
            ) : chart.type === 'scatter' ? (
              <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E3D5C0" opacity={0.6} />
                <XAxis type="number" dataKey="x" name={chart.axisLabels?.x || 'X'} tick={{ fill: '#7D6B5D', fontSize: 10 }} stroke="#E3D5C0" />
                <YAxis type="number" dataKey="y" name={chart.axisLabels?.y || 'Y'} tick={{ fill: '#7D6B5D', fontSize: 10 }} stroke="#E3D5C0" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                <Scatter name="Data Points" data={chart.data} fill="#B5651D" {...animationProps} />
              </ScatterChart>
            ) : chart.type === 'histogram' ? (
              <BarChart data={chart.data} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E3D5C0" opacity={0.6} />
                <XAxis dataKey="label" tick={{ fill: '#7D6B5D', fontSize: 9 }} stroke="#E3D5C0" />
                <YAxis tick={{ fill: '#7D6B5D', fontSize: 10 }} stroke="#E3D5C0" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#6B4F3A" radius={[4, 4, 0, 0]} {...animationProps}>
                  {chart.data.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.isOutlier ? '#A8452F' : '#6B4F3A'} />
                  ))}
                </Bar>
              </BarChart>
            ) : chart.type === 'waterfall' ? (
              <BarChart data={chart.data} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E3D5C0" opacity={0.6} />
                <XAxis dataKey="label" tick={{ fill: '#7D6B5D', fontSize: 10 }} stroke="#E3D5C0" />
                <YAxis tick={{ fill: '#7D6B5D', fontSize: 10 }} stroke="#E3D5C0" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="change" radius={[4, 4, 0, 0]} {...animationProps}>
                  {chart.data.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.direction === 'increase' ? '#7A8450' : '#A8452F'} />
                  ))}
                </Bar>
              </BarChart>
            ) : chart.type === 'area' ? (
              <AreaChart data={chart.data} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <defs>
                  <linearGradient id={`areaGrad_${chart.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#B5651D" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#B5651D" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E3D5C0" opacity={0.6} />
                <XAxis dataKey="label" tick={{ fill: '#7D6B5D', fontSize: 10 }} stroke="#E3D5C0" />
                <YAxis tick={{ fill: '#7D6B5D', fontSize: 10 }} stroke="#E3D5C0" />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="value" stroke="#B5651D" strokeWidth={2.5} fillOpacity={1} fill={`url(#areaGrad_${chart.id})`} {...animationProps} />
              </AreaChart>
            ) : (
              // Line Chart (Default)
              <LineChart data={chart.data} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E3D5C0" opacity={0.6} />
                <XAxis dataKey="label" tick={{ fill: '#7D6B5D', fontSize: 10 }} stroke="#E3D5C0" />
                <YAxis tick={{ fill: '#7D6B5D', fontSize: 10 }} stroke="#E3D5C0" />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#B5651D"
                  strokeWidth={2.5}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    if (payload.isPeak) {
                      return <circle key={cx} cx={cx} cy={cy} r={5} fill="#7A8450" stroke="#fff" strokeWidth={2} />;
                    }
                    if (payload.isTrough) {
                      return <circle key={cx} cx={cx} cy={cy} r={5} fill="#A8452F" stroke="#fff" strokeWidth={2} />;
                    }
                    return <circle key={cx} cx={cx} cy={cy} r={3} fill="#6B4F3A" />;
                  }}
                  {...animationProps}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Captions: What this shows + So what */}
      <div className="mt-3 pt-3 border-t border-earth-sand/60 text-xs space-y-1">
        <p className="text-earth-deep leading-relaxed">
          <strong className="text-earth-primary">What this shows: </strong>
          {chart.whatItShows}
        </p>
        <p className="text-earth-olive font-medium leading-relaxed">
          <strong className="text-earth-deep">So what: </strong>
          {chart.soWhat}
        </p>
      </div>
    </div>
  );
};
