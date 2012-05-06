/**
 * Port of the Akka first tutorial
 * Distributed PI calculation
 */

var ActorSystem = require('../').ActorSystem

var sys = new ActorSystem

sys.define("PiWorker", {
  calculatePiFor: function (m, reply) {
    var acc = 0.0
    for (var i = m.start; i < m.start + m.nrOfElements; i++) {
      acc += 4.0 * (1 - (i % 2) * 2) / (2 * i + 1)
    }
    reply(acc)
  }
, work: function (m) {
    var sender = this.sender
    this.sender.tell({ _: 'result'
      , $: this.self.ask({ _: 'calculatePiFor', $: m })
    })
  }
})

var master = sys.create('pi calculator')

master.become({
  init: function (opts) {
    this.nrOfWorkers = opts.nrOfWorkers
    this.workers = []
    for (var w = 0; w < this.nrOfWorkers; w++) {
      this.workers.push(this.self.create("pi-w", "PiWorker"))
    }
    this.startTime = Date.now()
  }
, calculate: function (opts) {
    var i = 0
    this.pi = 0
    this.nrOfResults = 0
    this.nrOfElements = opts.nrOfElements
    this.nrOfMessages = opts.nrOfMessages   
    while (i < this.nrOfMessages) {
      for (var w = 0; w < this.nrOfWorkers; w++) {
        this.self.tell(this.workers[w], { _: 'work', $: {
          start: (i++) * this.nrOfElements
        , nrOfElements: this.nrOfElements
        }})
      }
    }
  }
, result: function (val) {
    this.pi += val
    this.nrOfResults++
    if (this.nrOfResults === this.nrOfMessages) {
      console.log('Pi approximation:', this.pi)
      console.log('Calculation time:', Date.now() - this.startTime)
    }
  }
})

master.init({ nrOfWorkers: 4 })
master.tell({ _: 'calculate', $: { nrOfElements: 10000, nrOfMessages: 10000 } })
