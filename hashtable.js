var $ = require('./symbols')
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
    //1 if on this map, 2 if on parent map, 3 on parent parent map, etc
    hasDepth: function (k) {
      return map.has(toString(k)) ? 1 :
             parentMap !=null ? 0 != (d=parentMap.hasDepth(toString(k))) ? d+1 : 0 : 0
    },
    get: function (x) {
      x = toString(x)
      return map.has(x) ? map.get(x) : parentMap != null ? parentMap.get(x) : null
    },
    set: function (k, v) {
      if(null == v)
        throw new Error('cannot set hashtable to nullish:'+toString(k)+'='+v)
      map.set(toString(k), v)
      return v
    },
    entries: function () {
      return Array.from(map.entries()).map((kv) => ({key:$(kv[0]), value:kv[1]}))
    }
  }
}