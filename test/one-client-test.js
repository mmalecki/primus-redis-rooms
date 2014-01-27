var assert = require('assert');
var cb = require('assert-called');
var getPrimus = require('./helpers/get-primus.js');

var PORT = 3459;
var noop = function () {};

var primus, client;

function onConnection(spark) {
  spark.join('our-room');
}

function getClient(primus) {
  var client = new (primus.Socket)('http://localhost:' + primus.port);

  client.on('open', cb(noop));

  client.on('data', cb(function (msg) {
    assert.deepEqual(msg, { hello: 'world' });
    client.end();
  }));

  primus.on('leave', cb(function onleave(room, spark) {
    assert.equal(room, primus.room('our-room'));
    process.exit();
  }));

  return client;
}

primus = getPrimus(PORT++);
primus.on('connection', cb(onConnection));

client = getClient(primus);

setTimeout(function () {
  primus.room('our-room').write({ hello: 'world' });
}, 100);
