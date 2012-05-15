/**
 * Port of the Akka first tutorial
 * Distributed PI calculator
 */

var drama = require('../')
var sys = drama('sys')
var $ = sys.actor.bind(sys)

var PiWorker = function () {
  var it = 0
  return {
    calculatePiFor: function (m) {
      var acc = 0.0
      for (var i = m.start; i < m.start + m.elements; i++) {
        acc += 4.0 * (1 - (i % 2) * 2) / (2 * i + 1)
      }
      it += m.elements
      this.reply(acc)
    }
  , getPiPiece: function (needed) {
      var ctx = this
      var self = this.self
      var piPiece = 0
      var count = needed.pieces.length
      if (!count) ctx.reply(0)
      else {
        needed.pieces.forEach(function (piece) {
          self.actor().ask(self, 'calculatePiFor', { start: piece, elements: needed.elements }, function (result) {
            piPiece += result
            --count || ctx.reply(piPiece)
          })
        })
      }
    }
  }
}

var piCalculator = sys.actor('pi calculator', function (opts) {
  var numOfWorkers = opts.workers
  var workers = []
  var threads = new Array(opts.threads)
  for (var t = 0; t < opts.threads; t++) {
    threads[t] = sys.fork('thread-' + t)
    for (var w = 0, actor; w < numOfWorkers; w++) {
      actor = threads[t].actor('pi-t' + t + '-w' + w, PiWorker) //, function (actor) {
      actor.init()
      workers.push(actor)
    }
  }
  var totalWorkers = workers.length
  var startTime = Date.now()
  return {
    calculate: function (elements) {
      var pi = 0
      var nrOfResults = 0
      var count = elements
      var ctx = this

      var c = 0
      var w = 0
      var needed = {}
      for (var i = 0; i < count; i++) {
        if (++w >= totalWorkers) w = 0
        needed[w] = needed[w] || []
        needed[w].push(i * elements)
      }

      count = totalWorkers
      for (var w in needed) {
        $().ask(workers[w], 'getPiPiece', {
          elements: elements
        , pieces: needed[w] }, function (result) {
          pi += result
          --count || ctx.reply(pi, Date.now() - startTime)
        })
      }
    }
  }
})

piCalculator.init({ threads: 3, workers: 2 })
$().ask(piCalculator, 'calculate', 10000, function (pi, time) {
  console.log('Pi approximation:', pi)
  console.log('Time to finish:', time)
})

