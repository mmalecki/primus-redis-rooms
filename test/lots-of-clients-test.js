var http = require('http');
var assert = require('assert');
var cb = require('assert-called');
var getPrimus = require('./helpers/get-primus.js');
var PORT = 3456;

http.globalAgent.maxSockets = 500;

var server = http.createServer();
var clients = 0;
var primus0, primus1;

function onConnection(spark) {
  spark.join('our-room');
}

function getClient(primus) {
  clients += 3;
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

for (var i = 0; i < 100; i++) {
  getClient(primus0);
  getClient(primus1);
}

setTimeout(function () {
  primus0.room('our-room').write({ hello: 'world' });
  setTimeout(function () {
    primus1.room('our-room').write({ hello: 'world' });

    setTimeout(function () {
      primus0.room('our-room').write({ hello: 'world' });
    }, 50);
  }, 50);
}, 1000);
