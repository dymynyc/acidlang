var assert  = require('assert')
var parse   = require('../parse')()
var ev      = require('../eval')
var inspect = require('util').inspect
var compile = require('../compile-js')
var types   = require('../types')
var check   = require('../check')
var {unmap} = require('../util')

var inputs = [
  'add(1 2)',
  '{a b; add(a b)}(3 4)',
  'true ? 10 ; -10',
  'true & true & false',
  'true | false',
  '{x; eq(and(x 1) 1) ? true ; false}(1)',
  '{x; eq(and(x 1) 1) ? true ; false}(4)',
  '{;fac:{n; eq(n 1) ? 1 ; mul(n fac(add(-1 n)))}}()(1)',
  '{;fac:{n; eq(n 1) ? 1 ; mul(n fac(add(-1 n)))}}()(7)',
  '{; sq:{x m; gt(x m) ? x ; sq(mul(x x) m) } }()(2 10000)',
  '{x y; {x:x y:y}}(3 4)'
]

var outputs = [
  3,
  7,
  10,
  false,
  true,
  true,
  false,
  1,
  1*2*3*4*5*6*7,
  65536,
  {x: 3, y: 4}
]

function T (s) { return {type: types.type, value: s}}
var n = T(types.number), b = T(types.boolean), o = T(types.object)
var output_types = [
  n,n,n,
  b,b,b,b,
  n,n,n,o
]

var scope = {
  add: function (a, b) { return a + b },
  and: function (a, b) { return a & b },
  mul: function (a, b) { return a * b },
  eq: function (a, b) { return a === b },
  gt: function (a, b) { return a > b }  
}

var nnn = {type: types.typesig, args: [n, n], returns: n}
var nnb = {type: types.typesig, args: [n, n], returns: b}
var type_scope = {
  add: nnn,
  and: nnn,
  mul: nnn,
  eq: nnb,
  gt: nnb
}

function ev_js(src, scope) {
  with(scope) {
    return eval(src)
  }
}

for(var i = 0; i < inputs.length; i++) {
  if(inputs[i]) {
    console.log()
    var ast = parse(inputs[i])
    console.log("SRC", inputs[i])
    console.log("JS ", compile(ast))
    //console.log("AST", inspect(ast, {colors:true, depth:1000}))
    var v = ev(ast, scope)
    console.log("VAL", v)
    assert.deepEqual(unmap(v), outputs[i])
    var js = compile(ast)
    console.log("JS", compile(ast))
    assert.deepEqual(ev_js(js, scope), outputs[i])

    var type = check(ast, type_scope)
    console.log('TYP', type)
    assert.deepEqual(type, output_types[i])
  }
}