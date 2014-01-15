var assert = require('assert');
var cb = require('assert-called');
var getPrimus = require('./helpers/get-primus.js');
var PORT = 3459;
var ROOM = 'our-room';

var primus = getPrimus(PORT++);
var client;

function onConnected(spark) {
  var room;

  spark.join(ROOM);

  room = primus.room(ROOM);

  primus.on('leave', cb(function (room_, spark_) {
    assert.equal(room, room_, '`leave` event should have correct `room` param');
    assert.equal(spark, spark_, '`leave` event should have correct `spark` param');
  }));

  room.on('empty', cb(function () {
    assert.equal(room.sparks.length, 0, 'room should emit `empty` only when empty');

    primus.server.close();
    spark.end();
    client.end();

    process.exit(); // XXX WTF is keeping the process up here?!
  }));

  assert.equal(spark._rooms[0], room, 'spark should join room correctly');
  assert.equal(room.sparks[0], spark, 'spark should be added to room');

  spark.join(ROOM);
  assert.equal(spark._rooms.length, 1, 'spark shouldn\'t be added twice');
  assert.equal(room.sparks.length, 1, 'spark shoudn\'t be added twice');

  spark.leave(ROOM);
  assert.equal(spark._rooms.length, 0, 'spark should be removed correctly');
  assert.equal(room.sparks.length, 0, 'spark should be removed correctly from the room');
}

function getClient(primus) {
  var client = new (primus.Socket)('http://localhost:' + primus.port);
  return client;
}

primus.on('connection', cb(onConnected));

client = getClient(primus);
