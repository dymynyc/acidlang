var types = require('./types')

function args (args) {
  return args.map(v=> 'symbol' === typeof v ? v.description : compile(v)).join(', ')
}

function compile(node) {
  if(Array.isArray(node)) {
    if(node.length == 1) return compile(node[0])
    return '(' + node.map(compile).join(', ') + ')'
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
    if(node.name)
      return '(function '+node.name.description+' (' + args(node.args)+'){return '+compile(node.body)+'})'
    else
      return '((' + args(node.args).trim() + ') => ' + compile(node.body) + ')'
  }
  if(type === types.object)
    return 'Object.seal({'+Object.keys(node.value).map(k => k + ':' + compile(node.value[k])).join(', ')+'})'
  if(type === types.array)
    return '(['+node.value.map(v => compile(v)).join(', ')+'])'
  if(type === types.set || node.type === types.def)
    return '('+node.left.value.description + '='+compile(node.right)+')'
  if(type === types.call) {
    return compile(node.value) + '(' + args(node.args) + ')'
  }
}

module.exports = compile