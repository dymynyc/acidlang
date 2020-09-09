var types = require('./types')
var $ = require('./symbols')
var inspect = require('util').inspect
module.exports = Object.freeze({
  stringify: function (x) {
    return 'symbol' === typeof x ? x.description : JSON.stringify(x)
  },
  cat: function (a, b) {
    if('string' !== typeof a) throw new Error('cat: a *must* be a string, was:'+a)
    if('string' !== typeof b) throw new Error('cat: b *must* be a string, was:'+b)
    return a+b
  },
  charCodeAt: function (string, i) {
    if('string' !== typeof string) throw new Error('must be string')
    if('number' !== typeof i) throw new Error('must be integer')
    return string.charCodeAt(i)
  },
  createArray: function (n) {
    return new Array(n)
  },
  createSymbol: function (s) {
    return $(s)
  },
  // has: function (object, key) {
    // return object[key] != undefined
  // },
  add: function (a, b) { return a + b },
  and: function (a, b) { return a & b },
  mul: function (a, b) { return a * b },
  eq:  function (a, b) { return a === b },
  neq: function (a, b) { return a !== b },
  gt:  function (a, b) { return a >  b },
  gte: function (a, b) { return a >= b },
  lt:  function (a, b) { return a <  b },
  lte: function (a, b) { return a <= b },
  i32: {type: types.type, value: types.number},
  print: function (s) {
    console.log(inspect(s, {colors: true, depth: Infinity}))
    return s
  },
  object_each: function object_each(obj, fn, acc) {
    for(var k in obj) {
      acc = fn(acc, $(k), obj[k])
    }
    return acc
  },
  crash: function (message) {
    throw new Error(message)
  },
  $: $
})