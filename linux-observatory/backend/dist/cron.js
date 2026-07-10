"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startCronJobs = startCronJobs;
const node_cron_1 = __importDefault(require("node-cron"));
const db_1 = __importDefault(require("./db"));
const metrics_1 = require("./metrics");
const events_1 = require("./events");
const ALERT_THRESHOLD = 80.0; // 80%
async function checkAndLogMetrics() {
    try {
        const metrics = await (0, metrics_1.getSimpleMetrics)();
        // 1. Save to Database
        const insertMetric = db_1.default.prepare(`
      INSERT INTO metrics (timestamp, cpu, memory, disk)
      VALUES (?, ?, ?, ?)
    `);
        insertMetric.run(metrics.timestamp, metrics.cpuUsage, metrics.memoryUsage, metrics.diskUsage);
        // 2. Prune old database metrics (keep last 24 hours of data to prevent database bloat)
        // 24 hours = 86400 seconds
        const pruneTimestamp = metrics.timestamp - 24 * 60 * 60;
        const pruneMetrics = db_1.default.prepare('DELETE FROM metrics WHERE timestamp < ?');
        pruneMetrics.run(pruneTimestamp);
        // 3. Check alert thresholds
        const targets = [
            { name: 'cpu', value: metrics.cpuUsage },
            { name: 'memory', value: metrics.memoryUsage },
            { name: 'disk', value: metrics.diskUsage }
        ];
        for (const target of targets) {
            // Find active alert for this metric
            const activeAlert = db_1.default.prepare(`
        SELECT * FROM alerts 
        WHERE metric = ? AND status = 'active'
      `).get(target.name);
            if (target.value >= ALERT_THRESHOLD) {
                if (!activeAlert) {
                    // Trigger new alert
                    const insertAlert = db_1.default.prepare(`
            INSERT INTO alerts (timestamp, metric, value, threshold, status)
            VALUES (?, ?, ?, ?, 'active')
          `);
                    const info = insertAlert.run(metrics.timestamp, target.name, target.value, ALERT_THRESHOLD);
                    events_1.systemEvents.emit(events_1.EVENTS.ALERT_TRIGGERED, {
                        id: info.lastInsertRowid,
                        timestamp: metrics.timestamp,
                        metric: target.name,
                        value: target.value,
                        threshold: ALERT_THRESHOLD,
                        status: 'active'
                    });
                }
            }
            else {
                if (activeAlert) {
                    // Resolve alert
                    const resolveAlert = db_1.default.prepare(`
            UPDATE alerts 
            SET status = 'resolved' 
            WHERE id = ?
          `);
                    resolveAlert.run(activeAlert.id);
                    events_1.systemEvents.emit(events_1.EVENTS.ALERT_RESOLVED, {
                        id: activeAlert.id,
                        metric: target.name,
                        resolvedAt: metrics.timestamp
                    });
                }
            }
        }
        // 4. Emit the updated metrics to active SSE listeners
        events_1.systemEvents.emit(events_1.EVENTS.METRIC_UPDATED, metrics);
    }
    catch (error) {
        console.error('Error during cron execution:', error);
    }
}
function startCronJobs() {
    // Run every 10 seconds: */10 * * * * *
    // Note: node-cron supports 6 fields (seconds, minutes, hours, day of month, month, day of week)
    node_cron_1.default.schedule('*/10 * * * * *', checkAndLogMetrics);
    console.log('Cron scheduler started (metrics logged every 10 seconds).');
}
