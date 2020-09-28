return console.log("DISABLED TEST")
var assert = require('assert')
var {mapValue, unmapValue} = require('../util')

cyclic = {self:null}
cyclic.self = cyclic
var inputs = [
 1, 2, 3,
 true, false,
 [1, 2, 3],
 [[]],
 null,
 {key: "hello", value: 2},
 cyclic
]
inputs.forEach(function (v) {
  var _v = mapValue(v)
  console.log('mapped', v, _v)
  var __v = unmapValue(_v)
  assert.deepEqual(__v, v)
  assert.deepEqual(mapValue(__v), _v)
})