function $(str) { return Symbol(str) }

module.exports = {
  call:   $('call'),
  object: $('object'),
  array:  $('array'),
  fun:    $('fun'),
  symbol: $('symbol'),
  number: $('number'),
  boolean: $('boolean'),
  string: $('string'),
  nil:    $('nil'),
  if:     $('if'),
  and:    $('and'),
  or:     $('or'),
  set:    $('set'),
  def:    $('def'),
  typesig:$('typesig'),
  type:   $('type'),
  access: $('access')
}