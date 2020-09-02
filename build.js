var fs = require('fs')
var path = require('path')
var env = require('./env')
var parse = require('./parse')()
var compile = require('./compile-js')
var resolve = require('./resolve')('node_modules', '.al', JSON.parse, "package.json")

if(!module.parent) {
  var sources = {}
  var args = process.argv.slice(2)
  var entry = args[0], output = args[1]
  function build(module, from) {
    var target = resolve(module, from)
    if(sources[target]) return
    sources[target] = true
    if('.js'  === path.extname(target)) return 'require('+JSON.stringify(module)+')'
    var src = fs.readFileSync(target, 'utf8')
    var ast = parse(src)
    var out = compile(ast, {import: function (req) {
      return build(req, target)
    }})
    var outfile = target.substring(0, target.length - path.extname(target).length) + '.js'
    fs.writeFileSync(outfile, out)
    return 'require('+JSON.stringify(target)+')'
  }

  build(process.argv[2], process.cwd())
 
}