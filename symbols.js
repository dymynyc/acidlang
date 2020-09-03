module.exports = function $(str) {
  var v
  var symbols = global.acid_symbols = global.acid_symbols  || new Map()
  return symbols.get(str) || (symbols.set(str, v = Symbol(str)), v)
}