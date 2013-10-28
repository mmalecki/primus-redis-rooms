# primus-redis-rooms
[![Build Status](https://travis-ci.org/mmalecki/primus-redis-rooms.png)](https://travis-ci.org/mmalecki/primus-redis-rooms)

`primus-redis-rooms` is a Redis store for [Primus](https://github.com/primus/primus)
and [`primus-rooms`](https://github.com/cayasso/primus-rooms).

It takes care of distributing messages to other instances using [Redis Pub/Sub](http://redis.io/topics/pubsub).

So, you can have client `A` connected to server `X` in room `foo` and have
server `Y` emit messages to `foo` and client `A` will receive them. Magic.

## Usage

### Single Redis instance
You can use `primus-redis-rooms` with a single Redis instance, but it's not
recommended in production environment, since it makes Redis a single point of
failure.


```js
var http = require('http'),
    Primus = require('primus'),
    PrimusRooms = require('primus-rooms'),
    PrimusRedis = require('primus-redis-rooms');

var server = http.createServer();
var primus = new Primus(server, {
  redis: {
    host: 'localhost',
    port: 6379,
    channel: 'primus' // Optional, defaults to `'primus`'
  },
  transformer: 'websockets'
});
primus.use('rooms', PrimusRooms); // Remember to use rooms first.
primus.use('redis', PrimusRedis);

//
// This'll take care of sending the message to all other instances connected
// to the same Redis channel.
//
primus.write('Hello world!'); 
```

### Sentinel
[Redis Sentinel](http://redis.io/topics/sentinel) is a failover mechanism
built into Redis.

When using Sentinel, Redis client will automatically reconnect to new master
server when current one goes down.

```js
var http = require('http'),
    Primus = require('primus'),
    PrimusRedis = require('primus-redis-rooms');

var server = http.createServer();
var primus = new Primus(server, {
  redis: {
    sentinel: true,
    endpoints: [
      { host: 'localhost', port: 26379 },
      { host: 'localhost', port: 26380 },
      { host: 'localhost', port: 26381 }
    ],
    masterName: 'mymaster'
    channel: 'primus' // Optional, defaults to `'primus`'
  },
  transformer: 'websockets'
});
primus.use('rooms', PrimusRooms); // Remember to use rooms first.
primus.use('redis', PrimusRedis);
