var drama = require('../')

process.once('message', function (setup) {
  var parent = {}
  parent.address = setup.parent
  parent.send = function (message) {
    //console.log('should send', safe(message))
    process.send(sys.utils.safe(message))
  }
  var sys = drama(setup.address, parent)

  sys.create('controller', {
    create: function (address, beh) {
      beh = eval('(' + beh + ')')
      //console.log('should create', address, beh)
      var actor = this.self.create(address, beh)
    }
  , getRegistry: function () {
      this.reply(sys.registry.keys())
    }
  })

  process.on('message', function (message) {
    //console.log('got message from parent:', message)
    sys.deliver(message)
  })
})
