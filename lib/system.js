var util = require('util')
var EventEmitter = require('events').EventEmitter
var cp = require('child_process')

var Registry = require('./registry').Registry
var Actor = require('./actor').Actor
var Ref = require('./ref').Ref

var toSource = require('tosource')

function ActorSystem (address, parent) {
  if (!(this instanceof ActorSystem)) return new ActorSystem(address, parent)
  EventEmitter.call(this)

  this.address = address
  this.registry = new Registry(this)
  this.router = new Registry(this)
  this.parent = parent
  if (this.parent) this.router.add(this.parent)
  this.utils = utils
}

util.inherits(ActorSystem, EventEmitter)

ActorSystem.prototype.register = function (actor) {
  actor.setSystem(this)
  this.registry.add(actor)
}

ActorSystem.prototype.unregister = function (actor) {
  this.registry.remove(actor)
}

ActorSystem.prototype.deliver = function (message) {
  if (process.argv[2] === 'debug') {
    console.log('%s %s: %s', message.sender, message.to, message.args
      .map(function (el) { return util.inspect(el).substr(0,30) }).join(' '))
  }
  var target = message.to.split('@')
  if (target.length < 2) {
    throw new Error('Target system missing: '
      + message.to)
  }

  if (this.address === target[0]) {
    this.registry.get(message.to).send(message)
  }
  else if (this.router.has(target[0])) {
    this.router.get(target[0]).send(message)
  }
  else if (this.parent) {
    this.parent.send(message)
  }
  else {
    throw new Error(this.address + ': Don\'t know what to do with: '
      + '"' + target[0] + '". Message: ' + util.inspect(message))
  }
}

ActorSystem.prototype.ref = function (item) {
  return new Ref(item, this)
}

ActorSystem.prototype.fork = function (address) {
  var sys = this
  var child = cp.fork(__dirname + '/worker.js')
  
  var remote = {}
  
  remote.address = address
  remote.child = child
  remote.send = function (message) {
    //console.log('safe:', safe(message))
    this.child.send(utils.safe(message))
  }

  remote.ctrl = remote.controller = sys.ref(remote.address + '@controller').pick('create', '?getRegistry')
  
  remote.actor =
  remote.create = function (address, beh) {
    if ('string' !== typeof address) {
      beh = address
      address = utils.uid()
    }
    remote.controller.create(address, toSource(beh))
    return sys.ref(remote.address + '@' + address)
  }

  this.router.add(remote)

  remote.child.on('message', function (message) {
    //console.log('got message from child', message)
    sys.deliver(message)
  })

  remote.send({ address: address, parent: this.address })

  return remote
}

ActorSystem.prototype.actor =
ActorSystem.prototype.create =
function () {
  var opts = parseArgs([].slice.call(arguments))
  return new Actor(opts.address, opts.beh).start(this).ref
}

function parseArgs (args) {
  var address = args[0]
  var beh = args[1]
  
  if ('object' === typeof address || 'function' === typeof address) {
    beh = address
    address = utils.uid()
  }

  return { address: address || utils.uid(), beh: beh || {} }
}

exports.ActorSystem = ActorSystem

/* utils */

var utils = exports.utils = {}

utils.safe = function safe (o, isArray) {
  var s = null == isArray ? {} : new Array(isArray)
  for (var k in o) {
    if (o[k] instanceof Actor || o[k] instanceof Ref || o[k] instanceof ActorSystem) {
      s[k] = o[k].address
    }
    else if (Array.isArray(o[k])) {
      s[k] = safe(o[k], o[k].length)
    }
    else if ('object' === typeof o[k]) {
      s[k] = safe(o[k])
    }
    else s[k] = o[k]
  }
  return s
}

utils.uid = function uid () {
  return Math.floor(Math.random () * Date.now() * 10000).toString(36)
}
