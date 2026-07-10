"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDetailedSystemInfo = getDetailedSystemInfo;
exports.getSimpleMetrics = getSimpleMetrics;
const systeminformation_1 = __importDefault(require("systeminformation"));
const os_1 = __importDefault(require("os"));
// Get the main IPv4 address
function getPrimaryIpAddress() {
    const interfaces = os_1.default.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        const ifaceList = interfaces[name];
        if (!ifaceList)
            continue;
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
async function getDetailedSystemInfo() {
    const [cpuData, memData, fsData, procData] = await Promise.all([
        systeminformation_1.default.currentLoad(),
        systeminformation_1.default.mem(),
        systeminformation_1.default.fsSize(),
        systeminformation_1.default.processes()
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
    const hostname = os_1.default.hostname();
    let currentUser = 'unknown';
    try {
        currentUser = os_1.default.userInfo().username;
    }
    catch (err) {
        // Sometimes os.userInfo() can fail if username is not in passwd or runs in restricted env
        currentUser = process.env.USER || process.env.USERNAME || 'unknown';
    }
    const uptime = os_1.default.uptime();
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
        kernel: `${os_1.default.type()} ${os_1.default.release()}`,
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
async function getSimpleMetrics() {
    const [cpuData, memData, fsData] = await Promise.all([
        systeminformation_1.default.currentLoad(),
        systeminformation_1.default.mem(),
        systeminformation_1.default.fsSize()
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
