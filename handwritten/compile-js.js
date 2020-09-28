var types = require('../types')
var inspect = require('util').inspect

function object_each(obj, fn, acc) {
  for(var k in obj)
    acc = fn(acc, k, obj[k])
  return acc
}

function compile(node, insert) {
  function args (args) {
    return args.map(v=> 'symbol' === typeof v ? v.description : C(v)).join(', ')
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
    return defs.length ? '  var '+defs.map(C).join(', ')+';' : ''
  }

  function C(node) {
    if(node.type === types.block) {
      var vars = get_vars(node)
      var exprs = node.body.map(C)
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
      return '(' + C(node.left) + ' ? ' + C(node.mid) + ' : ' +
        (types.if === node.right.type ? '\n  ' : '') + C(node.right, node) + ')'
    if(type === types.and)
      return '(' + C(node.left) + ' ? ' + C(node.right) + ' : false)'
    if(type === types.or)
      return '(' + C(node.left) + ' ? true : ' + C(node.right) + ')' 
    if(type === types.fun) {
      if(node.body == null) return '()=>null'
      var vars = get_vars(node.body)
      return '(' + args(node.args).trim() + ') => ' + 
        (node.body.type === types.block ? "{\n"+C(node.body)+'\n}' : C(node.body))
    }
    if(type === types.object)
      return 'Object.seal({' + object_each(node.value, (s, key, value) =>
        (s === "" ? "" : s + ", ") + key + ': ' + C(value), ""
      ) + '})'

    if(type === types.array)
      return '(['+node.value.map(v => C(v)).join(', ')+'])'
    if(type === types.set || node.type === types.def) {
      if(node.right.type === types.object /*&& isCyclic(node.right.value)*/) {
        var name = node.left.value.description
        var obj = node.right, s = ''
        return '('+ name + '={}' +
          object_each(obj.value, (s, key, value) => s + ", " + name+'.'+key + '=' + C(value), "")
          +',Object.seal(' + name + '))'      
      }
      return '('+node.left.value.description + '='+C(node.right)+')'
    }
    if(type === types.call) {
      if(node.value.type === types.variable && insert) {
        if(insert(node.value.value) !== null) return insert(node.value.value, node.args.map(C))
      }
      return (node.value.type === types.fun ?
        '('+C(node.value)+')' :
        C(node.value)
      ) + '(' + args(node.args) + ')'
    }
    if(type === types.access) {
      return C(node.left)+(
          node.static ? '.'+node.mid.value.description : '[' + C(node.mid) + ']'
        )+(node.right?'='+C(node.right):'')
    }
    if(type === types.is) //assume this has been handled by the type checker
      return 'true'
    throw new Error('cannot compile:'+inspect(node))
  }
  
  return C(node)
}

module.exports = function (node, insert) {
  var src = compile(node, insert)
  return '(function () { ' + (node.type === types.block ? src : 'return ' + src)+ '}())'
}