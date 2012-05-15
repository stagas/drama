# drama

Actor model implementation for JavaScript and Node.js (work in progress)

Inspirations: Scala Actors, Akka, Pykka

## walkthrough

Actors live in systems, so let's define ours:

```javascript
var drama = require('drama')
var sys = drama('sys')
```

Okay, now let's create a simple actor in our system, with some default behavior:

```javascript
var actor = sys.actor({ hello: function (message) { console.log(message) })
```

And then run it!

```javascript
actor.tell('hello', 'world') // 'world'
```

Right. Now let's see what else we can do. Maybe we need to put and get some value back
and forth from the actor. So let's create an actor that does that:

```javascript
var actor = sys.actor(function (initial) {
  var value = initial
  return {
    set: function (val) {
      value = val
    }
  , get: function () {
      this.reply(value)
    }
  }
})
```

Wait, what happened here? We defined an initial behavior as a function.
These functions catch all the messages, but we'll only be using the first one
to set an initial value and put our var in scope.

We then `return` or designate a behavior for any message that'll come in the future.
`return` is essentially overloaded to be the `react` method familiar with other actor implementations. Scala users should read `return` as `react`.

So let's initialize it and use it:

```javascript
actor.init('some value')
actor.ask(actor, 'get', function (val) {
  console.log(val) // 'some value'
})
```

You probably don't want literals all over your code. Don't worry, you can create a proxy
and use it as a regular object:

```javascript
var proxy = actor.pick('?get', 'set')
proxy.set('another value')
proxy.get(function (val) {
  console.log(val) // 'another value'
})
```

Here we create a proxy using `pick` on an actor reference. It essentially allows you to pick
methods from the actor. You'll also notice the `?` which is used to declare that this method
should be invoked with `ask` rather than `tell`.
There is also a `??` prefix to indicate that the reply is expected to be a future, and that you want to auto-resolve and callback for you.
Hopefully, when we get harmony proxies from ES6 everywhere, this step could be omitted.

## remote actors

Just fork the system and use like local:

```javascript
var remote = sys.fork('remote')
var remoteActor = remote.actor({
  ping: function () { this.reply('pong')
}}).pick('?ping')

remoteActor.ping(function (response) {
  console.log(response) // 'pong'
})
```

These and a lot more, can be found in the `examples/`.

Enjoy!

## licence

MIT/X11
