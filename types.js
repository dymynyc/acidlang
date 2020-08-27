function $(str) { return Symbol(str) }

module.exports = { //T
  call:   $('call'),    //{value:fn|symbol|call args: [*]}
  object: $('object'),  //{value: {*:Object|Array|Primitive|fun}}
  
  array:  $('array'),   //{value: [* Object|Array|Primitive]
  fun:    $('fun'),     //{args: [*], body: [E], scope: HT:value, name:sym}
  symbol: $('symbol'),  //{value:sym}
  number: $('number'),  //{value:number}
  boolean: $('boolean'),//{value:boolean}
  string: $('string'),  //{value:string}
  nil:    $('nil'),     //{value:nil}
  if:     $('if'),
  and:    $('and'),
  or:     $('or'),
  set:    $('set'),
  def:    $('def'),
  typesig:$('typesig'),
  type:   $('type'),
  access: $('access'),
  is:     $('is')
}