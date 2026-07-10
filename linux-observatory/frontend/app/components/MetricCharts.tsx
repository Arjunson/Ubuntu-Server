import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { MetricHistory } from '../types';

interface MetricChartsProps {
  data: MetricHistory[];
}

export default function MetricCharts({ data }: MetricChartsProps) {
  // Format epoch timestamp into HH:MM:SS format
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Common Custom Tooltip Component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-zinc-700 bg-zinc-900/90 p-3 shadow-xl backdrop-blur-md">
          <p className="text-2xs font-medium text-zinc-500">{formatTime(label)}</p>
          <p className="mt-1 text-sm font-bold text-white">
            {payload[0].name}: <span className="text-indigo-400">{payload[0].value.toFixed(1)}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Helper to render an individual metric chart
  const renderChart = (
    title: string,
    dataKey: 'cpu' | 'memory' | 'disk',
    strokeColor: string,
    fillId: string,
    gradientColors: [string, string]
  ) => {
    return (
      <div className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="text-sm font-semibold tracking-wide text-zinc-400 uppercase">
            {title} Trend
          </h4>
          <span className="text-2xs text-zinc-500 font-mono">Live updates</span>
        </div>
        <div className="h-64 w-full">
          {data.length === 0 ? (
            <div className="flex h-full w-full items-center justify-center text-xs text-zinc-600">
              No historical data available yet. Waiting for updates...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={gradientColors[0]} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={gradientColors[1]} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatTime}
                  stroke="#71717a"
                  fontSize={10}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="#71717a"
                  fontSize={10}
                  tickLine={false}
                  dx={-5}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey={dataKey}
                  name={title}
                  stroke={strokeColor}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill={`url(#${fillId})`}
                  isAnimationActive={false} // Disable animation to prevent chart glitches on live updates
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {renderChart('CPU', 'cpu', '#10b981', 'cpuGrad', ['#10b981', '#064e3b'])}
      {renderChart('Memory', 'memory', '#6366f1', 'memGrad', ['#6366f1', '#312e81'])}
      {renderChart('Disk', 'disk', '#f59e0b', 'diskGrad', ['#f59e0b', '#78350f'])}
    </div>
  );
}
