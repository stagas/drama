var drama = require('../')
var sys = drama('sys')

var actor = sys.actor({
  hello: function () {
    this.reply('hello back')
  }
}).pick('?hello')

actor.hello(function (reply) {
  console.log(reply)
})
