var drama = require('../')
var sys = drama('sys')

var Pong = function () {
  var pings = 0
  return {
    ping: function () {
      if (!(++pings % 1000)) console.log('ping %d', pings)
      this.send('pong').to(this.sender)
    }
  }
}

var Ping = function (opts) {
  var pings = opts.pings || 10000
  var target = opts.target
  this.send('ping').to(target)
  return {
    pong: function() {
      if (pings--) {
        if (!((opts.pings - pings) % 1000)) console.log('pong %d', opts.pings - pings)
        this.send('ping').to(target)
      }
      else {
        console.log('done')
      }
    }
  }
}

var ponger = sys.fork('ponger')
var pinger = sys.fork('pinger')

var pong = ponger.actor('pong', Pong)
var ping = pinger.actor('ping', Ping)

pong.init()
ping.init({ target: pong, pings: 10000 })
