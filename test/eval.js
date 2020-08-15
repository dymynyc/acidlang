var parse = require('../parse')()
var ev = require('../eval')

var inputs = [
  'plus(1 2)',
  '{a b; plus(a b)}'
]

var scope = {
  plus: function (a, b) { return a + b }
}

for(var i = 0; i < inputs.length; i++)
  console.log(ev(parse(inputs[i]), scope))