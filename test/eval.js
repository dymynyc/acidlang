var assert  = require('assert')
var parse   = require('../parse')()
var ev      = require('../eval')
var inspect = require('util').inspect
var compile = require('../compile-js')
var types   = require('../types')
var check   = require('../check')
var {unmap} = require('../util')
var $ = require('../symbols')

// var inputs = [
  // 'add(1 2)',
  // '{a b; add(a b)}(3 4)',
  // 'true ? 10 ; -10',
  // 'true & true & false',
  // 'true | false',
  // '{x; eq(and(x 1) 1) ? true ; false}(1)',
  // '{x; eq(and(x 1) 1) ? true ; false}(4)',
  // '{;fac:{n; eq(n 1) ? 1 ; mul(n fac(add(-1 n)))}}()(1)',
  // '{;fac:{n; eq(n 1) ? 1 ; mul(n fac(add(-1 n)))}}()(7)',
  // '{; sq:{x m; gt(x m) ? x ; sq(mul(x x) m)}}()(2 10000)',
  // '{x y; {x:x y:y}}(3 4)',
  // '7 {; 1 2 3}()',
  // 'x:10 y:20 add(x y)',
  // 'xyz:{x:3 y:5 z:7} xyz.z',
  // 'a:{foo:{;123}} a.foo()',
  // '{e; {;e}}(987)()',
  // '{f; f(f)}({g;{x;{;x}}})(349783)()',
  // 'x:1 x@i32',
  // 'Obj:{x:i32 y:i32 z:i32} obj:{x:1 y:1 z:1} obj@Obj',
  // 'a:{self:a}', //cyclic!
  // 'deep:{a:{b:{c:deep}}}',
  // '$object'
// ]

// var output_types = [
  // n,n,n,
  // b,b,b,b,
  // n,n,n,T(types.object, {x:n,y:n}),
  // n, n, n, n, n, n,
  // b,b,
  // cyclic, cyclic2
//]

var scope = Object.freeze({
  add: function (a, b) { return a + b },
  and: function (a, b) { return a & b },
  mul: function (a, b) { return a * b },
  eq: function (a, b) { return a === b },
  gt: function (a, b) { return a > b },
  i32: {type: types.type, value: types.number}
})

var n = {type: types.number, value: null}, b = {type: types.boolean, value:null}
var nnn = {type: types.typesig, args: [n, n], returns: n}
var nnb = {type: types.typesig, args: [n, n], returns: b}
var type_scope = Object.freeze({
  add: nnn, and: nnn, mul: nnn,
  eq: nnb, gt: nnb,
  i32: {type: types.type, value: types.number}
})

function ev_js(src, scope) {
  with(scope) { return eval(src) }
}

var {inputs,outputs,output_values} = require('./data/expressions')

for(var i = 0; i < inputs.length; i++) {
  if(inputs[i]) {
    console.log('**********************')
    console.log("SRC", inputs[i])
    var ast = parse(inputs[i])
    //console.log(inspect(ast, {colors:true, depth: 100}))
    console.log("JS ", compile(ast))
    var v = ev(ast, {__proto__:scope})
    console.log("VAL", v)
    assert.deepEqual(v, outputs[i])
    var js = compile(ast)
    console.log("JS", js)
    assert.deepEqual(ev_js(js, {__proto__: scope}), output_values[i])

    var type = check(ast, {__proto__: type_scope})
    if(type.type === types.object) {
      assert.deepEqual(Object.keys(type.value), Object.keys(outputs[i].value))
      for(var k in type.value)
        assert.equal(type.value[k].type, outputs[i].value[k].type)
    } else
      assert.deepEqual(type.type, outputs[i].type)
  }
}
