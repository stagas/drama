var express = require('express')
var expose = require('express-expose')
var simpl = require('simpl')
var drama = require('../')

var util = require('util')
var sys = drama('sys')
var app = express.createServer()
var ws = simpl.createServer(app)

app.exposeRequire()
app.expose({}, 'child_process')
app.expose({ inspect: function () {}, inherits: util.inherits }, 'util')
app.exposeModule(require.resolve('tosource'), 'tosource')
app.exposeModule(require.resolve('../lib/system'), 'lib/system')
app.exposeModule(require.resolve('../lib/actor'), 'lib/actor')
app.exposeModule(require.resolve('../lib/ref'), 'lib/ref')
app.exposeModule(require.resolve('../lib/message'), 'lib/message')
app.exposeModule(require.resolve('../lib/registry'), 'lib/registry')
app.exposeModule(require.resolve('../'), 'drama')

ws.use(simpl.sid())
ws.use(simpl.json())

var Mouse = function () {
  var x = 0, y = 0, ox = x, oy = y, dirty = false
  window.onmousemove = function (e) {
    x = e.clientX
    y = e.clientY
    if (x != ox || y != oy) {
      dirty = true
      ox = x
      oy = y
    }
  }
  return {
    subscribe: function () {
      var self = this
      setInterval(function () {
        if (dirty) {
          self.sender.tell('pos', [ x, y ])
          dirty = false
        }
      }, 100)
    }
  }
}

var RemoteMouseProxy = function (mouseId) {
  var div = document.createElement('div')
  div.classList.add('mouse')
  div.style.background = '#' + mouseId
  document.body.appendChild(div)
  var xy = [ 0, 0 ]
  var v = [ 0, 0 ]
  var t = [ 0, 0 ]
  var drawInterval = setInterval(function () {
    v[0] += (t[0] - xy[0]) * 0.004
    v[1] += (t[1] - xy[1]) * 0.004
    xy[0] += v[0]
    xy[1] += v[1]
    div.style.left = xy[0] + 'px'
    div.style.top = xy[1] + 'px'
    v[0] *= 0.95
    v[1] *= 0.95
  }, 10)
  return {
    pos: function (_xy) {
      t[0] = _xy[0]
      t[1] = _xy[1]
    }
  , die: function () {
      document.body.removeChild(div)
      clearInterval(drawInterval)
      this.stop()
    }
  }
}

var LocalMouseProxy = function () {
  var xy = [ 0, 0 ]
  var dirty = false
  var listeners = []
  return {
    pos: function (_xy) {
      xy[0] = _xy[0]
      xy[1] = _xy[1]
      dirty = true
    }
  , publish: function () {
      if (dirty) {
        dirty = false
        listeners.forEach(function (actor) {
          actor.tell('pos', xy)
        })
      }
    }
  , subscribe: function () {
      listeners.push(this.sender)
      this.sender.tell('pos', xy)
    }
  , die: function () {
      listeners.forEach(function (actor) {
        actor.tell('die')
      })
      this.stop()
    }
  }
}

var localMice = sys.actor(function () {
  var self = this
  var mice = []
  setInterval(function () {
    self.tell('sync')  
  }, 100)
  return {
    add: function (mouse) {
      mice.push(mouse)
    }
  , remove: function (mouse) {
      var idx = mice.indexOf(mouse)
      if (~idx) mice.splice(idx, 1)
    }
  , sync: function () {
      mice.forEach(function (mouse) {
        mouse.tell('publish')
      })
    }
  }
}).init()

var players = {}

ws.on('connection', function (socket) {
  var player = players[socket.id] = socket

  player.remote = sys.fork('websocket-' + socket.id, socket)

  socket.on('close', function () {
    player.localMouse.tell('die')
    localMice.tell('remove', player.localMouse)
    delete players[socket.id]
  })

  setTimeout(function () {
    player.mouse = socket.remote.actor(Mouse)

    player.mouseId = [0,0,0].map(function () { return (Math.random() * 16 | 0).toString(16) }).join('')
    player.mouse.init()

    player.localMouse = sys.actor(LocalMouseProxy).init()
      .send('subscribe').to(player.mouse)

    localMice.tell('add', player.localMouse)

    player.remote.actor(RemoteMouseProxy).init(player.mouseId)
      .send('subscribe').to(player.localMouse)

    Object.keys(players).forEach(function (k) {
      if (k === socket.id) return
      
      players[k].remote.actor(RemoteMouseProxy).init(player.mouseId)
        .send('subscribe').to(player.localMouse)
      
      player.remote.actor(RemoteMouseProxy).init(players[k].mouseId)
        .send('subscribe').to(players[k].localMouse)
    })
  }, 1000)
})

var clientJs = require('fs').readFileSync(__dirname + '/websocket-client.js', 'utf8')

app.get('/', function (req, res) {
  res.write('<script>process = { argv: [] };' + app.exposed() + '</script>')
  res.write(clientJs)
  res.end()
})

app.listen(8080, 'localhost')
