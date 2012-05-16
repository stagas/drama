<style>
html { width:100%; height: 100%; overflow:hidden; }
body {
  margin:0;
  padding:0;
  background:#000;
}
.mouse {
  position:absolute;
  margin-left:-10px;
  margin-top:-10px;
  width:20px;
  height:20px;
  border-radius:1000px;
  background:#a39;
}
</style>
<script src='/simpl.js'></script>
<script>

var simpl = require('simpl')
var drama = require('drama')
var client = simpl.createClient()

client.use(simpl.json())

client.once('message', function (setup) {
  var parent = {}
  parent.address = setup.parent
  parent.send = function (message) {
    //console.log('should send', sys.utils.safe(message))
    client.send(sys.utils.safe(message))
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

  client.on('message', function (message) {
    //console.log('got message from parent:', message)
    sys.deliver(message)
  })
})

</script>
