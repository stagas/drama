var util = require('util')
var Actor = require('./actor').Actor

function Future () {
  Actor.call(this)
  
  var self = this

  this.isFuture = true
  this.fulfilled = false
  this.value = null
  this.listeners = []

  this.beh = {
    fulfill: function (value) {
      self.value = value
      self.fulfilled = true
      if (!self.listeners.length) return
      self.listeners.forEach(function (fn) {
        fn(value)
      })
      this.self.stop()
    }
  }
}

util.inherits(Future, Actor)

Future.prototype.when = function (fn) {
  if (!this.fulfilled) {
    this.listeners.push(fn)
  } else {
    fn(this.value)
    this.context.self.stop()
  }
}

exports.Future = Future
