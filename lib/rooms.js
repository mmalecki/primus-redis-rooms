var Room = require('./room');

var Rooms = module.exports = function (options) {
  var self = this;

  this.rooms = {};
  this.redis = options.redis;

  // So this is a bit of a hack. This should be done in each particular room,
  // *however* this solution is more optimal, since it only sets one listener
  // instead of `n` of them.
  this.redis.sub.on('message', function (channel, chunk) {
    var room;

    if (channel !== self.redis.channel) {
      return;
    }

    try {
      chunk = JSON.parse(chunk);
    }
    catch (err) {
    }

    room = self.rooms['+' + chunk.room];
    if (room) {
      room.__write(chunk);
    }
  });
};

Rooms.prototype.room = function (name) {
  var self = this;
  var room = self.rooms['+' + name];

  if (room) {
    return room;
  }

  room = new Room({ name: name, redis: this.redis });
  self.rooms['+' + name] = room;

  room.once('empty', function () {
    self.remove(roomObj);
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
    room = self.rooms['+' + room];
    if (room) {
      room.leave(spark);
    }
  });
};
