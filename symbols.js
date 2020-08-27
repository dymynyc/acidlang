var symbols = new Map()
module.exports = function $(str) {
  var v
  return symbols.get(str) || (symbols.set(str, v = Symbol(str)), v)
}