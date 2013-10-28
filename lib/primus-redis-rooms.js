var redis = require('redis'),
    sentinel = require('redis-sentinel');

var PrimusRedisRooms = module.exports = function (primus, options) {
  var publishQueue = [],
      subscribed = false,
      adapter = primus._rooms._adapter,
      broadcast = adapter.broadcast,
      sub, pub, channel;

  function getClient() {
    if (options.redis.sentinel) {
      return sentinel.createClient(
        options.redis.endpoints,
        options.redis.masterName,
        options.redis
      );
    }

    return redis.createClient(options.redis);
  }

  channel = options.redis.channel || 'primus';

  pub = getClient();
  sub = getClient();

  sub.subscribe(channel);

  sub.on('message', function (chan, msg) {
    msg = JSON.parse(msg);
    broadcast.call(adapter, msg.data, msg.opts, primus.connections);
  });

  sub.on('subscribe', function () {
    subscribed = true;
    publishQueue.forEach(function (data) {
      pub.publish(channel, data);
    });
    publishQueue.length = 0;
  });

  adapter.broadcast = function (data, opts, clients) {
    var msg = JSON.stringify({ data: data, opts: opts });
    if (subscribed) {
      pub.publish(channel, msg, function (err) {
        if (err) {
          publishQueue.push(data);
          subscribed = false;
        }
      });
      return;
    }
    publishQueue.push(msg);
  };
};

// Hack so that you can `primus.use(require('primus-redis-rooms'))`.
PrimusRedisRooms.server = PrimusRedisRooms;
