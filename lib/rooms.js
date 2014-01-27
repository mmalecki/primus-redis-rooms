var Room = require('./room');
var uuid = require('node-uuid');

var Rooms = module.exports = function (options) {
  var self = this;

  this.rooms = {};
  this.id = uuid.v4();
  this.redis = options.redis;

  var prefix = (options.redis.channel || 'primus') + '.';
  var pattern = prefix + '*';
  this.channel = prefix + this.id;

  this.redis.sub.psubscribe(pattern);

  // So this is a bit of a hack. This should be done in each particular room,
  // *however* this solution is more optimal, since it only sets one listener
  // instead of `n` of them.
  this.redis.sub.on('pmessage', function (pattern_, channel, chunk) {
    var room;

    if (pattern !== pattern_ || channel === self.channel) {
      // We already wrote to our own sparks.
      return;
    }

    try {
      chunk = JSON.parse(chunk);
    }
    catch (err) {
    }

    room = self.rooms['+' + chunk.room];
    if (room) {
      room.__write(chunk.data);
    }
  });
};

Rooms.prototype.room = function (name) {
  var self = this;
  var room = self.rooms['+' + name];

  if (room) {
    return room;
  }

  room = new Room({ name: name, redis: this.redis, channel: this.channel });
  self.rooms['+' + name] = room;

  room.once('empty', function () {
    self.remove(room);
    room = null;
  });

  return room;
};

Rooms.prototype.join = function (spark, room) {
  if (typeof room === 'object') {
    return room.join(spark);
  }

  return this.room(room).join(spark);
};

Rooms.prototype.leave = function (spark, room) {
  if (typeof room === 'object') {
    return room.leave(spark);
  }

  room = this.rooms['+' + room];
  if (room) {
    return room.leave(spark);
  }
};

Rooms.prototype.remove = function (room) {
  delete this.rooms['+' + room.name];
};

Rooms.prototype.leaveAll = function (spark) {
  var self = this;

  spark._rooms.forEach(function (room) {
    room.leave(spark);
  });
};
