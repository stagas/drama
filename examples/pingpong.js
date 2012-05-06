var ActorSystem = require('../').ActorSystem

var sys = new ActorSystem

var pong = sys.create('pong')
pong.become({
  init: function () {
    this.pongCount = 0
  }
, ping: function (value, reply) {
    if (this.pongCount % 1000 == 0) {
      console.log("Pong: ping "+this.pongCount)
    }
    this.sender.tell({ _: 'pong' })
    this.pongCount = this.pongCount + 1
  }
})
pong.init()

var ping = sys.create('ping')
ping.become({
  init: function () {
    this.pingsLeft = 10000
    this.self.tell(pong, { _: 'ping' })
  }
, pong: function () {
    if (this.pingsLeft % 1000 == 0) {
      console.log("Ping: pong")
    }
    if (this.pingsLeft > 0) {
      this.self.tell(pong, { _: 'ping' })
      this.pingsLeft -= 1
    } else {
      console.log("Ping: stop")
      pong.stop()
      this.self.stop()
    }
  }
})

ping.init()
