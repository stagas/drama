var Message = require('./message').Message
var Actor = require('./actor').Actor
var slice = [].slice

function Ref (item, system) {
  this.address = 'object' == typeof item ? item.address : item
  this.system = system
}

;[ 'init', 'start', 'react', 'stop' ].forEach(function (method) {
  Ref.prototype[method] = function () {
    var args = slice.call(arguments)
    args.unshift(method)
    this.tell.apply(this, args)
    return this
  }
})

Ref.prototype.actor =
Ref.prototype.create =
function (address, beh) {
  return this.system.create(address, beh)
}

Ref.prototype.tell = function () {
  var message = new Message(this, slice.call(arguments))
  message.to = this.address
  this.system.deliver(message)
  return this
}

Ref.prototype.send = function () {
  var args = slice.call(arguments)
  this.system._scheduleMessage = new Message(this, args)
  return this
}

Ref.prototype.to = function (receiver) {
  if (this.system._scheduleMessage) {
    this.system._scheduleMessage.to = 'object' === typeof receiver ? receiver.address : receiver
    this.system.deliver(this.system._scheduleMessage)
  }
  else throw new Error('null message scheduled')
  this.system._scheduleMessage = null
  return this
}

Ref.prototype.sendTo = function () {
  var args = slice.call(arguments)
  var receiver = args.shift()
  this.send.apply(this, args).to(receiver)
  return this
}

Ref.prototype.ask = function () {
  var self = this
  var args = slice.call(arguments)
  var callback = 'function' === typeof args[args.length - 1]
        ? args.pop()
        : function () {}
  var receiver = args.shift()
  var sender = this
  var future = this.actor('future-' + (Math.random() * 1000000).toString(36), function () {
    this.send.apply(this, args).to(receiver)
    var listeners = []
    return function () {
      var args = [].slice.call(arguments)
      if ('__when__' === this.method) {
        listeners.push(this)
      }
      else if ('__reply__' === this.method) {
        callback.apply(this, args)
        if (listeners.length) {
          listeners.forEach(function (listener) {
            listener.reply.apply(listener, args)
          })
          this.stop()
        }
        else return function () {
          this.reply.apply(this, args)
          this.stop()
        }
      }
    }
  })
  future.tell('?')
  return future
}

Ref.prototype.when = function (callback) {
  this.ask(this, '__when__', callback)
}

Ref.prototype.pick = function () {
  var self = this
  var args = slice.call(arguments)
  var proxy = {}
  args.forEach(function (method) {
    if (method.substr(0, 2) === '??') {
      method = method.substr(2)
      proxy[method] = function () {
        var _args = slice.call(arguments)
        var cb = _args.pop()
        _args.push(function (future) {
          self.system.ref(future).when(cb)
        })
        _args.unshift(self, method)
        return self.ask.apply(self, _args)
      }
    }
    else if (method.substr(0, 1) === '?') {
      method = method.substr(1)
      proxy[method] = function () {
        var _args = slice.call(arguments)
        _args.unshift(self, method)
        return self.ask.apply(self, _args)
      }
    }
    else {
      proxy[method] = function () {
        var _args = slice.call(arguments)
        _args.unshift(method)
        self.tell.apply(self, _args)
      }      
    }
  })
  proxy.address = this.address
  return proxy
}

exports.Ref = Ref
