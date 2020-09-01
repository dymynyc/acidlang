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
var {mapValue} = require('../util')

var scope = require('../env')
// {
  // stringify: function (x) { return 'symbol' === typeof x ? x.description : JSON.stringify(x) },
  // cat: function (a, b) {
    // return a+b
  // },
  // print: function (x) { console.log('print', inspect(x, {colors: true, depth: 100})); return x },
  // add: function (a, b) { return a + b },
  // and: function (a, b) { return a & b },
  // mul: function (a, b) { return a * b },
  // eq: function (a, b) { return a === b },
  // gt: function (a, b) { return a > b },
  // i32: {type: types.type, value: types.number},
  // object_each: function object_each(obj, fn, acc) {
    // for(var k in obj) acc = fn(acc, $(k), obj[k])
    // return acc
  // }
//}

var ev = require('../eval')
//var _compile = ev(ast, scope)
//console.log(compile(ast))
//console.log(compile)

function ev_js(src, scope) {
  var keys = Object.keys(scope).concat('$')
  scope['$'] = $
//  with(scope) {
    var f = new Function(keys, 'return '+src)
//    console.log("EVAL", f.toString())
    var values = keys.map(k => scope[k] || $)
    var start = Date.now()
    var returns = f.apply(null, values)
    console.log('ev', Date.now()-start)
    return returns
  //}
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
var start = Date.now()
var src2 = compile(ast)
console.log("compile js", Date.now() - start)
var compile2 = ev_js(src2, scope)
test('js(acid)', compile2)
console.log(src2)
var start = Date.now()
var src3 = compile2(ast)
console.log("self compile js(acid)", Date.now()-start)
//console.log(src3)
var compile3 = ev_js(src3, scope)
test('js(acid)(acid)', compile2)

//self compiled self hosted compiler should equal self compiled self self hosted compiler
var start = Date.now()
var src4 = compile3(ast)
console.log("self compile (js(acid)(acid)", Date.now()-start)
//console.log(src4)
//don't run it just verify output is equal
assert.equal(src4, src3)

var ev_compile = ev(ast, {__proto__: scope})

function compile5 (ast) {
  ast =  mapValue(ast)
  var src = ev({
      type: types.call,
      value: {type: types.variable, value: $('compile')},
      args: [ast]
  }, {
        __proto__: scope,
        compile: ev_compile,
      }).value
  console.log('value', src)
  return src
}

test('eval', compile5)
//assert that interpreted compiler also matches the self hosted output
var start = Date.now()
var src5 = compile5(ast)
console.log('self-compile:', Date.now()-start)
assert.equal(src5, src3)
