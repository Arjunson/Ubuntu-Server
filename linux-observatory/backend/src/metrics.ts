import si from 'systeminformation';
import os from 'os';

export interface SystemMetrics {
  timestamp: number;
  cpuUsage: number;     // % (0-100)
  memoryUsage: number;  // % (0-100)
  diskUsage: number;    // % (0-100)
}

export interface DetailedSystemInfo extends SystemMetrics {
  hostname: string;
  currentUser: string;
  uptime: number;       // seconds
  ipAddress: string;
  memory: {
    total: number;      // bytes
    used: number;       // bytes
    free: number;       // bytes
    active: number;     // bytes
    available: number;  // bytes
  };
  disk: {
    total: number;      // bytes
    used: number;       // bytes
    mount: string;
  };
  processes: {
    pid: number;
    name: string;
    cpu: number;        // %
    mem: number;        // %
  }[];
}

// Get the main IPv4 address
function getPrimaryIpAddress(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const ifaceList = interfaces[name];
    if (!ifaceList) continue;
    for (const iface of ifaceList) {
      // Look for IPv4, non-internal address
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

// Fetch current metrics and static information
export async function getDetailedSystemInfo(): Promise<DetailedSystemInfo> {
  const [cpuData, memData, fsData, procData] = await Promise.all([
    si.currentLoad(),
    si.mem(),
    si.fsSize(),
    si.processes()
  ]);

  const timestamp = Math.floor(Date.now() / 1000);

  // 1. CPU Usage
  const cpuUsage = Math.min(100, Math.max(0, cpuData.currentLoad));

  // 2. Memory Usage
  // Use active memory or total - available. On Linux/Mac, (total - available) / total is the standard usage.
  const totalMem = memData.total;
  const availableMem = memData.available ?? (memData.total - memData.active);
  const usedMem = totalMem - availableMem;
  const memoryUsage = Math.min(100, Math.max(0, (usedMem / totalMem) * 100));

  // 3. Disk Usage
  // Look for mount = '/' or take the largest/first disk if '/' is not present (e.g. on Windows)
  const rootFs = fsData.find(fs => fs.mount === '/') || fsData[0];
  const diskUsage = rootFs ? rootFs.use : 0;
  const diskTotal = rootFs ? rootFs.size : 0;
  const diskUsed = rootFs ? rootFs.used : 0;
  const diskMount = rootFs ? rootFs.mount : '/';

  // 4. Host Info
  const hostname = os.hostname();
  let currentUser = 'unknown';
  try {
    currentUser = os.userInfo().username;
  } catch (err) {
    // Sometimes os.userInfo() can fail if username is not in passwd or runs in restricted env
    currentUser = process.env.USER || process.env.USERNAME || 'unknown';
  }
  const uptime = os.uptime();
  const ipAddress = getPrimaryIpAddress();

  // 5. Processes Info (Top 10 by CPU usage)
  const processes = (procData.list || [])
    .map(p => ({
      pid: p.pid,
      name: p.name,
      cpu: p.cpu,
      mem: p.mem
    }))
    .sort((a, b) => b.cpu - a.cpu)
    .slice(0, 10);

  return {
    timestamp,
    cpuUsage,
    memoryUsage,
    diskUsage,
    hostname,
    currentUser,
    uptime,
    ipAddress,
    memory: {
      total: totalMem,
      used: usedMem,
      free: memData.free,
      active: memData.active,
      available: availableMem
    },
    disk: {
      total: diskTotal,
      used: diskUsed,
      mount: diskMount
    },
    processes
  };
}

// Fetch just the simple metrics (used by the cron job)
export async function getSimpleMetrics(): Promise<SystemMetrics> {
  const [cpuData, memData, fsData] = await Promise.all([
    si.currentLoad(),
    si.mem(),
    si.fsSize()
  ]);

  const timestamp = Math.floor(Date.now() / 1000);

  const cpuUsage = Math.min(100, Math.max(0, cpuData.currentLoad));

  const totalMem = memData.total;
  const availableMem = memData.available ?? (memData.total - memData.active);
  const usedMem = totalMem - availableMem;
  const memoryUsage = Math.min(100, Math.max(0, (usedMem / totalMem) * 100));

  const rootFs = fsData.find(fs => fs.mount === '/') || fsData[0];
  const diskUsage = rootFs ? rootFs.use : 0;

  return {
    timestamp,
    cpuUsage,
    memoryUsage,
    diskUsage
  };
}
