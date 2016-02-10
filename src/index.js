let events = require('events');
let debug = require('debug')('tagged-metrics');
let _ = require('lodash');
let MetricsCollector = require('./collector');
let tdigest = require('tdigest');

const SEPARATOR = '.';

const METRIC_SERVICES = {};

let sanitizeTags = (tags) => {
  // Ensure that tag values are strings
  let newTags = {};
  _.forEach(tags, (value, key) => {
    if (typeof(value) !== 'string' && typeof(value) !== 'number') {
      throw new Error('tag values must be strings (or numbers)');
    }
    newTags[key] = '' + value;
  });
  return newTags;
};

let check = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};


class TaggedMetrics extends events.EventEmitter {
  constructor(options) {
    super();

    // Handle case for recursive constructor
    if (options.__collector) {
      this.collector = options.__collector;
      this.tags = options.tags;
      this.prefix = options.prefix;
      return;
    }
    // Handle options from user
    options = _.defaults({}, options, {
      emitErrors: false,
      flushInterval: 3 * 60 * 1000,
      maxDataPoints: 5000,
    });
    this.collector = new MetricsCollector(METRIC_SERVICES, options, this);
    this.tags = sanitizeTags(options.tags || {});
    this.prefix = _.trim(options.prefix || '', SEPARATOR);
  }

  gauge(name, value, tags = null, time = new Date()) {
    check(typeof(name) === 'string', 'name must be a string');
    name = _.trim(name, SEPARATOR);
    check(name.length > 0, 'name must be longer than zero characters');
    check(typeof(value) === 'number', 'value must be a number');
    if (tags) {
      check(typeof(tags) === 'object', 'tags must be an object, if given');
      tags = _.defaults(sanitizeTags(tags), this.tags);
    } else {
      tags = this.tags;
    }
    check(time instanceof Date, 'time must be an instance of Date');
    this.collector.add({
      name: this.prefix + SEPARATOR + name,
      value,
      tags,
      type: 'gauge',
      time,
    });
  }

  count(name, value = 1, tags = null, time = new Date()) {
    check(typeof(name) === 'string', 'name must be a string');
    name = _.trim(name, SEPARATOR);
    check(name.length > 0, 'name must be longer than zero characters');
    check(typeof(value) === 'number', 'value must be a number');
    if (tags) {
      check(typeof(tags) === 'object', 'tags must be an object if given');
      tags = _.defaults(sanitizeTags(tags), this.tags);
    } else {
      tags = this.tags;
    }
    check(time instanceof Date, 'time must be an instance of Date');
    this.collector.add({
      name: this.prefix + SEPARATOR + name,
      value,
      tags,
      type: 'counter',
      time,
    });
  }

  approximate(prefix, tags = null, interval = 10 * 60 * 1000) {
    check(typeof(prefix) === 'string', 'prefix must be a string');
    prefix = _.trim(prefix, SEPARATOR);
    check(prefix.length > 0, 'prefix must be longer than zero characters');
    check(typeof(interval) === 'number', 'interval must be a number');
    check(interval < 60 * 1000, 'interval less than 1 minute makes no sense');
    if (tags) {
      check(typeof(tags) === 'object', 'tags must be an object if given');
      tags = _.defaults(sanitizeTags(tags), this.tags);
    } else {
      tags = this.tags;
    }
    prefix += SEPARATOR;

    // Round interval to number of minutes for simplicity
    interval = Math.round(interval / 60 * 1000) * 60 * 1000;

    let nextTime = Number.MAX_SAFE_INTEGER;
    let digest = new tdigest.Digest();
    let count = 0;
    let flush = () => {
      if (flushTimeout) {
        clearTimeout(flushTimeout);
        flushTimeout = null;
      }
      let time = new Date(nextTime);
      this.count(prefix + 'count', count, tags, time);
      this.gauge(prefix + 'min', digest.percentile(0), time);
      this.gauge(prefix + 'p25', digest.percentile(0.25), time);
      this.gauge(prefix + 'p50', digest.percentile(0.5), time);
      this.gauge(prefix + 'p75', digest.percentile(0.75), time);
      this.gauge(prefix + 'p95', digest.percentile(0.95), time);
      this.gauge(prefix + 'max', digest.percentile(1.0), time);
      nextTime = Number.MAX_SAFE_INTEGER;
      digest = new tdigest.Digest();
      count = 0;
    };

    return value => {
      if (Date.now() > nextTime) {
        flush();
      }
      count += 1;
      digest.push(value);
      if (!flushTimeout) {
        // Compute nextTime as interval * X from epoch, so all servers send data
        // for the same intervals...
        let now = Date.now();
        nextTime = (Math.ceil(now / interval) + 1) * interval;
        flushTimeout = setTimeout(flush, nextTime - now);
      }
    };
  }

  child(prefix, tags) {
    if (typeof(prefix) === 'object') {
      tags = prefix;
    }
    if (typeof(prefix) === 'string') {
      prefix = _.trim(prefix, SEPARATOR);
      if (prefix.length !== 0) {
        prefix = this.prefix + SEPARATOR + prefix;
      } else {
        prefix = this.prefix;
      }
    } else {
      prefix = this.prefix;
    }
    tags = _.defaults(sanitizeTags(tags || {}), this.tags);
    return new TaggedMetrics({__collector: this.collector, prefix, tags});
  }

  /** Flush metrics prior to shutdown */
  flush() {
    return this.collector.flush();
  }

  static registerService(name, service) {
    if (METRIC_SERVICES[name]) {
      throw new Error('Service with name: "' + name + '" already exist');
    }
    METRIC_SERVICES[name] = service;
  }
};

// Register service providers
TaggedMetrics.registerService('signalfx', require('./signalfx'));
TaggedMetrics.registerService('datadog', require('./datadog'));

// Export TaggedMetrics
module.exports = TaggedMetrics;
