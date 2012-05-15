var drama = require('../')
var sys = drama('sys')
var nextTick = require('nexttick')

var Db = function (isChild) {
  var atomic = require('atomic')
  var crypto = require('crypto')

  function hash (key) {
    return crypto.createHash('sha1').update(key).digest('hex')
  }

  var data = {}
  var lock = atomic()
  var workers = {}
  var w = 0

  var Child = {
    get: function (key) {
      var reply = this.reply.bind(this)
      lock(key, function (done) {
        setTimeout(function () { // simulate an async db get function
          reply(data[key])
          done()
        }, 50)
      })
    }
  , set: function (key, val) {
      lock(key, function (done) {
        setTimeout(function () { // simulate an async db set function
          data[key] = val
          done()
        }, 300)
      })
    }
  }

  var Router = {
    get: function (key) {
      var reply = this.reply.bind(this)
      workers[hash(key).substr(0, 1)].get(key, function (val) {
        reply(val, key)
      })
    }
  , set: function (key, val) {
      workers[hash(key).substr(0, 1)].set(key, val)
    }
  }

  var Master = function () {
    ;'abcdefghijklmnopqrstuvwxyz0123456789'.split('').forEach(function (l) {
      var worker = sys.fork('remote-' + l)
        .actor('worker-' + l, Db)
        .init(true)
        .pick('?get', 'set')
      workers[l] = worker
    })
    return Router
  }

  if (isChild) return Child
  else return Master
}

var db = sys.actor('db', Db).init().init().pick('?get', 'set')

var x = 0, y = 0
nextTick.while(function () { return ++y < 100 }, function () {
  for (var x = 0; x < 100; x++) {
    db.set('foo-' + y, 'bar-' + x)
    db.get('foo-' + y, function (val, key) {
      console.log('%s: %s', key, val)
    })
  }
})
