var http = require('http'),
    assert = require('assert'),
    Primus = require('primus'),
    PrimusRooms = require('primus-rooms'),
    cb = require('assert-called'),
    PrimusRedisRooms = require('../'),
    PORT = 3456;

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
  primus.use('rooms', PrimusRooms);
  primus.use('redis', PrimusRedisRooms);

  primus.on('connection', function (spark) {
    spark.join('our-room');
  });

  primus.port = PORT;
  server.listen(PORT++);
  return primus;
}

function getClient(primus) {
  ++clients;
  var client = new (primus.Socket)('http://localhost:' + primus.port);
  client.on('open', cb(function () {
    console.log('client open');
  }));
  client.on('data', cb(function (msg) {
    console.log('client got message');
    assert.equal(msg, 'Hello world');
    client.end();
    if (--clients === 0) {
      process.exit();
    }
  }));
}

primus0 = getPrimus();
primus1 = getPrimus();
getClient(primus0);
getClient(primus1);
primus0.room('our-room').write('Hello world');
