var assert  = require('assert')
var parse   = require('../parse')()
var ev      = require('../eval')
var inspect = require('util').inspect
var compile = require('../compile-js')
var types   = require('../types')
var check   = require('../check')
var {unmap} = require('../util')
var $ = require('../symbols')

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
  '{; sq:{x m; gt(x m) ? x ; sq(mul(x x) m)}}()(2 10000)',
  '{x y; {x:x y:y}}(3 4)',
  '7 {; 1 2 3}()',
  'x:10 y:20 add(x y)',
  'xyz:{x:3 y:5 z:7} xyz.z',
  'a:{foo:{;123}} a.foo()',
  '{e; {;e}}(987)()',
  '{f; f(f)}({g;{x;{;x}}})(349783)()',
  'x:1 x@i32',
  'Obj:{x:i32 y:i32 z:i32} obj:{x:1 y:1 z:1} obj@Obj',
  'a:{self:a}', //cyclic!
  'deep:{a:{b:{c:deep}}}',
  '$object'
]

function T (s, v) { return {type: s, value: v === undefined ? null : v}}
var n = T(types.number), b = T(types.boolean)
function N(v) { return T(types.number, v) }
function B(v) { return T(types.boolean, v) }
function O(v) { return T(types.object, v) }

var cyclic = {type:types.object, value: {self:{type: types.object, value:null, cyclic: true}}}
cyclic.value.self.value = cyclic.value

var cyclic2 = O({a:O({b:O({c:null})})})
cyclic2.value.a.value.b.value.c = {type: types.object, value: cyclic2.value, cyclic: true}

var outputs = [
  N(3),
  N(7),
  N(10),
  B(false),
  B(true),
  B(true),
  B(false),
  N(1),
  N(1*2*3*4*5*6*7),
  N(65536),
  O({x: N(3), y: N(4)}),
  N(3),
  N(30),
  N(7),
  N(123),
  //true,
  N(987),
  N(349783),
  B(true),
  ///T(types.type, types.number)
  B(true),
  cyclic,
  cyclic2,
  T(types.symbol, types.object)
]
var cyclic_raw = {self:null}
cyclic_raw.self = cyclic_raw
var cyclic2_raw = {a:{b:{c:null}}}
cyclic2_raw.a.b.c = cyclic2_raw
var outputs_raw = [
  3,7,10,false,true,true,false,1,1*2*3*4*5*6*7,65536,
  {x:3,y:4},3,30,7,123,987,349783,true,true, cyclic_raw, cyclic2_raw, types.object
]

var output_types = [
  n,n,n,
  b,b,b,b,
  n,n,n,T(types.object, {x:n,y:n}),
  n, n, n, n, n, n,
  b,b,
  cyclic, cyclic2
]

var scope = Object.freeze({
  add: function (a, b) { return a + b },
  and: function (a, b) { return a & b },
  mul: function (a, b) { return a * b },
  eq: function (a, b) { return a === b },
  gt: function (a, b) { return a > b },
  i32: {type: types.type, value: types.number}
})

var nnn = {type: types.typesig, args: [n, n], returns: n}
var nnb = {type: types.typesig, args: [n, n], returns: b}
var type_scope = Object.freeze({
  add: nnn,
  and: nnn,
  mul: nnn,
  eq: nnb,
  gt: nnb,
  i32: {type: types.type, value: types.number}
})

function ev_js(src, scope) {
  with(scope) {
    return eval(src)
  }
}

for(var i = 0; i < inputs.length; i++) {
  if(inputs[i]) {
    console.log('**********************')
    console.log("SRC", inputs[i])
    var ast = parse(inputs[i])
    console.log("JS ", compile(ast))
//    console.log("AST", inspect(ast, {colors:true, depth:1000}))
    var v = ev(ast, {__proto__:scope})
    console.log("VAL", v)
//    assert.equal(inspect(v), inspect(outputs[i]))
    assert.deepEqual(v, outputs[i])
    var js = compile(ast)
    console.log("JS", js)
    assert.deepEqual(ev_js(js, {__proto__: scope}), outputs_raw[i])

//    if(output_types[i]) {
      var type = check(ast, {__proto__:type_scope})
      if(type.type === types.object) {
        assert.deepEqual(Object.keys(type.value), Object.keys(outputs[i].value))
        for(var k in type.value)
          assert.equal(type.value[k].type, outputs[i].value[k].type)
      } else
        assert.deepEqual(type.type, outputs[i].type)
    }
    //console.log(inspect(ast, {colors: true, depth: 100}))
 // }
}
