var types = require('./types')
var inspect = require('util').inspect

function args (args) {
  return args.map(v=> 'symbol' === typeof v ? v.description : compile(v)).join(', ')
}

function get_vars (node) {
  var defs = []
  ;(function R (node) {
    if(Array.isArray(node)) node.forEach(R)
    else if(node && 'object' === typeof node) {
      if(node.type === types.def) defs.push(node.left)
      //don't traverse into inline functions, that's a separate scope.
      if(node.type !== types.fun)
        for(var k in node) R(node[k])
    }
  })(node)
  return defs.length ? 'var '+defs.map(compile).join(', ')+';' : ''
}

function compile(node) {
  if(Array.isArray(node)) {
    var vars = get_vars(node)
    var exprs = node.map(compile)
    if(vars) {
      var last = exprs.pop()
      return '(function () {\n  '+vars+'\n  '+exprs.join(';\n  ')+';\n  return '+last+'\n})()'
    }
    else return exprs.length > 1? '(' + exprs.join(', ')+')' : exprs[0]
  }
  var type = node.type
  if(type === types.boolean)
    return node.value.toString()
  if(type === types.number)
    return node.value.toString()
  if(type === types.string)
    return JSON.stringify(node.value.toString())
  if(type === types.symbol)
    return node.value.description
  if(type === types.nil)
    return 'null'
  if(type === types.if)
    return '(' + compile(node.left) + ' ? ' + compile(node.mid) + ' : ' + compile(node.right) + ')'
  if(type === types.and)
    return '(' + compile(node.left) + ' ? ' + compile(node.right) + ' : false)'
  if(type === types.or)
    return '(' + compile(node.left) + ' ? true : ' + compile(node.right) + ')' 
  if(type === types.fun) {
    var vars = get_vars(node.body)
    if(node.name)
      return '(function '+node.name.description+' (' + args(node.args)+'){'+vars+'return '+compile(node.body)+'})'
    else
      return '((' + args(node.args).trim() + ') => ' + 
        (vars ? '{'+vars+'return '+compile(node.body)+'}' :  compile(node.body))
      + ')'
  }
  if(type === types.object)
    return 'Object.seal({'+Object.keys(node.value).map(k => k + ':' + compile(node.value[k])).join(', ')+'})'
  if(type === types.array)
    return '(['+node.value.map(v => compile(v)).join(', ')+'])'
  if(type === types.set || node.type === types.def)
    return '('+node.left.value.description + '='+compile(node.right)+')'
  if(type === types.call)
    return compile(node.value) + '(' + args(node.args) + ')'
  if(type === types.access) {
    return compile(node.left)+'.'+compile(node.mid)+(node.right?'='+compile(node.right):'')
  }
  if(type === types.is) //assume this has been handled by the type checker
    return 'true'
  throw new Error('cannot compile:'+inspect(node))
}

module.exports = compile