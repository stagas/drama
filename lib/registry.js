function Registry () {
  this._list = {}
}

Registry.prototype.add = function (item) {
  this._list[this.resolve(item)] = item
}

Registry.prototype.resolve = function (item) {
  return 'object' === typeof item ? item.address : item
}

Registry.prototype.get = function (item) {
  return this._list[this.resolve(item)]
}

Registry.prototype.remove = function (item) {
  delete this._list[this.resolve(item)]
}

Registry.prototype.has = function (address) {
  return address in this._list
}

Registry.prototype.forEach = function (fn) {
  var i = 0
  for (var k in this._list) fn(this._list[k], k, i++, this._list)
}

Registry.prototype.keys = function () {
  return Object.keys(this._list)
}

exports.Registry = Registry
