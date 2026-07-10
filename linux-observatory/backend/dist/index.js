"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const db_1 = __importDefault(require("./db"));
const metrics_1 = require("./metrics");
const cron_1 = require("./cron");
const events_1 = require("./events");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Middleware
app.use((0, cors_1.default)({ origin: '*' })); // Allow any origin for simplicity
app.use(express_1.default.json());
// Start cron jobs
(0, cron_1.startCronJobs)();
// Active SSE client connections
let clients = [];
// Global telemetry broadcaster (broadcasts every 2 seconds to active clients)
setInterval(async () => {
    if (clients.length === 0)
        return;
    try {
        const info = await (0, metrics_1.getDetailedSystemInfo)();
        const dataString = `data: ${JSON.stringify({ type: 'telemetry', data: info })}\n\n`;
        clients.forEach(client => {
            client.write(dataString);
        });
    }
    catch (error) {
        console.error('Error broadcasting system info:', error);
    }
}, 2000);
// Set up event listeners to push alerts to SSE clients instantly
events_1.systemEvents.on(events_1.EVENTS.ALERT_TRIGGERED, (alert) => {
    const dataString = `data: ${JSON.stringify({ type: 'alert_triggered', data: alert })}\n\n`;
    clients.forEach(client => {
        client.write(dataString);
    });
});
events_1.systemEvents.on(events_1.EVENTS.ALERT_RESOLVED, (resolveInfo) => {
    const dataString = `data: ${JSON.stringify({ type: 'alert_resolved', data: resolveInfo })}\n\n`;
    clients.forEach(client => {
        client.write(dataString);
    });
});
// REST Endpoints
// 1. Current system info snapshot
app.get('/api/system-info', async (req, res) => {
    try {
        const info = await (0, metrics_1.getDetailedSystemInfo)();
        res.json(info);
    }
    catch (error) {
        console.error('Error fetching system info:', error);
        res.status(500).json({ error: 'Failed to fetch system info' });
    }
});
// 2. Metrics history (last 60 entries = ~10 mins)
app.get('/api/metrics/history', (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 60;
        // Retrieve historical metrics ordered by timestamp descending, then reverse so it is chronological
        const rows = db_1.default.prepare(`
      SELECT timestamp, cpu, memory, disk 
      FROM metrics 
      ORDER BY timestamp DESC 
      LIMIT ?
    `).all(limit);
        res.json(rows.reverse());
    }
    catch (error) {
        console.error('Error fetching metrics history:', error);
        res.status(500).json({ error: 'Failed to fetch metrics history' });
    }
});
// 3. Current alerts (active & resolved, limit 50)
app.get('/api/alerts', (req, res) => {
    try {
        const alerts = db_1.default.prepare(`
      SELECT * FROM alerts 
      ORDER BY timestamp DESC 
      LIMIT 50
    `).all();
        res.json(alerts);
    }
    catch (error) {
        console.error('Error fetching alerts:', error);
        res.status(500).json({ error: 'Failed to fetch alerts' });
    }
});
// 4. Resolve/dismiss active alert manually
app.post('/api/alerts/resolve/:id', (req, res) => {
    try {
        const id = req.params.id;
        const result = db_1.default.prepare(`
      UPDATE alerts 
      SET status = 'resolved' 
      WHERE id = ? AND status = 'active'
    `).run(id);
        if (result.changes > 0) {
            res.json({ success: true, message: 'Alert marked as resolved' });
            // Notify SSE clients about the manual resolution
            const alert = db_1.default.prepare('SELECT * FROM alerts WHERE id = ?').get(id);
            if (alert) {
                events_1.systemEvents.emit(events_1.EVENTS.ALERT_RESOLVED, {
                    id: parseInt(id),
                    metric: alert.metric,
                    resolvedAt: Math.floor(Date.now() / 1000)
                });
            }
        }
        else {
            res.status(404).json({ error: 'Active alert not found or already resolved' });
        }
    }
    catch (error) {
        console.error('Error resolving alert:', error);
        res.status(500).json({ error: 'Failed to resolve alert' });
    }
});
// 5. SSE stream endpoint for real-time dashboard updates
app.get('/api/stream', (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    });
    // Immediately send initial message so connection establishes
    res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);
    clients.push(res);
    // Clean up connection when client closes
    req.on('close', () => {
        clients = clients.filter(client => client !== res);
    });
});
// Start Express Server
app.listen(PORT, () => {
    console.log(`Express API Server listening on http://localhost:${PORT}`);
});
