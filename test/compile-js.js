var fs = require('fs')
var path = require('path')
var inspect = require('util').inspect
var compile_src = fs.readFileSync(path.join(__dirname, '../compile-js.al'), 'utf8')
var parse = require('../parse')()
var ast = parse(compile_src)
var compile = require('../compile-js')
var $ = require('../symbols')
console.log(inspect(ast, {colors:true,depth:1000}))

var scope = {
  stringify: function (x) { return 'symbol' === typeof x ? x.description : String(x) },
  eq: function (a, b) { return a === b },
  cat: function (a, b) {
    return a+b
  },
  gt: function (a, b) { return a > b },
  print: function (x) { console.log('print', x); return x },
  add: function (a, b) { return a + b }
}

var ev = require('../eval')
//var _compile = ev(ast, scope)
console.log(compile(ast))
//console.log(compile)

function ev_js(src, scope) {
  with(scope) {
    return eval(src)
  }
}

//console.log(ev(ast.concat(parse('compile({type:$boolean value:true})')), scope))
var compile2 = ev_js(compile(ast), {__proto__:scope})
//var ast2 = parse('true')
//var ast2 = parse('foo.bar=baz')
var ast2 = parse('{a b; add(a b)}')
console.log(inspect(ast2, {colors:true, depth:100}))
console.log('output:', compile2(ast2[0], {__proto__: scope}))