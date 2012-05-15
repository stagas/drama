var drama = require('../')
var sys = drama('sys')

var other = sys.actor('other')

function buildChain (size, next) {
  var a = sys.actor({
    die: function () {
      console.log('dying', size)
      var from = this.sender
      if (next) {
        this.send('die').to(next)
        return {
          ack: function () {
            console.log('acked', size)
            this.send('ack').to(from)
          }
        }
      } else this.send('ack').to(from)
    }
  })
  if (size > 0) return buildChain(size - 1, a)
  else return a
}

sys.actor({ ack: function () {
  console.log('done')
}}).send('die').to(buildChain(1000))
