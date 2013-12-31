var http = require('http');
var assert = require('assert');
var Primus = require('primus');
var cb = require('assert-called');
var PrimusRedisRooms = require('../');
var PORT = 3456;

http.globalAgent.maxSockets = 500;

var server = http.createServer(),
    primus0, primus1,
    clients = 0;

function getPrimus() {
  var server = http.createServer();
  var primus = new Primus(server, {
    redis: {
      host: 'localhost',
      port: 6379
    },
    transformer: 'websockets'
  });
  primus.use('redis', PrimusRedisRooms);

  primus.on('connection', function (spark) {
    spark.join('our-room');
  });

  primus.port = PORT;
  server.listen(PORT++);
  return primus;
}

function getClient(primus) {
  clients += 3;
  var client = new (primus.Socket)('http://localhost:' + primus.port);

  client.on('open', cb(function () { }));

  client.on('data', cb(function (msg) {
    assert.deepEqual(msg, { room: 'our-room', data: { hello: 'world' } });
    clients--;
    console.log('clients left', clients);
    if (clients === 0) {
      process.exit();
    }
  }));
}

primus0 = getPrimus();
primus1 = getPrimus();

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
