var util = require('util')

function uid () {
  return Math.floor(Math.random() * Date.now() * 10000).toString(36)
}

function Actor () {
  this.address = uid()
  this.mailbox = []

  this.running = true
  this._locked = {}
  this._flushing = false
  this._reading = false

  this.beh = {
    init: function () {}
  }
}

Actor.prototype.__defineGetter__('name', function () {
  return this.context.name
})

Actor.prototype.toString = function () {
  return this.context.name + ':' + this.address
}

Actor.prototype.isLocked = function (actorRef) {
  if (!actorRef || !actorRef.address) return false
  return !!this._locked[actorRef.address]
}

Actor.prototype.lock = function (actorRef) {
  if (!actorRef || !actorRef.address) return false
  if (this._locked[actorRef.address]) throw new Error('Attempt to lock twice')
  this._locked[actorRef.address] = true
  //console.log('%s locked %s', this, actorRef)
}

Actor.prototype.unlock = function (actorRef) {
  if (!actorRef || !actorRef.address) return false
  if ('undefined' === typeof this._locked[actorRef.address]) throw new Error('No lock existing like that')
  if (!this._locked[actorRef.address]) throw new Error('Attempt to unlock twice')
  this._locked[actorRef.address] = false
  //console.log('%s unlocked %s', this, actorRef)

  // possible memory leak, it should delete
  // but it would be less costly to
  // keep the same memory position
  // perhaps a garbage collector of last access time
  // would work here
}

Actor.prototype.become = function (beh) {
  this.beh = beh
}

Actor.prototype.processNext = function () {
  var self = this
  !function read () {
    var env = self.mailbox[0]
    if (!env) return
    //console.log('locked' + env.value.sender)
    if (self.isLocked(env.value.sender)) return //process.nextTick(read)
    self.mailbox.shift()
    self.lock(env.value.sender)
    self.receive(env.value)
  }()
}

Actor.prototype.receive = function (message) {
  var replyfn
  if ('object' === typeof message && '_' in message) {
    if (message.sender) {
      this.context.sender = message.sender
    }
    if (message.replyTo) {
      replyfn = function (m) {
        message.replyTo.tell({ _: 'fulfill', $: m })
      }
    }

    // standard behavior
    if ('become' === message._) {
      this.become(message.$)
      this.unlock(message.sender)
      return
    }
    else if ('stop' === message._) {
      this.stop()
      this.unlock(message.sender)
      return
    }

    var method = this.beh[message._]

    if (!method && message._ === 'init') method = function () {}
    if (!method) {
      console.log(this)
      throw new Error('No such method ' + message._ + ' ' + util.inspect(message.$))
    }
    var handle = function handle (val) {
      if (len <= 2) {
        var fn = method.call(this.context, val, replyfn)
        fn && fn.call(this.context)
        this.unlock(message.sender)
        return
      }
      else {
        method.call(this.context, val, replyfn, function (fn) {
          fn && fn.call(this.context)
          this.unlock(message.sender)
        }.bind(this))
      }
    }.bind(this)

    var len = method.length
    if ('object' === typeof message.$ && message.$.isFuture) {
      message.$.when(function (val) {
        handle(val)
      })
    }
    else handle(message.$)

  } else {
    //
  }
}

Actor.prototype.flush = function (callback) {
  var self = this
  if (this._flushing) return callback && callback.call(self.context)
  this._flushing = true
  !function next () {
    if (self.reading) return

    self.reading = true
    self.processNext()
    self.reading = false

    if (self.mailbox.length) next()
    else {
      self._flushing = false
      callback && callback.call(self.context)
    }
  }()
}

Actor.prototype.send = function (env) {
  if (!this.running) return
  this.mailbox[this.isLocked(env.sender) ? 'unshift' : 'push'](env)
  this.flush()
}

Actor.prototype.stop = function () {
  var self = this
  this.running = false
  this.flush(function () {
    self.context.self.destroy()
  })
}

exports.Actor = Actor
