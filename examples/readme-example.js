var drama = require('../')
var sys = drama('sys')

var actor = sys.actor(function (initial) {
  var value = initial
  return {
    set: function (val) {
      value = val
    }
  , get: function () {
      this.reply(value)
    }
  }
})

actor.init('some value')
actor.ask(actor, 'get', function (val) {
  console.log(val) // 'some value'
})

var proxy = actor.pick('?get', 'set')
proxy.set('another value')
proxy.get(function (val) {
  console.log(val) // 'another value'
})

var remote = sys.fork('remote')
var remoteActor = remote.actor({
  ping: function () { this.reply('pong') }
}).pick('?ping')

remoteActor.ping(function (response) {
  console.log(response) // 'pong'
})
