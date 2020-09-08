#! /usr/bin/env node
var fs = require('fs')
var path = require('path')
var env = require('./env')
var parse = require('./handwritten/parse')()
var ev = require('./eval')
var {inspect} = require('util')
var resolve = require('./resolve')('node_modules', '.al', JSON.parse, "package.json")
var {wrap, mapValue, unmapValue} = require('./util')

//var compile = require('./handwritten/compile-js')
//var compile = require('./compile-js')
var $ = require('./symbols')

function toRelative(s) {
  return './' + path.normalize('./'+ s)
}

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

if(~module.parent) {
  var cmd = process.argv[2]
  console.error(process.argv.slice(2), process.env.output)
  if(cmd === 'run')
    run(process.argv[3], process.cwd())
  else if(cmd === 'bootstrap' || cmd === 'bootstrap1')
    require('./build')
      (require('./handwritten/parse')(), require('./handwritten/compile-js'))
        (process.argv.slice(3), process.cwd(), process.env.output)
  else if(cmd === 'bootstrap2')
    require('./build')
      (require('./handwritten/parse')(), require('./bootstrap/compile-js'))
        (process.argv.slice(3), process.cwd(), process.env.output)
  else if(cmd === 'bootstrap3')
    require('./build')
      (require('./handwritten/parse')(), require('./bootstrap2/compile-js'))
        (process.argv.slice(3), process.cwd(), process.env.output)
  else if(cmd === 'build')
    require('./build')
      (require('./handwritten/parse')(), require('./dist/compile-js'))
        (process.argv.slice(3), process.cwd(), process.env.output)
  else if(cmd === 'parse')
    console.log(inspect(parse(fs.readFileSync(process.argv[3], 'utf8')), {colors: true, depth: Infinity}))
  else
    throw new Error('unknown command:'+cmd)
}
