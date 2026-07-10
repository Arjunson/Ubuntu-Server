import { EventEmitter } from 'events';

export const systemEvents = new EventEmitter();

// Event names
export const EVENTS = {
  METRIC_UPDATED: 'metric_updated',
  ALERT_TRIGGERED: 'alert_triggered',
  ALERT_RESOLVED: 'alert_resolved',
};
