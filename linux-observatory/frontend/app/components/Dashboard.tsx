'use client';

import React, { useEffect, useState } from 'react';
import { DetailedSystemInfo, MetricHistory, Alert } from '../types';
import MetricCard from './MetricCard';
import MetricCharts from './MetricCharts';
import ProcessList from './ProcessList';
import AlertPanel from './AlertPanel';

const getBackendUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:3001`;
  }
  return 'http://localhost:3001';
};

export default function Dashboard() {
  const [systemInfo, setSystemInfo] = useState<DetailedSystemInfo | null>(null);
  const [history, setHistory] = useState<MetricHistory[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    async function fetchInitialData() {
      try {
        const [infoRes, historyRes, alertsRes] = await Promise.all([
          fetch(`${getBackendUrl()}/api/system-info`),
          fetch(`${getBackendUrl()}/api/metrics/history`),
          fetch(`${getBackendUrl()}/api/alerts`),
        ]);

        if (!infoRes.ok || !historyRes.ok || !alertsRes.ok) {
          throw new Error('Failed to fetch initial status from monitoring server');
        }

        const info = await infoRes.json();
        const historyData = await historyRes.json();
        const alertsData = await alertsRes.json();

        setSystemInfo(info);
        setHistory(historyData);
        setAlerts(alertsData);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching initial dashboard data:', err);
        setError(err.message || 'Could not connect to monitoring backend.');
      }
    }

    fetchInitialData();
  }, []);

  // Connect to SSE stream
  useEffect(() => {
    const eventSource = new EventSource(`${getBackendUrl()}/api/stream`);

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    eventSource.onerror = (e) => {
      console.error('SSE Connection Error:', e);
      setIsConnected(false);
      setError('Monitoring backend is offline or unreachable. Retrying connection...');
    };

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'connected') {
          setIsConnected(true);
        } else if (payload.type === 'telemetry') {
          const telemetryData: DetailedSystemInfo = payload.data;
          setSystemInfo(telemetryData);
          
          // Append new metrics to history and maintain a rolling window of 60 records
          setHistory(prevHistory => {
            const newPoint: MetricHistory = {
              timestamp: telemetryData.timestamp,
              cpu: telemetryData.cpuUsage,
              memory: telemetryData.memoryUsage,
              disk: telemetryData.diskUsage
            };
            const updated = [...prevHistory, newPoint];
            if (updated.length > 60) {
              return updated.slice(updated.length - 60);
            }
            return updated;
          });
        } else if (payload.type === 'alert_triggered') {
          const newAlert: Alert = payload.data;
          setAlerts(prevAlerts => {
            // Check if alert already exists in active list
            if (prevAlerts.some(a => a.id === newAlert.id)) return prevAlerts;
            return [newAlert, ...prevAlerts];
          });
        } else if (payload.type === 'alert_resolved') {
          const resolveInfo = payload.data;
          setAlerts(prevAlerts =>
            prevAlerts.map(alert =>
              alert.id === resolveInfo.id ? { ...alert, status: 'resolved' } : alert
            )
          );
        }
      } catch (err) {
        console.error('Failed to parse SSE payload:', err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // Handle alert manual resolution
  const handleResolveAlert = async (id: number) => {
    try {
      const res = await fetch(`${getBackendUrl()}/api/alerts/resolve/${id}`, {
        method: 'POST',
      });
      if (res.ok) {
        setAlerts(prevAlerts =>
          prevAlerts.map(alert =>
            alert.id === id ? { ...alert, status: 'resolved' } : alert
          )
        );
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to resolve alert');
      }
    } catch (err) {
      console.error('Error resolving alert:', err);
      alert('Network error resolving alert');
    }
  };

  // Helper formatting functions
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`);
    
    return parts.join(' ');
  };

  return (
    <div className="flex flex-1 flex-col bg-zinc-950 p-6 text-zinc-100 md:p-10">
      {/* Top Banner Message for errors or connecting status */}
      {error && (
        <div className="mb-8 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-400 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500"></span>
            </span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Main Header section */}
      <header className="mb-10 flex flex-col justify-between gap-6 border-b border-zinc-800/80 pb-8 lg:flex-row lg:items-end">
        <div>
          <div className="flex items-center gap-3">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            <span className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">
              Linux Observatory
            </span>
            {isConnected ? (
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-3xs font-semibold text-emerald-400 border border-emerald-500/20">
                Connected
              </span>
            ) : (
              <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-3xs font-semibold text-rose-400 border border-rose-500/20 animate-pulse">
                Offline
              </span>
            )}
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {systemInfo ? systemInfo.hostname : 'System Monitor'}
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Real-time telemetry and resource usage dashboard
          </p>
        </div>

        {/* Detailed System metadata */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 backdrop-blur-md sm:grid-cols-4 min-w-[320px]">
          <div>
            <p className="text-2xs font-medium text-zinc-500 uppercase tracking-wider">Host IP</p>
            <p className="mt-1 text-sm font-semibold font-mono text-zinc-200">
              {systemInfo ? systemInfo.ipAddress : '---'}
            </p>
          </div>
          <div>
            <p className="text-2xs font-medium text-zinc-500 uppercase tracking-wider">Active User</p>
            <p className="mt-1 text-sm font-semibold text-zinc-200">
              {systemInfo ? systemInfo.currentUser : '---'}
            </p>
          </div>
          <div>
            <p className="text-2xs font-medium text-zinc-500 uppercase tracking-wider">Uptime</p>
            <p className="mt-1 text-sm font-semibold text-zinc-200">
              {systemInfo ? formatUptime(systemInfo.uptime) : '---'}
            </p>
          </div>
          <div>
            <p className="text-2xs font-medium text-zinc-500 uppercase tracking-wider">Kernel Info</p>
            <p className="mt-1 text-sm font-semibold text-zinc-200 truncate max-w-[150px]" title={systemInfo ? systemInfo.kernel : ''}>
              {systemInfo ? systemInfo.kernel : '---'}
            </p>
          </div>
        </div>
      </header>

      {/* Main Dashboard Cards (CPU, Mem, Disk) */}
      <section className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-3">
        <MetricCard
          title="CPU Load"
          value={systemInfo ? systemInfo.cpuUsage : 0}
          details="Active processing workload"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          }
        />
        <MetricCard
          title="Memory Usage"
          value={systemInfo ? systemInfo.memoryUsage : 0}
          details={systemInfo ? `${formatBytes(systemInfo.memory.used)} / ${formatBytes(systemInfo.memory.total)}` : '---'}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          }
        />
        <MetricCard
          title="Disk Capacity"
          value={systemInfo ? systemInfo.diskUsage : 0}
          details={systemInfo ? `${formatBytes(systemInfo.disk.used)} / ${formatBytes(systemInfo.disk.total)} (on ${systemInfo.disk.mount})` : '---'}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.58 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.58 4 8 4s8-1.79 8-4M4 7c0-2.21 3.58-4 8-4s8 1.79 8 4m0 5c0 2.21-3.58 4-8 4s-8-1.79-8-4" />
            </svg>
          }
        />
      </section>

      {/* Live Trends charts */}
      <section className="mb-10">
        <h2 className="mb-6 text-xl font-bold tracking-tight text-white">Live Resource Trends</h2>
        <MetricCharts data={history} />
      </section>

      {/* Process list & active Alerts */}
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ProcessList processes={systemInfo ? systemInfo.processes : []} />
        </div>
        <div className="lg:col-span-1">
          <AlertPanel alerts={alerts} onResolve={handleResolveAlert} />
        </div>
      </section>
    </div>
  );
}
