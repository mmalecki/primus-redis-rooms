var assert = require('assert');
var cb = require('assert-called');
var getPrimus = require('./helpers/get-primus.js');

var PORT = 3457;

var clients = 0;
var primus0, primus1;

function onConnection(spark) {
  spark.join('our-room');
}

function getClient(primus) {
  ++clients;
  var client = new (primus.Socket)('http://localhost:' + primus.port);

  client.on('open', cb(function () { }));

  client.on('data', cb(function (msg) {
    assert.deepEqual(msg, { hello: 'world' });
    clients--;
    console.log('clients left', clients);
    if (clients === 0) {
      process.exit();
    }
  }));
}

primus0 = getPrimus(PORT++);
primus1 = getPrimus(PORT++);

primus0.on('connection', cb(onConnection));
primus1.on('connection', cb(onConnection));

var client0 = getClient(primus0);
var client1 = getClient(primus1);

setTimeout(function () {
  primus0.room('our-room').write({ hello: 'world' });
  primus1.room('our-room').write({ hello: 'world' });
}, 100);
