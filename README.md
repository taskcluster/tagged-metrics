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


### Estimating Percentiles
Simple metrics like gauges and counters are great for most purposes. But if you
have a lot of data-points and you only care about percentiles, you may be
tempted to aggregate your metrics using service like statsd.

To make this simpler, and avoiding having to configure statsd, this library
contains a easy way to estimate percentiles over data-stream. Unlike statsd
this implementation will estimate the percentiles on-the-fly using
[tdigest](https://github.com/welch/tdigest), as oppose to keeping all
data-points in memory and computing the percentiles when sending data.

For more details refer to the [tdigest](https://github.com/welch/tdigest)
documentation. In simple terms it'll keep data-points in memory until a lot of
data-points have been reported at which time it'll switch to estimating the
percentiles. Hence, reducing the memory usage if you're estimating percentiles
over tens of thousands of data-points.

```js
let TaggedMetrics = require('tagged-metrics');

let metrics = new TaggedMetrics({...});

// Create an estimate
let estimator = metrics.estimate('prefix', {
  // It's important to tag your metrics with a process identifier, as you can't
  // aggregate percentiles from different processes.
  process: process.env.DYNO, // $DYNO is the dyno identify on Heroku
}, 10 * 60 * 1000);

// Send a lot of data-points (over as long time as you wish)
for (let i = 0; i < 10000; i++) {
  estimator(Math.random() * i);
  await sleep(...);
}

// This will create metrics:
//   prefix.count     Counter, counting number of data-points aggregated.
//   prefix.min       Gauge for minimum value,
//   prefix.p25       Gauge for 25'th percentile
//   prefix.p50       Gauge for the median
//   prefix.p75       Gauge for 75'th percentile
//   prefix.p95       Gauge for 95'th percentile
//   prefix.max       Gauge of maximum value,
// For every 10 minutes interval.
```

As evident from the comment you should ensure to tag your estimates with a
unique process identifier. If you use this to record API response-times, you
won't get the 95'th percentile for your service. Instead you'll get an estimate
if the 95'th for each process hosting your service. Assuming you have multiple
services.

Notice, this is the wrong solution if you're looking for high-resolution
metrics. This is useful for performance and health metrics like database access
time, latency etc. for this reason this library will forbid you from using
a resolution higher than 1 minute, and it will always round to nearest minute.
