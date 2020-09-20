#! /usr/bin/env node
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
var ev = require('./eval')
var HT = require('./hashtable')
var {inspect} = require('util')
var resolve = require('./resolve')('node_modules', '.al', JSON.parse, "package.json")
var {wrap, mapValue, unmapValue} = require('./util')

//var compile = require('./handwritten/compile-js')
//var compile = require('./compile-js')
var $ = require('./symbols')

function toRelative(s) {
  return './' + path.normalize('./'+ s)
}


if(~module.parent) {
  var cmd = process.argv[2]
  if(cmd === 'run')
    require('./run')(toRelative(process.argv[3]), process.cwd())
  else if(cmd === 'bootstrap' || cmd === 'bootstrap1')
    
    require('./build')
      (parse(), require('./handwritten/compile-js'))
        (process.argv.slice(3), process.cwd(), process.env.output)
  else if(cmd === 'bootstrap2')
    require('./build')
      (parse(), require('./bootstrap/compile-js'))
        (process.argv.slice(3), process.cwd(), process.env.output)
  else if(cmd === 'bootstrap3')
    require('./build')
      (parse(), require('./bootstrap2/compile-js'))
        (process.argv.slice(3), process.cwd(), process.env.output)
  else if(cmd === 'build')
    require('./build')
      (parse(), require('./dist/compile-js'))
        (process.argv.slice(3), process.cwd(), process.env.output)
  else if(cmd === 'parse')
    console.log(inspect(parse()(fs.readFileSync(process.argv[3], 'utf8')), {colors: true, depth: Infinity}))
  else
    throw new Error('unknown command:'+cmd)
}
