var fs = require('fs')
var path = require('path')
var env = require('./env')
var parse = require('./handwritten/parse')()
var ev = require('./eval')
var {inspect} = require('util')
var resolve = require('./resolve')('node_modules', '.al', JSON.parse, "package.json")
var {wrap, mapValue, unmapValue} = require('./util')

var compile = require('./handwritten/compile-js')
var $ = require('./symbols')


function run (entry, context) {
  function load(module, from) {
    var target = resolve(module, from)
    if('.js'  === path.extname(target)) return require(target)
    var src = fs.readFileSync(target, 'utf8')
    var ast = parse(src)
    return ev(ast, {__proto__: env, import: function (req) {
      return load(req, path.dirname(target))
    }})
  }
  var exports = load(entry, context)
  return exports
}

function build (entry, context) {
       var sources = {}
  //var args = process.argv.slice(2)
  //var entry = args[0], output = args[1]
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

  build(entry, context) 

}

if(~module.parent) {
  var cmd = process.argv[2]
  if(cmd === 'run')
    run(process.argv[3], process.cwd())
  else if(cmd === 'build')
    build(process.argv[3], process.cwd())
  else if(cmd === 'parse')
    console.log(inspect(parse(fs.readFileSync(process.argv[3], 'utf8')), {colors: true, depth: 100}))
}
