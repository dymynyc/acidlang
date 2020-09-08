## ast

### Number

currently have only implemented 32 bit integers.

`{type: $number value: <number>}`

### Boolean

encoded as 0 or 1, but don't do implicit conversion from numbers

`{type: $boolean value: <true|false>}`

### String

strings will be buffers, length is the byte length.
utf8 char length is bad, because have to scan bytes to calculate it.
so random access to utf8 chars isn't good either, unless you store
the string some "clever" way. 

`{type: $string value: ""... }`

### Symbol

symbols are pointers to unique strings.
that means they can always be compared by address.
object properties are symbols. 

`{type: $symbol value: <symbol>}

### Nil

null pointer. will be encoded as 0. 

`{type: $nil value: null}`

### Object

`{type: $object value: {<symbol>: <Any> ...}}`

### Block

`{type: $block body: [Ast...]}`


### If

`if.left` is an expression that evals to a boolean,
and then mid and right may return different types.
(although checker currently requires they return the same type)
`{type: $if left: Exp=>Boolean mid: Exp right: Exp}`

if `left` is true, evaluates `mid`, else evaluates `right`.

### And

`{type: $And left: Exp=>Boolean right: Exp=>Boolean}`

the same as `if(and.left and.right false)`

### Or

`{type: $Or left: Exp=>Boolean right: Exp=>Boolean}`

the same as `if(and.left true and.right)`

### Def

`{type: $def left: Symbol right: Exp}`

defines `def.left` as the value of `def.right` in the current scope.
if the symbol is already defined it is a fatal error. (can error at compile time)

### Set

`{type: $set left: Symbol right: Exp}`

updates the value of `set.left` in the closest scope that symbol is accessable.
if `set.right` is a different type to what `set.left` was currently defined as that's a fatal error.
(can error at compile time)

### Variable

`{type: $variable value: Symbol}`

evaluates to the value of `variable.value` in the closest scope. a fatal error
if no symbol is defined.

### Block

`{type: $block body: [Exp...]}`

evaluate an array of expressions, return the last value.
here, non-last expressions should have side effects or IO.
if not it's okay for the runtime to remove them.

### Object

an object literal.
`{type: $object value: {Symbol: Exp ...}}`

if an object literal is immediately inside a Def, the value is bound before the values
are evaluated. This enables cyclic objects to be expressed.

### Array

array literal

`{type: $array value: [Exp ...]}`

arrays should be implemented as fixed size pointer arrays, they cannot be resized.

### Access

access a field of an object or an index of an array.

`{type: $access left: Exp=>Object|Array mid: Symbol|Number right: nil|Exp}`

if `access.left` is an Object, `access.mid` must be a symbol.
if `access.left` is an array, `access.mid` must be an integer.
if `access.right` is nil (null pointer) then access evals to the value of the field.
if `access.right` is an expression, then the field is set to that value (without changing the type).
if set, `access.right` is also the value of the expression.

Maybe this should be split into two expressions?

### Scope

a map of symbol=>Value (can be primitive, object, array, or function)

`{map: {Symbol: Value ...} parent: Scope|nil}`

the scope also has a parent scope. when checking for a symbol. check if defined
in the current map, then if not, repeat the process on the parent scope (if defined)

the only way to create a scope is to define a function.

### Fun

`{type: $fun args: [Symbol...] body: Exp scope: nil|Scope}`

when functions are evaluated their scope property is set to the current scope.
when they are called, a subscope is created. it will close over `fun.scope`
arguments must be unique.

if the function is immediately inside a `def` then the function may be recursive.
acidlang does not have loops, only recursion. if the body of a function is an if.
and one branch of that if is a recursive call, then that function is interpreted as a loop.
such a call can infinitely loop without exausting stack space.
This is not full tail call optimization but it's a behaviour that can be implemented in
any target that supports loops or jumps.

### Call

`{type: $call value: Exp=>Fun args: [Exp...]}`

call a function with args. the `call.value` must evaluate to a function.
it may be a function literal.

### Is

type assertion

`{type: $is left: value right: Type}`

can be a runtime check that produces a fatal error.
if it's inside a `if()` then it behaves like a boolean check.
this can be statically checked, so you can create a polymorphic function using branching and
`is`. maybe allow them inline in defs and function args, but have to behave the same as if on the next line/start of the function body.
