var ActorSystem = require('../').ActorSystem

var system = new ActorSystem()
system.define('Slave', {
  greetings: function (name, reply, next) {
    var self = this
    this.self.ask(counter, { _: 'inc' }).when(function () {
      self.self.ask(counter, { _: 'get' }).when(function (val) {
        self.name = self.name + '-' + val
        reply('Salut ' + name + '! We are ' + val + '! I am ' + self.name)
        next()
      })
    })
  }
})

var slaves = [];

for (var i = 10; i--;) {
  slaves.push(system.create('slave', 'Slave'))
}

var counter = system.create('counter')
var one = system.create('one')

counter.become({
  init: function () {
    this.count = 0
  }
, get: function (m, reply) {
    reply(this.count)
  }
, inc: function (m, reply, next) {
    this.self.ask({ _: 'get' }).when(function (count) {
      reply()
      next(function () {
        this.count = 1 + count
      })
    })
  }
})
counter.init()

var master = system.create('master')
master.init()

slaves.forEach(function (slave) {
  master.ask(slave, { _: 'greetings', $: master.name }).when(function (reply) {
    console.log(reply)
    console.log(slave.name)
  })
})
