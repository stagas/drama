function Registry () {
  this._list = {}
}

Registry.prototype.add = function (item) {
  this._list[item.address] = item
}

Registry.prototype.get = function (address) {
  return this._list[address]
}

Registry.prototype.remove = function (address) {
  delete this._list[address]
}

Registry.prototype.forEach = function (fn) {
  var i = 0
  for (var k in this._list) fn(this._list[k], k, i++, this._list)
}

exports.Registry = Registry
