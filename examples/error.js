var drama = require('../')
var sys = drama('sys')

var actor = sys.actor({
  hello: function () {
    throw new Error('Some error!')
  }
})

actor.tell('onUncaughtException', function (e) {
  console.error('Got error:', e.message)
  console.error(e.stack)
}).tell('hello')
