var fs = require('fs')
var path = require('path')
var env = require('./env')
var {inspect} = require('util')
var resolve = require('./resolve')('node_modules', '.al', JSON.parse, "package.json")

function toRelative(s) {
  return './' + path.normalize('./'+ s)
}

module.exports = function (parse, compile) {
  return function (entry, context, output) {
    var sources = {}
    function build(module, from) {
      console.log("BUILD", module, from)
      var used = {}
      var target = resolve(module, from)
      if('.js'  === path.extname(target)) return 'require('+JSON.stringify(module)+')'
      var rel = path.relative(context, target)
      var outfile = path.join(output, path.relative(context, rel.substring(0, rel.length - path.extname(rel).length) + '.js'))
      var relfrom = path.relative(context, from) //where the parent module will end up
      var outfrom = path.join(output, relfrom)
      var outrel = rel.substring(0, rel.length - path.extname(rel).length) + '.js'
      if(sources[target]) return 'require('+JSON.stringify(toRelative(outrel))+')'
      sources[target] = true

      var scope = {}
      for(var k in env)
        scope[k] = (function (k, fn) {
          return function (...args) {
            used[k] = true
            return k + '(' + args.join(', ') + ')'
          }
        })(k, env[k])

      var _scope = {
        import: function (req) {
          return build(JSON.parse(req), path.dirname(target))
        },
        print: function (x) {
          return '(x=>(console.log(x),x))('+x+')'
        },
        __proto__: scope
      }
      
      var src = fs.readFileSync(target, 'utf8')
      var ast = parse(src)
      var out = compile(ast, function (sym, args) {
        if(!args) return !!_scope[sym.description] ? sym : null
        return _scope[sym.description].apply(null, args)
      })

      var builtins = env.$.toString()+';\n'
      for(var k in used)
        builtins += 'var '+k+' = '+env[k].toString()+';\n'

      fs.writeFileSync(outfile, builtins + 'module.exports = ' + out)
      console.error("output:", outfile) 
      return 'require('+JSON.stringify(outfile)+')'
    }

    if(Array.isArray(entry))
      entry.forEach(entry => build(toRelative(entry), context))
    else
      build(toRelative(entry), context)
  }
}