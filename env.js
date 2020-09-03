var types = require('./types')
var $ = require('./symbols')
module.exports = Object.freeze({
  stringify: function (x) { return 'symbol' === typeof x ? x.description : JSON.stringify(x) },
  cat: function (a, b) {
    if('string' !== typeof a) throw new Error('cat: a *must* be a string')
    if('string' !== typeof b) throw new Error('cat: b *must* be a string')
    return a+b
  },
  createArray: function (n) {
    return new Array(n)
  },
  add: function (a, b) { return a + b },
  and: function (a, b) { return a & b },
  mul: function (a, b) { return a * b },
  eq: function (a, b) { return a === b },
  gt: function (a, b) { return a > b },
  i32: {type: types.type, value: types.number},
  print: function (s) {
    console.log(s)
    return s
  },
  object_each: function object_each(obj, fn, acc) {
    for(var k in obj) {
      acc = fn(acc, $(k), obj[k])
    }
    return acc
  },
  $: $
})