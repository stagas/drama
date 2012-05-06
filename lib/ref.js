var Future = require('./future').Future

function ActorRef (system, address, name) {
  this.system = system
  this.address = address
  this.context = new Context(this)
  this.context.name = name
}

ActorRef.prototype.__defineGetter__('name', function () {
  return this.context.name
})

ActorRef.prototype.__defineSetter__('name', function (s) {
  return (this.context.name = s)
})

ActorRef.prototype.toString = function () {
  return this.context.name + '::' + this.address
}

ActorRef.prototype.create = function (name, behName) {
  return this.system.create(name, behName)
}

ActorRef.prototype.tell = function (receiver, message, isProxy) {
  if (!(receiver instanceof ActorRef)) {
    message = receiver
    receiver = this
  }
  if (isProxy) {
    message.replyTo = this
    message.sender = message.sender || this
  }
  else {
    message.sender = this
  }

/*
  console.log(
      pad(message.sender.toString().grey + ' > '.green, 53)
    + pad(receiver.toString().white
      , 35).l
    + pad('.'.white + message._.cyan + '(' + (util.inspect(message.$ || '') || ' ').yellow + ')'
      , 53).r
    + ( message.replyTo ? ' replyTo'.red + ': '.yellow
      + (message.replyTo && message.replyTo.toString().cyan || '')
      + ' <?'.red
      : '' )
    )*/

  this.system.send(receiver, message)
}

ActorRef.prototype.ask = function (receiver, message) {
  if (!(receiver instanceof ActorRef)) {
    message = receiver
    receiver = this
  }
  message.sender = this

  var future = new Future()
  this.system.registry.add(future)
  var futureRef = new ActorRef(this.system, future.address, 'future@' + receiver)
  future.context = futureRef.context
  futureRef.tell(receiver, message, true)
  return future
}

ActorRef.prototype.exec = function (method, value) {
  return this.ask({ _: method, $: value })
}

ActorRef.prototype.init = ActorRef.prototype.start = function (opts) {
  this.tell({ _: 'init', $: opts })
}

ActorRef.prototype.become = function (clas) {
  this.tell({ _: 'become', $: clas })
}

ActorRef.prototype.stop = function () {
  this.tell({ _: 'stop' })
}

ActorRef.prototype.destroy = function () {
  this.system.destroy(this)
}

exports.ActorRef = ActorRef

function Context (ref) {
  this.self = ref
  this.ref = ref
}

function pad (s,l,c,u){c=new Array((l=(l||0)-(''+s).length+1)>0&&l||0).join(c!=u?c:' ');return {l:c+s,r:s+c,toString:function(){return c+s}}}
