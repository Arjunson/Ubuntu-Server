import React from 'react';

interface MetricCardProps {
  title: string;
  value: number; // 0 to 100
  details: string;
  icon: React.ReactNode;
}

export default function MetricCard({ title, value, details, icon }: MetricCardProps) {
  // Determine color theme based on threshold
  let strokeColor = 'stroke-indigo-500';
  let textColor = 'text-indigo-400';
  let badgeBg = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
  let statusText = 'Normal';
  let isAlert = false;

  if (value >= 80) {
    strokeColor = 'stroke-rose-500';
    textColor = 'text-rose-400';
    badgeBg = 'bg-rose-500/15 text-rose-400 border-rose-500/30 animate-pulse';
    statusText = 'Alert (>80%)';
    isAlert = true;
  } else if (value >= 60) {
    strokeColor = 'stroke-amber-500';
    textColor = 'text-amber-400';
    badgeBg = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    statusText = 'Warning';
  } else {
    strokeColor = 'stroke-emerald-500';
    textColor = 'text-emerald-400';
    badgeBg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  }

  // Circular progress SVG variables
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;

  return (
    <div className={`relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-xl transition-all duration-300 hover:border-zinc-700 hover:shadow-lg hover:shadow-black/20 ${isAlert ? 'ring-1 ring-rose-500/30' : ''}`}>
      {/* Decorative gradient overlay */}
      <div className="absolute -right-16 -top-16 -z-10 h-32 w-32 rounded-full bg-indigo-500/5 blur-3xl" />
      {isAlert && (
        <div className="absolute -right-16 -top-16 -z-10 h-32 w-32 rounded-full bg-rose-500/10 blur-3xl" />
      )}

      {/* Header info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800/80 text-zinc-300 border border-zinc-700/50">
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-wide text-zinc-400 uppercase">
              {title}
            </h3>
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-2xs font-semibold ${badgeBg} mt-1`}>
              {statusText}
            </span>
          </div>
        </div>

        {/* Circular Progress Gauge */}
        <div className="relative flex items-center justify-center h-20 w-20">
          <svg className="h-full w-full -rotate-90">
            {/* Background Circle */}
            <circle
              cx="40"
              cy="40"
              r={radius}
              className="stroke-zinc-800"
              strokeWidth="6"
              fill="transparent"
            />
            {/* Foreground Fill */}
            <circle
              cx="40"
              cy="40"
              r={radius}
              className={`transition-all duration-500 ease-out ${strokeColor}`}
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          {/* Percentage text in center */}
          <div className="absolute flex flex-col items-center">
            <span className="text-base font-bold text-white tracking-tight">
              {value.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Metric details */}
      <div className="mt-6 border-t border-zinc-800/60 pt-4">
        <p className="text-xs text-zinc-500">Resource details</p>
        <p className="mt-1 text-sm font-medium text-zinc-300 tracking-tight">
          {details}
        </p>
      </div>
    </div>
  );
}
