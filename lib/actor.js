var util = require('util')
var EventEmitter = require('events').EventEmitter
var Message = require('./message').Message
var Ref = require('./ref').Ref
var slice = [].slice

function Actor (address, beh) {
  EventEmitter.call(this)

  this.address = address
  if ('string' !== typeof this.address)
    throw new Error('Not a valid address: '
      + util.inspect(this.address))

  this.react(beh)

  this.inbox = []
  this.self = this.ref = new Ref(this)
  this.started = false
  this.running = false
}

util.inherits(Actor, EventEmitter)

Actor.prototype.belongsTo = function (system) {
  system.register(this)
  return this
}

Actor.prototype.setSystem = function (system) {
  if (this.system) this.address = this.address.split('@')[1]
  this.system = system
  this.ref.system = system
  this.address = system.address + '@' + this.address
  this.ref.address = this.address
  return this
}

Actor.prototype.start = function (system) {
  if (system) this.belongsTo(system)
  this.started = true
  this.running = true
  this.on('message', function (message) {
    this.enqueue(message)
  })
  return this
}

Actor.prototype.stop = function () {
  var system = this.system
  this.running = false
  this.system.unregister(this)
  return this
}

Actor.prototype.react =
Actor.prototype.become = function (beh) {
  if ('function' !== typeof beh && 'object' !== typeof beh) {
    throw new Error(this.address + ': Cannot set behavior "'
      + beh + '"')
  }
  this.beh = beh
  return this
}

Actor.prototype.processNext = function (message) {
  var method = message.args[0]
  var messageArgs = message.args.slice(1)
  var fn

  fn = this[method]
  if ('function' === typeof fn) {
    return fn.apply(this, messageArgs)
  }
  else {
    if ('function' === typeof this.beh) fn = this.beh
    else {
      fn = this.beh[method]
      if (!fn) fn = this.beh._ // catch-all
    }
  }

  if ('function' !== typeof fn)
    throw new Error(this.address + ': No action or method exists: "'
      + method + '". Message: ' + util.inspect(message))

  var context = {}

  context.method = method

  for (var k in this.beh) context[k] = this.beh[k]

  for (var k in message) context[k] = message[k]
  context.sender = this.system.ref(context.sender)

  for (var k in this.self) {
    context[k] = 'function' === typeof this.self[k]
      ? this.self[k].bind(this.self)
      : this.self[k]
  }

  context.originalMessage = message.args.join(' ')
  context.self = this.self

  context.reply = function () {
    var args = [].slice.call(arguments)
    args.unshift('__reply__')
    this.send.apply(this, args).to(this.sender)
  }.bind(context)


  var beh = fn.apply(context, messageArgs)

  if (beh) this.react(beh)

  return this
}

Actor.prototype.onUncaughtException = function (fn) {
  this._uncaughtExceptionHandler = fn
}

Actor.prototype._uncaughtExceptionHandler = function (error) {
  throw error
}

Actor.prototype.enqueue = function (message) {
  this.inbox.push(message)
  if (!this.flushing) {
    this.flush()
  }
  return this
}

Actor.prototype.send = function (message) {
  this.emit('message', message)
  return this
}

Actor.prototype.flush = function (callback) {
  var message
  this.flushing = true
  !function next () {
    var message = this.inbox.shift()
    if (!message) throw new Error('Empty message')
    try {
      this.processNext(message)
    } catch (e) { this._uncaughtExceptionHandler(e) }
    if (this.inbox.length) {
      next.call(this)
    }
    else {
      this.flushing = false
      if (callback) callback()
    }
  }.call(this)
  return this
}

exports.Actor = Actor
