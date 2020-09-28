var fs = require('fs')
var path = require('path')
var env = require('./env')
var parse
try {
  //use acid parser, if it has been built.
  parse = require('./dist/parse')
} catch (_) {
  parse = require('./handwritten/parse')
}
var ev = require('./dist/eval')
var HT = require('./hashtable')
var resolve = require('./resolve')('node_modules', '.al', JSON.parse, "package.json")
var {wrap, mapValue, unmapValue} = require('./util')

var _env = require('./env')
var env = {}
for(var k in _env) env[k] = wrap(_env[k])

module.exports = function run (entry, context) {
  function load(module, from) {
    var target = resolve(module, from)
    if('.js'  === path.extname(target)) return mapValue(require(target))
    var src = fs.readFileSync(target, 'utf8')
    var ast = parse()(src)
    var scope = HT(new Map(Object.entries(env)))
    scope.set('import', req => load(unmapValue(req), path.dirname(target)))
    var v = ev(ast, scope)
    console.log("LOADED", module, v)
    return v
  }
  var exports = load(entry, context)
  return unmapValue(exports)
}
