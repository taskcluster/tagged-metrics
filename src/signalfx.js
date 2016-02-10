module.exports = (token) => {
  // Lazy load dependencies
  let signalfx = require('signalfx');
  let _ = require('lodash');

  if (typeof(token) !== 'string') {
    throw new Error('signalfx token must be a string');
  }
  let client = new signalfx.SignalFx(token);
  return (metrics) => {
    let data = {gauges: [], counters: []};
    metrics.forEach(dataPoint => {
      if (dataPoint.type === 'gauge') {
        data.gauges.push({
          metric: dataPoint.name,
          value: dataPoint.value,
          timestamp: dataPoint.getTime(),
          dimensions: dataPoint.tags,
        });
      } else if (dataPoint.type === 'counter') {
        data.counters.push({
          metric: dataPoint.name,
          value: dataPoint.value,
          timestamp: dataPoint.getTime(),
          dimensions: dataPoint.tags,
        });
      }
    });
    return client.send(data);
  };
};