# memory

acid lisp has fixed sized arrays, and objects with fixed fields (aka structs).

# symbols

have a global hashtable that indexes symbols. a 'createSymbol(string)' function
checks if a symbol is already in the table and returns the address, or otherwise inserts it.
symbols are after that, referenced by their address. symbols are used as object keys.

the symbol table would be pre loaded with types i32 i64 f32 f64 boolean nil

# primitives

If nil is represented as 0@i32 then it's easy to distinguish from any object (or string)
but not from i32. if an interface needed nil|i32 then you'd need to box the i32. I32.
That's exposed to the programmer in java. Currently this is ambigious in the reference implementation.

Automatically converting to boxed numbers would be awkward, and only make it slower,
via pointer lookup.

Not having it means an array of numbers is initialized to 0. but an array of objects is initialized
to nil. (note: object is anything accessed via a pointer. so a string is an object too, like java, unlike javascript)

# dynamic objects

the simplest way to represent objects would be an array of `[{key: symbol_addr value: object}...]`
an array is a linear memory: `[array_type length type value_ptr...]`
the length may not change.
most arrays will be a single type, possibly that type or nil.
to make an array without nil it needs to be an array literal.

## array types

For a single dimensional single typed array, it's `[Array, length@i32, type, values...]`
for multiple types, type points to an Or(type_a type_b) thing.
for a multidimensional array, implement as an array of arrays?
but that would mean sub arrays could have different types.
for high performance matrix ops we really want a flat array.
that would mean it's really just one array but accessed via multiple coords.
so `[x y]` is just `[x+y*width]` and the length is `width*height`
So maybe the answer is just a special type for multidimensional arrays?

## objects

`[object_type fields...]` where object_type is a pointer to an array of keyvalue pairs.
`[type_array length keyvalue...]`  a `keyvalue` is `[type_array 2 type symbol type]`
type is symbol|[array<keyvalue<symbol, type>>] 

would it be better to have an array of symbols and an array of types?

## String

a string is just an array of u8.

---

maybe this can all be implemented without specifying everything upfront?
instead of writing code that handles everything, maybe I can just use inlining closures?
for example, after type checking, insert closures for accessing every object property,
and then inline those.

Then could start with a simple dynamic model that traversed the classes each access,
and then move to a static model that operated directly on the correct location.
How this could work will be clearer after inlining is figured out.