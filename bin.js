#! /usr/bin/env node
var fs = require('fs')
var path = require('path')
var env = require('./env')
var minimist = require('minimist')
var print = require('./util').print

function toRelative(s) {
  return './' + path.normalize('./'+ s)
}
var run = require('./run')
function require_eval(file) {
  return run(toRelative(file), process.cwd())
}

function load(name) {
  try {
    //compiled js
    return require('./dist/'+name)
  } catch (_) {
    try {
      //handwritten js
      return require('./handwritten/'+name)
    } catch(_) {
      //acid interpreter
      return require_eval('./'+name)
    }
  }
  
}
var parse = load('parse')
var inline = load('inline')
var scopify = load('scopify')
// try {
  // //use acid parser, if it has been built.
  // parse = require('./dist/parse')
// } catch (_) {
  // parse = require('./handwritten/parse')
// }
var ev = require('./eval')
var HT = require('./hashtable')
var {inspect} = require('util')
var resolve = require('./resolve')('node_modules', '.al', JSON.parse, "package.json")
var {wrap, mapValue, unmapValue} = require('./util')

//var compile = require('./handwritten/compile-js')
//var compile = require('./compile-js')
var $ = require('./symbols')

function Transformer (opts) {
  return function (compile) {
    return function (ast, insert) {
      ast = opts.inline  === true ? inline(ast) : ast
      ast = opts.scopify === true ? scopify(ast) : ast
      return compile(ast, insert)
    }
  }
}

if(~module.parent) {
  var opts = minimist(process.argv.slice(2))
  var cmd = opts._[0]
  var files = opts._.slice(1)
  var tr = Transformer(opts)
  if(cmd === 'run')
    require_eval(files[0])
  else if(cmd === 'bootstrap' || cmd === 'bootstrap1')
    
    require('./build')
      (parse(), tr(require('./handwritten/compile-js')))
        (files, process.cwd(), process.env.output)
  else if(cmd === 'bootstrap2')
    require('./build')
      (parse(), tr(require('./bootstrap/compile-js')))
        (files, process.cwd(), process.env.output)
  else if(cmd === 'bootstrap3')
    require('./build')
      (parse(), tr(require('./bootstrap2/compile-js')))
        (files, process.cwd(), process.env.output)
  else if(cmd === 'build')
    require('./build')
      (parse(), tr(require('./dist/compile-js')))
        (files, process.cwd(), process.env.output)
  else if(cmd === 'parse')
    print(tr(x=>x)(parse()(fs.readFileSync(process.argv[3], 'utf8'))))
  else
    throw new Error('unknown command:'+cmd)
}
