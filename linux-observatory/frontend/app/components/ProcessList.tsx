import React, { useState } from 'react';
import { ProcessInfo } from '../types';

interface ProcessListProps {
  processes: ProcessInfo[];
}

type SortField = 'pid' | 'name' | 'cpu' | 'mem';
type SortOrder = 'asc' | 'desc';

export default function ProcessList({ processes }: ProcessListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('cpu');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc'); // Default to descending
    }
  };

  // Filter processes
  const filteredProcesses = processes.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort processes
  const sortedProcesses = [...filteredProcesses].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortOrder === 'asc' 
        ? aVal.localeCompare(bVal) 
        : bVal.localeCompare(aVal);
    } else {
      // numeric comparison
      return sortOrder === 'asc'
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    }
  });

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? ' ▴' : ' ▾';
  };

  return (
    <div className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 backdrop-blur-xl">
      {/* Header and Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">Top Processes</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Active tasks ranked by resource utilization</p>
        </div>
        <div className="relative max-w-xs w-full">
          <input
            type="text"
            placeholder="Search processes..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 py-2 pl-4 pr-10 text-xs text-white placeholder-zinc-500 focus:border-indigo-500/80 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
          />
          <svg
            className="absolute right-3.5 top-2.5 h-4 w-4 text-zinc-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-zinc-800/80 bg-zinc-950/20">
        <table className="min-w-full divide-y divide-zinc-800/60">
          <thead className="bg-zinc-900/40">
            <tr>
              <th
                scope="col"
                onClick={() => handleSort('pid')}
                className="cursor-pointer px-4 py-3 text-left text-xs font-semibold text-zinc-400 select-none hover:text-white"
              >
                PID{renderSortIndicator('pid')}
              </th>
              <th
                scope="col"
                onClick={() => handleSort('name')}
                className="cursor-pointer px-4 py-3 text-left text-xs font-semibold text-zinc-400 select-none hover:text-white"
              >
                Process Name{renderSortIndicator('name')}
              </th>
              <th
                scope="col"
                onClick={() => handleSort('cpu')}
                className="cursor-pointer px-4 py-3 text-right text-xs font-semibold text-zinc-400 select-none hover:text-white"
              >
                CPU %{renderSortIndicator('cpu')}
              </th>
              <th
                scope="col"
                onClick={() => handleSort('mem')}
                className="cursor-pointer px-4 py-3 text-right text-xs font-semibold text-zinc-400 select-none hover:text-white"
              >
                Memory %{renderSortIndicator('mem')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/40">
            {sortedProcesses.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-xs text-zinc-600">
                  No processes match the filter.
                </td>
              </tr>
            ) : (
              sortedProcesses.map(proc => (
                <tr key={proc.pid} className="hover:bg-zinc-800/20 transition-colors">
                  <td className="whitespace-nowrap px-4 py-3 text-xs font-mono text-zinc-500">
                    {proc.pid}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs font-medium text-zinc-300">
                    {proc.name}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-xs font-mono font-semibold text-emerald-400">
                    {proc.cpu.toFixed(1)}%
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-xs font-mono font-semibold text-indigo-400">
                    {proc.mem.toFixed(1)}%
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
