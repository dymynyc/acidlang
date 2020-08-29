var fs = require('fs')
var path = require('path')
var assert = require('assert')
var inspect = require('util').inspect
var compile_src = fs.readFileSync(path.join(__dirname, '../compile-js.al'), 'utf8')
var parse = require('../parse')()
var ast = parse(compile_src)
var compile = require('../compile-js')
var $ = require('../symbols')
var data = require('./data/expressions')
var types = require('../types')

var scope = {
  stringify: function (x) { return 'symbol' === typeof x ? x.description : JSON.stringify(x) },
  cat: function (a, b) {
    return a+b
  },
  print: function (x) { console.log('print', inspect(x, {colors: true, depth: 100})); return x },
  add: function (a, b) { return a + b },
  and: function (a, b) { return a & b },
  mul: function (a, b) { return a * b },
  eq: function (a, b) { return a === b },
  gt: function (a, b) { return a > b },
  i32: {type: types.type, value: types.number},
  object_each: function object_each(obj, fn, acc) {
    for(var k in obj) acc = fn(acc, $(k), obj[k])
    return acc
  }
}

var ev = require('../eval')
//var _compile = ev(ast, scope)
//console.log(compile(ast))
//console.log(compile)

function ev_js(src, scope) {
  with(scope) {
    return eval(src)
  }
}

//console.log(ev(ast.concat(parse('compile({type:$boolean value:true})')), scope))
console.log(ast)
//var ast2 = parse('true')
//var ast2 = parse('foo.bar=baz')
function test(name, compiler) {
  console.log("***************")
  console.log('test:', name)
  data.inputs.forEach(function (v, i) {
    console.log('input :', v)
    var ast2 = parse(v) //'{a b; x:add(a b)}')
    //console.log(ast2)
  //  console.log(inspect(ast2, {colors:true, depth:100}))
//    console.log(ast2)
    var dst = compiler(ast2, scope)
    console.log('output:', dst)
    var v = ev_js(dst, scope)
    assert.deepEqual(v, data.output_values[i])
  })
  console.log()
}
test('js', compile)
var src2 = compile(ast)
var compile2 = ev_js(src2, {__proto__:scope})
test('js(acid)', compile2)
console.log(src2)
var src3 = compile2(ast)
console.log(src3)
var compile3 = ev_js(src3, {__proto__:scope})
test('js(acid)(acid)', compile2)

//self compiled self hosted compiler should equal self compiled self self hosted compiler
var src4 = compile3(ast)
console.log(src4)
assert.equal(src4, src3)
//var compile3 = ev_js(src3, {__proto__:scope})
//test('js(acid)(acid)', compile2)
