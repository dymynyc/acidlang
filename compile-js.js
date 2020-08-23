var types = require('./types')

function args (args) {
  return args.map(v=> 'symbol' === typeof v ? v.description : compile(v)).join(', ')
}

function compile(node) {
  if(node.type === types.boolean)
    return node.value.toString()
  if(node.type === types.number)
    return node.value.toString()
  if(node.type === types.string)
    return JSON.stringify(node.value.toString())
  if(node.type === types.symbol)
    return node.value.description
  if(node.type === types.nil)
    return 'null'
  if(node.type === types.if)
    return '(' + compile(node.left) + ' ? ' + compile(node.mid) + ' : ' + compile(node.right) + ')'
  if(node.type === types.and)
    return '(' + compile(node.left) + ' ? ' + compile(node.right) + ' : false)'
  if(node.type === types.or)
    return '(' + compile(node.left) + ' ? true : ' + compile(node.right) + ')' 
  if(node.type === types.fun) {
    if(node.name)
      return '(function '+node.name.description+' (' + args(node.args)+'){return '+compile(node.body)+'})'
    else
      return '((' + args(node.args).trim() + ') => ' + compile(node.body) + ')'
  }
  if(node.type === types.object)
    return '{'+Object.keys(node.value).map(k => k + ':' + compile(node.value[k])).join(', ')+'}'
  if(node.type === types.array)
    return '['+node.value.map(v => compile(v)).join(', ')+']'
  if(node.type === types.set || node.type === types.def)
    return '('+node.left.value.description + '='+compile(node.right)+')'
  if(node.type === types.call) {
    return compile(node.value) + '(' + args(node.args) + ')'
  }
}

module.exports = compile