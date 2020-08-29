var types = require('./types')
var inspect = require('util').inspect

function args (args) {
  return args.map(v=> 'symbol' === typeof v ? v.description : compile(v)).join(', ')
}

function object_each(obj, fn, acc) {
  for(var k in obj)
    acc = fn(acc, k, obj[k])
  return acc
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
  return defs.length ? '  var '+defs.map(compile).join(', ')+';' : ''
}

function compile(node) {
  if(node.type === types.block) {
    var vars = get_vars(node)
    var exprs = node.body.map(compile)
    if(vars) {
      var last = exprs.pop()
      exprs = exprs.map(v => v + ';\n  ')
      return vars+'\n  '+exprs.join('')+'return '+last
    }
    else return 'return ' + (exprs.length > 1? '(' + exprs.join(', ')+')' : exprs[0])
  }
  var type = node.type
  if(type === types.boolean)
    return node.value.toString()
  if(type === types.number)
    return node.value.toString()
  if(type === types.string)
    return JSON.stringify(node.value.toString())
  if(type === types.variable)
    return node.value.description
  if(type === types.symbol)
    return '$("'+node.value.description+'")'
  if(type === types.nil)
    return 'null'
  if(type === types.if)
    return compile(node.left) + ' ? ' + compile(node.mid) + ' : ' +
      (types.if === node.right.type ? '\n  ' : '') + compile(node.right, node)
  if(type === types.and)
    return '(' + compile(node.left) + ' ? ' + compile(node.right) + ' : false)'
  if(type === types.or)
    return '(' + compile(node.left) + ' ? true : ' + compile(node.right) + ')' 
  if(type === types.fun) {
    var vars = get_vars(node.body)
    return '(' + args(node.args).trim() + ') => ' + 
      (node.body.type === types.block ? "{\n"+compile(node.body)+'\n}' : compile(node.body))
  }
  if(type === types.object)
    //return 'Object.seal({'+Object.keys(node.value).map(k => k + ':' + compile(node.value[k])).join(', ')+'})'
    return 'Object.seal({' + object_each(node.value, (s, key, value) =>
      (s === "" ? "" : s + ", ") + key + ': ' + compile(value), ""
    ) + '})'

  if(type === types.array)
    return '(['+node.value.map(v => compile(v)).join(', ')+'])'
  if(type === types.set || node.type === types.def) {
    if(node.right.type === types.object /*&& isCyclic(node.right.value)*/) {
      var name = node.left.value.description
      var obj = node.right, s = ''
      return '('+ name + '={}' +
        object_each(obj.value, (s, key, value) => ", " + name+'.'+key + '=' + compile(value), "")
        +',Object.seal(' + name + '))'      
    }
    return '('+node.left.value.description + '='+compile(node.right)+')'
  }
  if(type === types.call)
    return (node.value.type === types.fun ?
      '('+compile(node.value)+')' :
      compile(node.value)
    ) + '(' + args(node.args) + ')'
  if(type === types.access) {
    return compile(node.left)+(
        node.static ? '.'+compile(node.mid) : '[' + compile(node.mid) + ']'
      )+(node.right?'='+compile(node.right):'')
  }
  if(type === types.is) //assume this has been handled by the type checker
    return 'true'
  throw new Error('cannot compile:'+inspect(node))
}

module.exports = function (node) {
  return '(function () { ' + (node.type === types.block ? compile(node) : 'return ' + compile(node))+ '}())'
}