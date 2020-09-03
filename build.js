var fs = require('fs')
var path = require('path')
var env = require('./env')
var parse = require('./parse')()
var compile = require('./handwritten-compile-js')
var resolve = require('./resolve')('node_modules', '.al', JSON.parse, "package.json")
var env = require('./env')
var $ = require('./symbols')

if(!module.parent) {
  var sources = {}
  var args = process.argv.slice(2)
  var entry = args[0], output = args[1]
  function build(module, from) {
    var used = {}
    var target = resolve(module, from)
    if(sources[target]) return
    sources[target] = true
    if('.js'  === path.extname(target)) return 'require('+JSON.stringify(module)+')'
    var src = fs.readFileSync(target, 'utf8')
    var ast = parse(src)

    var scope = {}
    for(var k in env)
      scope[k] = (function (k, fn) {
        return function (...args) {
          used[k] = true
          return k + '(' + args.join(', ') + ')'
        }
      })(k, env[k])

    var out = compile(ast, {
      import: function (req) {
        return build(JSON.parse(req), path.dirname(target))
      },
      print: function (x) {
        return '(x=>(console.log(x),x))('+x+')'
      },
      __proto__: scope
    })

    var outfile = target.substring(0, target.length - path.extname(target).length) + '.js'
    var prefix = $.toString()+';\n'
    for(var k in used)
      prefix += 'var '+k+' = '+env[k].toString()+';\n'

    fs.writeFileSync(outfile, prefix + 'module.exports = ' + out)
    return 'require('+JSON.stringify(outfile)+')'
  }

  build(entry, process.cwd()) 
}