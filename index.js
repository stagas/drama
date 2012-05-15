/**
 * drama
 */

var ActorSystem = require('./lib/system').ActorSystem
var Actor = require('./lib/actor').Actor
var Ref = require('./lib/ref').Ref
var Message = require('./lib/message').Message
var Registry = require('./lib/registry').Registry

exports = module.exports = ActorSystem

exports.ActorSystem = ActorSystem
exports.Actor = Actor
exports.Ref = Ref
exports.Message = Message
exports.Registry = Registry

exports.actor = function (address, beh) {
  return new Actor(address, beh)
}
