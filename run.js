var fs = require('fs')
var path = require('path')
var env = require('./env')
var parse = require('./handwritten/parse')()
var ev = require('./eval')
var resolve = require('./resolve')('node_modules', '.al', JSON.parse, "package.json")
var {wrap, mapValue, unmapValue} = require('./util')

if(~module.parent) {
  function load(module, from) {
    var target = resolve(module, from)
    if('.js'  === path.extname(target)) return require(target)
    var src = fs.readFileSync(target, 'utf8')
    var ast = parse(src)
    return ev(ast, {__proto__: env, import: function (req) {
      return load(req, path.dirname(target))
    }})
  }
  var exports = load(process.argv[2], process.cwd())
  var args = process.argv.slice(3)
}