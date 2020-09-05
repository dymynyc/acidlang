s: import("stack-expression/index.js")

And:s.And Or:s.Or Maybe:s.Maybe Many:s.Many
More:s.More Join:s.Join Recurse:s.Recurse
Group:s.Group Text:s.Text Expect:s.Expect
EOF:s.EOF Empty:s.Empty Not:s.Not

_1: Or(" " "\t" "\n" "\r\n")
__: More(_1)
_:  Many(_1)

json: import("stack-expression/examples/json.js")

List:{val map; Group(Maybe(Join(val __)) map)}

OpenClose: {op item cl map; And(op _ List(item map) _ cl)}

Extend: {prefix extender reduce;
  {input start end group;
    acc: nil
    R:{n m; neq(m -1) ? R(add(n m) extender(input add(start add(n m)) end {v; acc = reduce(acc v)})) ; n}
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

Range: {lo hi;
  lc: charCodeAt(lo 0) hc: charCodeAt(hi 0)
  {input start end group;
    {; gte(charCodeAt(input start) lc) & lte(charCodeAt(input start) hc)}() ? 1 ; -1}
}

"vars are a-zA-Z_ for first char, and may have numbers after that"
azAZ_: Or(Range("a" "z") Range("A" "Z") "_")
azAZ_09: Or(azAZ_ Range("0" "9"))

nil_node: {type: $nil value: nil}
nil_: Text(And("nil" Not(azAZ_09)) {;nil_node})
boolean_: Wrap(And(json.boolean Not(azAZ_09)) $boolean)
string_:  Wrap(json.string $string)
number_:  Wrap(json.number $number)

sym: Text(And(azAZ_ Many(azAZ_09)) {v; createSymbol(v)})
symbol: And("$" Wrap(sym $symbol))
variable: Wrap(sym $variable)
args: List(variable) 

{;
  
  value: Recurse({value;

    expected_value: Expect(value "expected acidlang value")

    invocation: OpenClose("(" value ")" {v; {type: $call value: nil args: v}})

    assignment: Maybe(And(_ "=" _ value))

    access: And("." _ Or(
      Group(And(variable assignment) {args;
        {type: $access left: nil args: mid: args.[0] right: args.[1]}})
      Group(And("[" _ value _ "]" assignment) {args;
        {type: $access left: nil args: mid: args.[0] right: eq(args.length 2) ? args.[1] ; nil}})
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
    
    unit: Or(string_ number_ nil_ boolean_ symbol variable fun object array)
    
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
