var fs = require('fs')
var path = require('path')
var assert = require('assert')
var inspect = require('util').inspect
var compile_src = fs.readFileSync(path.join(__dirname, '../compile-js.al'), 'utf8')
var parse = require('../handwritten/parse')()
//var parse = require('../parse')()
var ast = parse(compile_src)
var $ = require('../symbols')
var data = require('./data/expressions')
var types = require('../types')
var {mapValue} = require('../util')
var run = require('../run')
var scope = require('../env')


var ev = require('../eval')

function ev_js(src, scope) {
  var keys = Object.keys(scope).concat('$')
  scope['$'] = $
//  with(scope) {
    var f = new Function(keys, 'return '+src)
//    console.log("EVAL", f.toString())
    var values = keys.map(k => scope[k] || $)
    var returns = f.apply(null, values)
    return returns
  //}
}


function nop () { return null }
//console.log(ev(ast.concat(parse('compile({type:$boolean value:true})')), scope))
console.log(ast)
//var ast2 = parse('true')
//var ast2 = parse('foo.bar=baz')
function test(name, compiler) {
  console.log("***************")
  console.log('test:', name)
  var start = Date.now()
  data.inputs.forEach(function (v, i) {
    console.log('input :', v)
    var ast2 = parse(v) //'{a b; x:add(a b)}')
    var dst = compiler(ast2, nop)
    console.log('output:', dst)
    var v = ev_js(dst, scope)
    assert.deepEqual(v, data.output_values[i])
  })
  //remove logging to get accurate times
  console.log(Date.now() - start)
  console.log()
}
test('hand_js', require('../handwritten/compile-js'))
test('hand_js(acid)', require('../bootstrap/compile-js'))
test('hand_js(id)(acid)', require('../dist/compile-js'))

//self compiled self hosted compiler should equal self compiled self self hosted compiler

// var ev_compile_fun = ev(ast, {__proto__: scope})

// function ev_compile (ast) {
  // ast =  mapValue(ast)
  // var src = ev({
    // type: types.call,
    // value: {type: types.variable, value: $('compile')},
    // args: [ast, {type: types.variable, value: $('nop')}]
  // }, {
    // __proto__: scope,
    // compile: ev_compile_fun,
    // nop: nop
  // }).value
  // return src
// }

// var src5 = test('eval', ev_compile)
// //assert that interpreted compiler also matches the self hosted output
// assert.equal(src5, src3)

// var src2 = test('js', compiled_compile)
// var src3 = test('js(acid)', ev_js(src2, scope))
// var src4 = test('js(acid)(acid)', ev_js(src3, scope))
// assert.equal(src4, src3)

var ev_compile = run('../compile-js', __dirname)
test('ev', ev_compile)