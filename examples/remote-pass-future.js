var drama = require('../')

var sys = drama('sys')
var remote = sys.fork('remote')

var actor = remote.actor('bob', {
  _multiply: function (x, y) {
    this.reply(x * y)
  }
, multiply: function (x, y) {
    this.reply(this.ask(this, '_multiply', x, y))
  }
}).pick('??multiply')

actor.multiply(4, 6, function (result) {
  console.log('result is:', result)
})
