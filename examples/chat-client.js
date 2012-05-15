var readline = require('readline')
var net = require('net')

var rl = readline.createInterface(process.stdin, process.stdout)
rl.on('close', function () {
  console.log('Have a great day!')
  process.exit()
})

var client = net.connect(6886, 'localhost')

client.setEncoding('utf8')
client.on('data', function (data) {
  process.stdout.write(data)
})

rl.on('line', function (line) {
  client.write(line)
  rl.setPrompt('>', 2)
  rl.prompt()
})
