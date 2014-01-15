var http = require('http');
var Primus = require('primus');
var PrimusRedisRooms = require('../../');

module.exports = function getPrimus(port) {
  var server = http.createServer();
  var primus = new Primus(server, {
    redis: {
      host: 'localhost',
      port: 6379
    },
    transformer: 'websockets'
  });
  primus.use('redis', PrimusRedisRooms);

  primus.port = port;
  primus.server = server;
  server.listen(port);
  return primus;
};
