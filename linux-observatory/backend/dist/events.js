"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EVENTS = exports.systemEvents = void 0;
const events_1 = require("events");
exports.systemEvents = new events_1.EventEmitter();
// Event names
exports.EVENTS = {
    METRIC_UPDATED: 'metric_updated',
    ALERT_TRIGGERED: 'alert_triggered',
    ALERT_RESOLVED: 'alert_resolved',
};
