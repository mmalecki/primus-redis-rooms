module.exports = function (Spark) {
  var initialize = Spark.prototype.initialize;

  Spark.prototype.initialize = function () {
    this._rooms = [];
    this.once('end', this.leaveAll);
    initialize.apply(this, arguments);
  };

  ['join', 'leave', 'leaveAll'].forEach(function (key) {
    Spark.prototype[key] = function () {
      var args = [ arguments[0] ];
      var rooms = this.primus.rooms;
      args.unshift(this);
      return rooms[key].apply(rooms, args);
    };
  });
};
