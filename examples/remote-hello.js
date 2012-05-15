var drama = require('../')

var sys = drama('sys')
var remote = sys.fork('remote')

var actor = remote.actor('bob', {
  hello: function () {
    console.log('you:', this.method)
    this.reply('hiya')
  }
}).pick('?hello')

actor.hello(function (reply) {
  console.log('%s: %s', actor.address, reply)
})
