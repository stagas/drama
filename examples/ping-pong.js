var drama = require('../')
var sys = drama('sys')

var PingPong = function () {
  var i = 0
  var me = this.self.pick('ping', 'pong')
  var Ping = {
    ping: function () {
      console.log('ping')
      if (++i > 100) {
        console.log('finished')
        return
      }
      me.pong()
      return Pong
    }
  }
  var Pong = {
    pong: function () {
      console.log('pong')
      me.ping()
      return Ping
    }
  }
  return Ping
}

var pingPong = sys.actor('ping-pong', PingPong).init().pick('ping')
pingPong.ping()
