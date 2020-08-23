var assert = require('assert')
var parse = require('../parse')()
var ev = require('../eval')
var inspect = require('util').inspect
var compile = require('../compile-js')

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
  '{; sq:{x m; gt(x m) ? x ; sq(mul(x x) m) } }()(2 10000)'
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
  65536
]

var scope = {
  add: function (a, b) { return a + b },
  and: function (a, b) { return a & b },
  mul: function (a, b) { return a * b },
  eq: function (a, b) { return a === b },
  gt: function (a, b) { return a > b }  
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
    console.log(v)
    assert.equal(v, outputs[i])
    var js = compile(ast)
    console.log("JS", compile(ast))
    assert.equal(ev_js(js, scope), outputs[i])
  }
}