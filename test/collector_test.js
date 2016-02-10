suite('MetricsCollector', () => {
  let assert = require('assert');
  let Promise = require('promise');
  let events = require('events');
  let MetricsCollector = require('../lib/collector');

  test('flush', async () => {
    let value = null;
    let count = 0;
    let collector = new MetricsCollector({
      dummy() {return v => {value = v; count += 1;}},
    }, {
      dummy: null,
      emitErrors: false,
      flushInterval: 200,
      maxDataPoints: 10,
    }, null);

    collector.add({
      name:   'test',
      value:  42,
      tags:   {},
      type:   'gauge',
      time:   new Date(),
    });

    assert(value === null);
    assert(count === 0);
    await collector.flush();
    assert(count === 1);
    assert(value.length === 1);
    assert(value[0].name === 'test');
    assert(value[0].value === 42);

    await collector.flush();
    assert(count === 1);
  });

  test('maxDataPoints', async () => {
    let value = null;
    let count = 0;
    let collector = new MetricsCollector({
      dummy() {return v => {value = v; count += 1;}},
    }, {
      dummy: null,
      emitErrors: false,
      flushInterval: 200,
      maxDataPoints: 5,
    }, null);

    let point = {
      name:   'test',
      value:  42,
      tags:   {},
      type:   'gauge',
      time:   new Date(),
    };
    collector.add(point);
    collector.add(point);
    collector.add(point);
    collector.add(point);
    assert(value === null);
    assert(count === 0);
    collector.add(point);
    assert(count === 1);
    assert(value.length === 5);
    assert(value[0].name === 'test');
    assert(value[0].value === 42);

    await collector.flush();
    assert(count === 1);
  });

  test('flushInterval', async () => {
    let value = null;
    let count = 0;
    let collector = new MetricsCollector({
      dummy() {return v => {value = v; count += 1;}},
    }, {
      dummy: null,
      emitErrors: false,
      flushInterval: 50,
      maxDataPoints: 5,
    }, null);

    let point = {
      name:   'test',
      value:  42,
      tags:   {},
      type:   'gauge',
      time:   new Date(),
    };
    collector.add(point);
    collector.add(point);
    assert(value === null);
    assert(count === 0);

    await new Promise(accept => setTimeout(accept, 75));
    assert(count === 1);
    assert(value.length === 2);
    assert(value[0].name === 'test');
    assert(value[0].value === 42);

    await collector.flush();
    assert(count === 1);
  });

  test('emitErrors: false', async () => {
    let emitter = new events.EventEmitter();
    let seenError = false;
    emitter.once('error', () => seenError = true);
    let collector = new MetricsCollector({
      dummy() {return () => {throw new Error('bad thing');}},
    }, {
      dummy: null,
      emitErrors: false,
      flushInterval: 50,
      maxDataPoints: 5,
    }, emitter);

    let point = {
      name:   'test',
      value:  42,
      tags:   {},
      type:   'gauge',
      time:   new Date(),
    };

    collector.add(point);
    await collector.flush();
    assert(!seenError);
  });

  test('emitErrors: true', async () => {
    let emitter = new events.EventEmitter();
    let gotError = new Promise(accept => emitter.once('error', accept));
    let collector = new MetricsCollector({
      dummy() {return () => {throw new Error('bad thing');}},
    }, {
      dummy: null,
      emitErrors: true,
      flushInterval: 20,
      maxDataPoints: 5,
    }, emitter);

    let point = {
      name:   'test',
      value:  42,
      tags:   {},
      type:   'gauge',
      time:   new Date(),
    };

    collector.add(point);
    await gotError;
  });
});