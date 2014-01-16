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
  this.channel = options.channel;

  Writable.call(this, { objectMode: true });
};
util.inherits(Room, Writable);

Room.prototype._write = function (data, enc, callback) {
  var d = { room: this.name, data: data };
  this.__write(data);
  this.pub.publish(this.channel, JSON.stringify(d));
  callback(); // TODO - put this somewhere else
  return true;
};

Room.prototype.__write = function (data) {
  var self = this;

  self.sparks.forEach(function (spark) {
    spark.write(data);
  });
};

Room.prototype.join = function (spark) {
  if (this.sparks.indexOf(spark) === -1) {
    this.sparks.push(spark);
    spark._rooms.push(this);
  }
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

  spark.primus.emit('leave', this, spark);

  if (this.sparks.length === 0) {
    this.emit('empty');
  }

  return this;
};

Room.prototype.clients = function () {
  return this.sparks;
};
