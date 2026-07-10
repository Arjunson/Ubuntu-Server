export interface ProcessInfo {
  pid: number;
  name: string;
  cpu: number;
  mem: number;
}

export interface DetailedSystemInfo {
  timestamp: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  hostname: string;
  currentUser: string;
  uptime: number;
  ipAddress: string;
  memory: {
    total: number;
    used: number;
    free: number;
    active: number;
    available: number;
  };
  disk: {
    total: number;
    used: number;
    mount: string;
  };
  processes: ProcessInfo[];
}

export interface MetricHistory {
  timestamp: number;
  cpu: number;
  memory: number;
  disk: number;
}

export interface Alert {
  id: number;
  timestamp: number;
  metric: 'cpu' | 'memory' | 'disk';
  value: number;
  threshold: number;
  status: 'active' | 'resolved';
}
