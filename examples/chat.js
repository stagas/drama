var drama = require('../')
var sys = drama('sys')
var $ = sys.actor.bind(sys)

var channels = []

var Client = function (socket) {
  var nick

  var Enter = function () {
    socket.write('\nEnter your nickname: ')
    return function (newNick) {
      if (newNick && newNick.length > 2) {
        nick = newNick
        socket.write('Welcome, ' + nick + '!\n')
        socket.write('To enter the main room type: /join main\n')
        return Lobby
      }
      else {
        socket.write('Not a valid nickname (<2 chars)\n')
        return Enter()
      }
    }
  }

  var Lobby = {
    join: function (name) {
      if (!~channels.indexOf(name)) {
        $(name, Channel).init(name)
        channels.push(name)
      }
      var channel = 'sys@' + name
      this.send('join', nick).to(channel)
      return {
        msg: function (msg) {
          this.send('msg', msg, nick).to(channel)
        }
      , echo: function (msg) {
          socket.write(msg + '\n')
        }
      , part: function (msg) {
          this.send('part', msg || 'Bye.', nick).to(channel)
          this.echo('Leaving ' + name)
          return Lobby
        }
      , _: function () {
          this.echo("I don't understand: " + this.originalMessage)
        }
      }
    }
  , _: function () {
      socket.write('You have to join a channel before you can take action.\n')
    }
  }
  return Enter()
}

var Channel = function (name) {
  var clients = {}
  return {
    join: function (nick) {
      clients[nick] = this.sender
      this.broadcast(nick + ' has joined the room.')
    }
  , part: function (msg, nick) {
      delete clients[nick]
      this.broadcast(nick + ' has left the room: ' + msg)
    }
  , msg: function (msg, nick) {
      this.broadcast(nick + ': ' + msg, nick)
    }
  , broadcast: function (msg, nick) {
      for (var k in clients) {
        if (k !== nick) clients[k].tell('echo', msg)
      }
    }
  }
}

var net = require('net')
net.createServer(function (socket) {
  socket.uid = (Math.random() * 100000).toString(36)
  var client = $(socket.uid, Client).init(socket)
  socket.setEncoding('utf8')
  socket.on('data', function (data) {
    if (data[0] === '/') {
      client.tell(data.split(' ')[0].substr(1), data.split(' ').slice(1).join(' '))
    }
    else client.tell('msg', data)
  })
}).listen(6886)
