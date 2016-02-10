suite('TaggedMetrics', () => {
  let assert = require('assert');
  let _ = require('lodash');
  let TaggedMetrics = require('../');

  test('gauge', async () => {
    let data = [];
    let metrics = new TaggedMetrics({
      __collector: {add(m) {data.push(m)}},
      prefix: 'prefix',
      tags: {key1: '1'},
    });

    let time = new Date();
    metrics.gauge('name', 42, {key2: 2}, time);
    assert(data.length === 1);
    assert(data[0].name === 'prefix.name');
    assert(data[0].value === 42);
    assert(_.keys(data[0].tags).length === 2);
    assert(data[0].tags.key1 === '1');
    assert(data[0].tags.key2 === '2');
    assert(data[0].type === 'gauge');
    assert(data[0].time === time);
  });


  test('count', async () => {
    let data = [];
    let metrics = new TaggedMetrics({
      __collector: {add(m) {data.push(m)}},
      prefix: 'prefix',
      tags: {key1: '1'},
    });

    let time = new Date();
    metrics.count('name', 42, {key2: 2}, time);
    assert(data.length === 1);
    assert(data[0].name === 'prefix.name');
    assert(data[0].value === 42);
    assert(_.keys(data[0].tags).length === 2);
    assert(data[0].tags.key1 === '1');
    assert(data[0].tags.key2 === '2');
    assert(data[0].type === 'counter');
    assert(data[0].time === time);
  });

  test('child("test").gauge', async () => {
    let data = [];
    let metrics = new TaggedMetrics({
      __collector: {add(m) {data.push(m)}},
      prefix: 'prefix',
      tags: {key1: '1'},
    });

    let time = new Date();
    metrics.child('test').gauge('name', 42, {key2: 2}, time);
    assert(data.length === 1);
    assert(data[0].name === 'prefix.test.name');
    assert(data[0].value === 42);
    assert(_.keys(data[0].tags).length === 2);
    assert(data[0].tags.key1 === '1');
    assert(data[0].tags.key2 === '2');
    assert(data[0].type === 'gauge');
    assert(data[0].time === time);
  });

  test('child("test", tags).gauge', async () => {
    let data = [];
    let metrics = new TaggedMetrics({
      __collector: {add(m) {data.push(m)}},
      prefix: 'prefix',
      tags: {key1: '1'},
    });

    let time = new Date();
    metrics.child('test', {key3: 3}).gauge('name', 42, {key2: 2}, time);
    assert(data.length === 1);
    assert(data[0].name === 'prefix.test.name');
    assert(data[0].value === 42);
    assert(_.keys(data[0].tags).length === 3);
    assert(data[0].tags.key1 === '1');
    assert(data[0].tags.key2 === '2');
    assert(data[0].tags.key3 === '3');
    assert(data[0].type === 'gauge');
    assert(data[0].time === time);
  });

  test('child(tags).gauge', async () => {
    let data = [];
    let metrics = new TaggedMetrics({
      __collector: {add(m) {data.push(m)}},
      prefix: 'prefix',
      tags: {key1: '1'},
    });

    let time = new Date();
    metrics.child({key3: '3'}).gauge('name', 42, {key2: 2}, time);
    assert(data.length === 1);
    assert(data[0].name === 'prefix.name');
    assert(data[0].value === 42);
    assert(_.keys(data[0].tags).length === 3);
    assert(data[0].tags.key1 === '1');
    assert(data[0].tags.key2 === '2');
    assert(data[0].tags.key3 === '3');
    assert(data[0].type === 'gauge');
    assert(data[0].time === time);
  });


  test('child("test").count', async () => {
    let data = [];
    let metrics = new TaggedMetrics({
      __collector: {add(m) {data.push(m)}},
      prefix: 'prefix',
      tags: {key1: '1'},
    });

    let time = new Date();
    metrics.child('test').count('name', 42, {key2: 2}, time);
    assert(data.length === 1);
    assert(data[0].name === 'prefix.test.name');
    assert(data[0].value === 42);
    assert(_.keys(data[0].tags).length === 2);
    assert(data[0].tags.key1 === '1');
    assert(data[0].tags.key2 === '2');
    assert(data[0].type === 'counter');
    assert(data[0].time === time);
  });

  test('child("test", tags).count', async () => {
    let data = [];
    let metrics = new TaggedMetrics({
      __collector: {add(m) {data.push(m)}},
      prefix: 'prefix',
      tags: {key1: '1'},
    });

    let time = new Date();
    metrics.child('test', {key3: 3}).count('name', 42, {key2: 2}, time);
    assert(data.length === 1);
    assert(data[0].name === 'prefix.test.name');
    assert(data[0].value === 42);
    assert(_.keys(data[0].tags).length === 3);
    assert(data[0].tags.key1 === '1');
    assert(data[0].tags.key2 === '2');
    assert(data[0].tags.key3 === '3');
    assert(data[0].type === 'counter');
    assert(data[0].time === time);
  });

  test('child(tags).count', async () => {
    let data = [];
    let metrics = new TaggedMetrics({
      __collector: {add(m) {data.push(m)}},
      prefix: 'prefix',
      tags: {key1: '1'},
    });

    let time = new Date();
    metrics.child({key3: '3'}).count('name', 42, {key2: 2}, time);
    assert(data.length === 1);
    assert(data[0].name === 'prefix.name');
    assert(data[0].value === 42);
    assert(_.keys(data[0].tags).length === 3);
    assert(data[0].tags.key1 === '1');
    assert(data[0].tags.key2 === '2');
    assert(data[0].tags.key3 === '3');
    assert(data[0].type === 'counter');
    assert(data[0].time === time);
  });
});