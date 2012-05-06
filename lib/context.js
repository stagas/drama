var Props = require('./props')

function Context (ctx) {
  this.children = new Registry()
  this.parent = ctx.parent
  this.props = ctx.props
  this.self = ctx.self
  this.sender = ctx.sender
}

Context

Context.prototype.stop = function (actorRef, callback) {
  actorRef.stop(callback)
}