let assert = require('assert');
let debug = require('debug')('tagged-metrics');
let _ = require('lodash');
let Promise = require('promise');

class MetricsCollector {
  constructor(providers, options, parent) {
    let services = [];
    _.forEach(options, (value, key) => {
      if (providers[key]) {
        services.push(providers[key](value));
      }
    });
    if (services.length === 0) {
      console.log('Warning: No service is configured for TaggedMetrics!');
      console.log('         All reported data-points will be dropped...');
      this.service = () => Promise.resolve();
    } else if (services.length === 1) {
      this.service = services[0];
    } else {
      this.service = (metrics) => {
        return Promise.all(services.map(s => s(metrics)));
      };
    }
    this.parent = parent;
    this.emitErrors = options.emitErrors;
    this.flushInterval = options.flushInterval;
    this.maxDataPoints = options.maxDataPoints;
    this.metrics = [];
    this.flushTimer = null;
  }

  /** Collect a metric: {name, value tags, type, time} */
  add(metric) {
    this.metrics.push(metric);
    if (this.metrics.length >= this.maxDataPoints) {
      this.flush();
    } else if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => this.flush(), this.flushInterval);
    }
  }

  async flush() {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    if (this.metrics.length === 0) {
      return;
    }
    let metrics = this.metrics;
    this.metrics = [];
    try {
      await this.service(metrics);
    } catch (err) {
      if (this.emitErrors) {
        this.parent.emit('error', err);
      }
    }
  }
};

// Export MetricsCollector
module.exports = MetricsCollector;
