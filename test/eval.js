var assert = require('assert')
var parse = require('../parse')()
var ev = require('../eval')

var inputs = [
  'plus(1 2)',
  '{a b; plus(a b)}(3 4)'
]

var outputs = [
  3,
  7
]

var scope = {
  plus: function (a, b) { return a + b }
}

for(var i = 0; i < inputs.length; i++) {
  var v = ev(parse(inputs[i]), scope)
  console.log(v)
  assert.equal(v, outputs[i])
}