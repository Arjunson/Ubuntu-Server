import cron from 'node-cron';
import db from './db';
import { getSimpleMetrics } from './metrics';
import { systemEvents, EVENTS } from './events';

const ALERT_THRESHOLD = 80.0; // 80%

async function checkAndLogMetrics() {
  try {
    const metrics = await getSimpleMetrics();

    // 1. Save to Database
    const insertMetric = db.prepare(`
      INSERT INTO metrics (timestamp, cpu, memory, disk)
      VALUES (?, ?, ?, ?)
    `);
    insertMetric.run(metrics.timestamp, metrics.cpuUsage, metrics.memoryUsage, metrics.diskUsage);

    // 2. Prune old database metrics (keep last 24 hours of data to prevent database bloat)
    // 24 hours = 86400 seconds
    const pruneTimestamp = metrics.timestamp - 24 * 60 * 60;
    const pruneMetrics = db.prepare('DELETE FROM metrics WHERE timestamp < ?');
    pruneMetrics.run(pruneTimestamp);

    // 3. Check alert thresholds
    const targets: { name: 'cpu' | 'memory' | 'disk'; value: number }[] = [
      { name: 'cpu', value: metrics.cpuUsage },
      { name: 'memory', value: metrics.memoryUsage },
      { name: 'disk', value: metrics.diskUsage }
    ];

    for (const target of targets) {
      // Find active alert for this metric
      const activeAlert = db.prepare(`
        SELECT * FROM alerts 
        WHERE metric = ? AND status = 'active'
      `).get(target.name) as { id: number; value: number } | undefined;

      if (target.value >= ALERT_THRESHOLD) {
        if (!activeAlert) {
          // Trigger new alert
          const insertAlert = db.prepare(`
            INSERT INTO alerts (timestamp, metric, value, threshold, status)
            VALUES (?, ?, ?, ?, 'active')
          `);
          const info = insertAlert.run(metrics.timestamp, target.name, target.value, ALERT_THRESHOLD);
          
          systemEvents.emit(EVENTS.ALERT_TRIGGERED, {
            id: info.lastInsertRowid,
            timestamp: metrics.timestamp,
            metric: target.name,
            value: target.value,
            threshold: ALERT_THRESHOLD,
            status: 'active'
          });
        }
      } else {
        if (activeAlert) {
          // Resolve alert
          const resolveAlert = db.prepare(`
            UPDATE alerts 
            SET status = 'resolved' 
            WHERE id = ?
          `);
          resolveAlert.run(activeAlert.id);

          systemEvents.emit(EVENTS.ALERT_RESOLVED, {
            id: activeAlert.id,
            metric: target.name,
            resolvedAt: metrics.timestamp
          });
        }
      }
    }

    // 4. Emit the updated metrics to active SSE listeners
    systemEvents.emit(EVENTS.METRIC_UPDATED, metrics);

  } catch (error) {
    console.error('Error during cron execution:', error);
  }
}

export function startCronJobs() {
  // Run every 10 seconds: */10 * * * * *
  // Note: node-cron supports 6 fields (seconds, minutes, hours, day of month, month, day of week)
  cron.schedule('*/10 * * * * *', checkAndLogMetrics);
  console.log('Cron scheduler started (metrics logged every 10 seconds).');
}
