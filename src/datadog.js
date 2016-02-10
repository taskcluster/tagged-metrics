module.exports = (options) => {
  // Lazy load dependencies
  let dogapi = require("dogapi");
  let _ = require('lodash');

  if (typeof(options) !== 'object') {
    throw new Error('datadog requires an object with {appKey, apiKey}');
  }
  if (!options.appKey) {
    throw new Error('datadog configuration is missing appKey');
  }
  if (!options.appKey) {
    throw new Error('datadog configuration is missing apiKey');
  }


  throw new Error('Not implemented yet');
};
