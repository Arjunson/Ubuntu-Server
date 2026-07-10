import React from 'react';
import { Alert } from '../types';

interface AlertPanelProps {
  alerts: Alert[];
  onResolve: (id: number) => Promise<void>;
}

export default function AlertPanel({ alerts, onResolve }: AlertPanelProps) {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const resolvedAlerts = alerts.filter(a => a.status === 'resolved');

  return (
    <div className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 backdrop-blur-xl h-full justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              System Alerts
              {activeAlerts.length > 0 && (
                <span className="relative flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-3xs font-extrabold text-white">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                  {activeAlerts.length}
                </span>
              )}
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">Threshold logs exceeding 80% limit</p>
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-3 max-h-[30rem] overflow-y-auto pr-1 scrollbar-thin">
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-emerald-500/10 p-3 text-emerald-400 border border-emerald-500/20">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="mt-3 text-xs font-semibold text-zinc-300">All Systems Nominal</p>
              <p className="text-2xs text-zinc-500 max-w-[200px] mt-1">
                No active threshold violations reported.
              </p>
            </div>
          ) : (
            alerts.map(alert => {
              const isActive = alert.status === 'active';
              return (
                <div
                  key={alert.id}
                  className={`flex flex-col gap-2 rounded-xl border p-4 transition-all duration-300 ${
                    isActive
                      ? 'border-rose-500/30 bg-rose-500/5 shadow-md shadow-rose-950/10 animate-fade-in'
                      : 'border-zinc-800 bg-zinc-950/20 opacity-75'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-3xs font-extrabold uppercase border ${
                          isActive
                            ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}
                      >
                        {alert.metric}
                      </span>
                      <span className="text-2xs text-zinc-500">
                        {formatTime(alert.timestamp)}
                      </span>
                    </div>
                    {isActive && (
                      <button
                        onClick={() => onResolve(alert.id)}
                        className="rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50 px-2 py-1 text-3xs font-semibold text-white transition-colors"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <p className="text-xs text-zinc-400">
                      Usage exceeded <span className="font-semibold text-zinc-300">80%</span>
                    </p>
                    <p className={`text-sm font-bold ${isActive ? 'text-rose-400' : 'text-zinc-500'}`}>
                      {alert.value.toFixed(1)}%
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      
      {/* Footer Info */}
      {alerts.length > 0 && (
        <div className="border-t border-zinc-800/60 pt-4 mt-6 flex justify-between text-3xs text-zinc-600 font-mono">
          <span>Active: {activeAlerts.length}</span>
          <span>Resolved: {resolvedAlerts.length}</span>
        </div>
      )}
    </div>
  );
}
