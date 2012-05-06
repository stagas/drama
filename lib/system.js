var util = require('util')
var clone = require('clone')
var Registry = require('./registry').Registry
var Actor = require('./actor').Actor
var EventEmitter = require('events').EventEmitter
var ActorRef = require('./ref').ActorRef
require('colors')

function ActorSystem (opts) {
  opts = opts || {}

  EventEmitter.call(this)

  this.name = opts.name || uid()
  this.behs = {}
  this.registry = new Registry()
}

util.inherits(ActorSystem, EventEmitter)

ActorSystem.prototype.define = function (behName, beh) {
  this.behs[behName] = beh
}

ActorSystem.prototype.create = function (name, behName) {
  var actor = new Actor()

  this.registry.add(actor)

  var actorRef = new ActorRef(this, actor.address, name)

  actor.context = actorRef.context

  var beh = this.behs[behName]
  if (beh) actorRef.become(beh)

  return actorRef
}

ActorSystem.prototype.send = function (actorRef, message) {
  var actor = this.registry.get(actorRef.address)
  if (actor) {
    var env = new Envelope(actor, message)
    actor.send(env)
  }
}

ActorSystem.prototype.destroy = function (actorRef) {
  this.registry.remove(actorRef.address)
}

// utils

function uid () {
  return Math.floor(Math.random () * Date.now() * 10000).toString(36)
}

function Envelope (actor, message) {
  this.value = message
  this.context = actor.context
}

exports.ActorSystem = ActorSystem
