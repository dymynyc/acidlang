s: import("stack-expression/index.js")

And:s.And Or:s.Or Maybe:s.Maybe Many:s.Many
More:s.More Join:s.Join Recurse:s.Recurse
Group:s.Group Text:s.Text Expect:s.Expect
EOF:s.EOF Empty:s.Empty

_1: Or(" " "\t" "\n" "\r\n")
__: More(_1)
_:  Many(_1)

json: import("stack-expression/examples/json.js")

List:{val map; Group(Maybe(Join(val __)) map)}

OpenClose: {op item cl map; And(op _ List(item map) _ cl)}

Extend: {prefix extender reduce;
  {input start end group;
    acc: nil
    R: {n m; neq(m -1) ? R(add(n m) extender(input add(start add(n m)) end {v; acc = reduce(acc v)})) ; n}
    n: R(0 prefix(input start end {v; acc = v}))
    neq(acc nil) & group(acc)
    neq(n 0) ? n ; -1
  }
}

Map: {rule mapper type;
  {input start end group;
    rule(input start end {v; group(mapper(v))}) } }

toBlock: {body; eq(body nil) ? nil ; gt(body.length 1) ? {type: $block body: body} ; body.[0]}
Wrap: {rule type; Map(rule {value; {type: type value: value}})}

{;
  Nil: {type: $nil value: nil}
  nil: Text("nil" {;Nil})
  boolean: Wrap(json.boolean $boolean)
  string:  Wrap(json.string $string)
  number:  Wrap(json.number $number)

  azAZ: Or(Range("a" "z") Range("A" "Z"))
  zeroNine: Range("0" "9")
  symbol: Text(And(Or(azAZ "_") Many(Or(azAZ zeroNine "_"))) {v; StringToSymbol(v)})
  var: Wrap(symbol $variable)
  sym: Wrap(symbol $symbol)
  args: List(var)
  value: Recurse({value;
    expected_value: Expect(value "expected acidlang value")
    invocation: OpenClose("(" value ")" {v; {type: $call value: nil args: v}})
    assignment: Maybe(And(_ "=" _ value))
    access: And("." _ Or(
      Group(And(variable assignment) {args;
        {type: $access left: nil args: mid: args.[0] right: args.[1]}})
      Group(And("[" _ variable _ "]" assignment) {args;
        {type: $access left: nil args: mid: args.[0] right: args.[1]}})
    ))
      
    key_value: Group(And(variable _ ":" _ Expect(value)) {kv; {key: kv.[0] value: kv.[1]}})
    object: OpenClose("{" key_value "}" {pairs; {type: $object value: pairs}})
    array: OpenClose("[" value "]" {items; {type: $array value: items}})
    fun: Group(And("{" _ args _ ";" _ List(value toBlock) _ "}") {fun;
      {type: $fun args: fun.[0] body: fun.[1] scope: nil name: nil}
    })
    ternary: Group(And("?" _ expected_value _ Expect(";") _ expected_value) {parts;
      {type: $if left: nil mid: parts.[0] right: parts.[1]}
    })
    Infix: {rule type; And(rule _  Wrap(expected_value type))}
    
    infixes: Or(
      Infix("&" $and) Infix("|" $or) Infix("=" $set) Infix(":" $def) Infix("@" $is)
    )
    
    util: Or(string number Nil boolean symbol variable fun object array)
    
    Extend(unit And(_ Or(infixes ternary invocation access)) {left right;
      eq(right.type $call) ? {; right.value = left }() ; {; right.left = left }()
      right
    })
  })

  _parse: And(_ List(value toBlock) _ EOF)
  
  {src;
    g: nil
    eq(_parse(src 0 src.length {v; g = v}) -1) ? crash("could not parse") ; g }
}
