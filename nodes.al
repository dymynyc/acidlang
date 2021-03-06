{
  Number: {v;         {type: $number  value: v}}
  Boolean:{v;         {type: $boolean value: v}}
  String: {v;         {type: $string  value: v}}
  Nil:    {;          {type: $nil     value: nil}}
  Symbol: {v;         {type: $symbol  value: v}}
  Array:  {v;         {type: $array   value: v}}
  Object: {v;         {type: $object  value: v}}
  
  Var:   {k;          {type: $var     value: k}}
  
  Def:   {k v;        {type: $def left: k right: v}}
  Set:   {k v;        {type: $set left: k right: v}}
  Is:    {l r;        {type: $is  left: l right: r}}
  And:   {l r;        {type: $and left: l right: r}}
  Or:    {l r;        {type: $or  left: l right: r}}
  If:    {l m r;      {type: $if  left: l mid: m right: r}}
  
  Access:{l m r s;    {type: $access left: l mid: m right: r static: s}}
  Block: {body;       {type: $block body: body}}
  Call:  {value args; {type: $call value: value args: args}}

  Fun:   {args body;  {type: $fun args: args body: body scope: nil name: nil}}
}
/*
  Primitives: Number | Boolean | Nil | Symbol | String | Function
  Containers: Object | Array
  Expression:
    Var: {value: Symbol}
  | Def: {left: Var right: Expression}
  | Set: {left: Var right: Expression}
  | Is:  {left: Expression right: Type}
  | If:  {left: Expression mid: Expression right: Expression}
  | And: {left: Expression right: Expression}
  | Or:  {left: Expression right: Expression}
  | StaticAccess: {left:Expression mid: Var right: Nil|Expression} //foo.bar
  | DynamicAccess: {left:Expression mid: Expression right: Nil|Expression} //foo.[bar]
  | Block: {body: Array(Expression)}
  | Fun: {args: Array(Var) body: Expression}
  | Call: {value: Fun args: Array(Expression)}
*/
