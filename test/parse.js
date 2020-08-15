var parse = require('../parse')()

var inputs = [
  'plus(1 2)',
  'def(a 1)',
  'def.a=1',
  '[a b c]',
  '"string"',
  '["A" "B" "C"]',
  '{a; plus(a 1)}'
]

for(var i = 0; i < inputs.length; i++)
  console.log(parse(inputs[i]))