var fs = require('fs')
var path = require('path')
var mkdirp = require('mkdirp')
var env = require('./env')
var {inspect} = require('util')

var resolve = require('./resolve')('node_modules', '.al', JSON.parse, "package.json")

function toRelative(s) {
  console.log("TO_RELATIVE", s)
  var nm = /^(?:\.\.\/)+node_modules\//.exec(s)
  console.error(nm)
  if(nm) return s.substring(nm[0].length)

  return (/^\.\./.test(s) ? '' : './') + path.normalize('./'+ s)
}

//the file name before the extention
function prename (rel) {
  return rel.substring(0, rel.length - path.extname(rel).length)
}

module.exports = function (parse, compile) {
  return function (entry, context, output) {
    var sources = {}
    function build(module, from) {
      var used = {}
      var target = resolve(module, from)
    console.error("TARGET", module, '->',  target)
      var rel = path.relative(context, target)
      var outfile = path.join(output, path.relative(context, prename(rel) + '.js'))
      console.error("REQUIRE("+JSON.stringify(module)+', '+JSON.stringify(from)+')')
      var desc = JSON.stringify({module, from, target})
      //if we directly resolved a js file, then just include the require
      //do not build.
      if('.js'  === path.extname(target)) {
        return 'require('+JSON.stringify(toRelative(path.relative(path.dirname(outfile), target)))+')/*direct js:'+desc+'*/'
      }
      var relfrom = path.relative(context, from) //where the parent module will end up
      var outfrom = path.join(output, relfrom)
      var outrel = rel.substring(0, rel.length - path.extname(rel).length) + '.js'
      mkdirp.sync(path.dirname(outfile))
      //if the module required is already built (in sources) then just return require string, don't build it.

      if(sources[target]) return 'require('+JSON.stringify(toRelative(outrel))+')/*compiled al:'+desc+'*/'
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
        // print: function (x) {
          // return '(x=>(console.log(x),x))('+x+')'
        // },
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

      //else write file and return require string

      fs.writeFileSync(outfile, builtins + 'module.exports = ' + out)
      return 'require('+JSON.stringify(toRelative(outrel))+')/*compiled al (first):'+desc+'*/'
    }

    if(Array.isArray(entry))
      entry.forEach(entry => build(toRelative(entry), context))
    else
      build(toRelative(entry), context)
  }
}
