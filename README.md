Tagged-Metrics, Client for SignalFX and DataDog
===============================================

A client for generic metrics that can submit to either SignalFX and DataDog, so
that migrating between providers is merely a configuration option.

```js
let TaggedMetrics = require('tagged-metrics');

let metrics = new TaggedMetrics({
  // Supply keys for one or more metric service providers
  // (Without any provider a warning will be printed, but no error)
  signalfx:   '[token]',
  datadog: {
    apiKey:   '[api-key]',
    appKey:   '[app-key]',
  },

  // Prefix and tags for all metrics (optional)
  prefix:     'myapp',
  tags: {
    key: value,
  },

  // Optional parameters
  emitErrors:     false,          // Defaults to ignore errors (print warning)
  flushInterval:  3 * 60 * 1000,  // Time keep metrics in memory before flushing
  maxDataPoints:  5000,           // Max data-points before flushing
});

// Submit myapp.my-gauge (tags and timestamp being optional)
metrics.gauge('my-gauge', 42, {key: value}, new Date());

// Submit myapp.my-counter (tags and timestamp being optional)
metrics.count('my-counter', 42, {key: value}, new Date());

// Create child metrics (prefix and tags optional)
let child = metrics.child('child-prefix', {key: value});

// Submit myapp.child-prefix.my-gauge
child.gauge('my-gauge', 42);

let child2 = child.child(...); // Child metrics can be nested

// Flush metrics immediately (including metrics from children)
await metrics.flush();
```