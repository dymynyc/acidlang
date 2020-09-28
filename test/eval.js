var assert  = require('assert')
var parse   = require('../dist/parse')()
var ev      = require('../handwritten/eval')
var acid_ev = require('../dist/eval')
var inspect = require('util').inspect
var compile = require('../handwritten/compile-js')
var types   = require('../types')
var check   = require('../check')
var {unmap, wrap} = require('../util')
var $ = require('../symbols')
var HT = require('../hashtable')

var _scope = require('../env')
var scope = {}
for(var k in _scope) scope[k] = wrap(_scope[k])


var n = {type: types.number, value: null}, b = {type: types.boolean, value:null}
var nnn = {type: types.typesig, args: [n, n], returns: n}
var nnb = {type: types.typesig, args: [n, n], returns: b}
var type_scope = Object.freeze({
  add: nnn, and: nnn, mul: nnn,
  eq: nnb, gt: nnb, gte:nnb,
  i32: {type: types.type, value: types.number}
})

function ev_js(src, scope) {
  var Map
  with(scope) { return eval('(function () {'+src+'}())') }
}

var {inputs,outputs,output_values} = require('./data/expressions')

for(var i = 0; i < inputs.length; i++) {
  if(inputs[i]) {
    console.log('**********************')
    console.log("SRC", inputs[i])
    var ast = parse(inputs[i])
    console.log(inspect(ast, {colors:true, depth: 100}))
    console.log("JS ", compile(ast))
    var v = ev(ast, HT(new Map(Object.entries(scope))))
    console.log("VAL", v)
    assert.deepEqual(v, outputs[i])
    var v2 = acid_ev(ast, HT(new Map(Object.entries(scope))))
    //console.log('v2?',v2, outputs[i])
    assert.deepEqual(v2, outputs[i])
    
    if(true) {
      var type = check(ast, HT(new Map(Object.entries(type_scope))))
      console.log("TYP", type)
      if(type.type === types.object) {
        assert.deepEqual(Object.keys(type.value), Object.keys(outputs[i].value))
        for(var k in type.value)
          assert.equal(type.value[k].type, outputs[i].value[k].type)
      } else
        assert.deepEqual(type.type, outputs[i].type)
    }
  }
}
