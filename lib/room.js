var util = require('util');
var Writable = require('stream').Writable;

var Room = module.exports = function (options) {
  var self = this;

  if (typeof options.name !== 'string') {
    throw new TypeError('`options.name` is required');
  }

  this.name = options.name;
  this.sparks = options.sparks || [];
  this.pub = options.redis.pub;
  this.channel = options.redis.channel;
};
util.inherits(Room, Writable);

Room.prototype._write = function (data) {
  this.redis.pub.publish(JSON.stringify({ room: this.name, data: data }));
};

Room.prototype.__write = function (data) {
  var self = this;

  self.sparks.forEach(function (spark) {
    spark.__write(data);
  });
};

Room.prototype.join = function (spark) {
  this.sparks.push(spark);
  spark._rooms.push(this);
  return this;
};

Room.prototype.leave = function (spark) {
  var index = this.sparks.indexOf(spark);
  if (index !== -1) {
    this.sparks.splice(index, 1);
  }

  index = spark._rooms.indexOf(this);
  if (index !== -1) {
    spark._rooms.splice(index, 1);
  }

  if (this.sparks.length === 0) {
    this.emit('empty');
  }

  return this;
};
