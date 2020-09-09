function toString(k) {
  return k = 'symbol' === typeof k ? k.description : k
}

module.exports = function (parentMap) {
  var map = new Map()
  return {
    has: function (k) {
      k = toString(k)
      return map.has(k) ? true : parentMap != null ? parentMap.has(k) : false      
    },
    //used to check if a value is already defined.
    hasOwn: function (k) {
      return map.has(toString(k))
    },
    get: function (x) {
      x = toString(x)
      return map.has(x) ? map.get(x) : parentMap != null ? parentMap.get(x) : null
    },
    set: function (k, v) {
      map.set(toString(k), v)
      return v
    }
  }
}