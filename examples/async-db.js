var drama = require('../')
var sys = drama('sys')
var atomic = require('atomic')

var db = sys.actor(function () {
  var data = {}
  var lock = atomic()
  return {
    get: function (key) {
      var reply = this.reply.bind(this)
      lock(key, function (done) {
        setTimeout(function () {
          reply(data[key], key)
          done()
        }, 500)
      })
    }
  , set: function (key, val) {
      lock(key, function (done) {
        setTimeout(function () {
          data[key] = val
          done()
        }, 1000)
      })
    }
  }
}).init().pick('?get', 'set')

db.set('foo', 'bar')
db.get('foo', function (val, key) {
  console.log('%s: %s', key, val)
})
