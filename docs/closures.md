
# how to compile closures

`acidlang` is "fun oriented". By this I mean it's _fun_ and also fun_ctional_.
But also a sort of functional _lite_.
Functional Programming _without getting religious about it_.

Also, it's for systems programming, so it has to be fast and light weight,
and also, it should compromise for pragmatism where necessary.

Basically, it's about closures.

I chose to focus on closures, after my experience trying to write a compile to wasm lisp,
`acidlisp`. In `acidlisp` my idea was to have a language that was dynamic like lisp,
but only during compile time - then it became static like C.
So you have lisp style meta programming but while compiling, not when the code actually runs,
at that point it's fully static and fast like C. (or C compiled to wasm, at least)

Lisp has macros. Reading lisp materials you'll learn that lisp macros are kinda a big deal.
Lisp macros are _very powerful_ and _strictly more expressive than C macros_ (turns out that
isn't true. C macros are actually turing complete. so you can't say it's _strictly_ more
expressive, but most would agree it's more "expressive". "expressiveness" is a thing that lisp
programmers care about, but come to think of it I've never heard a C programmer say that.

functions are simple. they take args, they return values. they may have side effects.
macros are much more complicated though. at first they look like functions. they take
arguments, they return values. But actually - the arguments they take are not values
but code.

Imagine a macro for something like the increment operator in js and c:
`i++` could be `(inc i)`
the code might look like:
```
(def inc (mac (v) `(set ,v (add 1 ,v))))
```
I'll explain all the details of this shortly.

when you call a function, you pass it `i`, but you know that what the function actually
gets is the number stored inside `i`. but when you call a macro, it doesn't get the value.
It gets the code `i`, that is, the symbol, but not what it points to. This is stored inside `v`.
Confused? good. we are just getting started.

A macro is a function that takes code as arguments, and returns code. If you want to pass a macro
a number, you need to call it with a number literal. Like a function, a macro returns a value.
But this value is interpreted as code. It also internally evaluates code. So there needs to be
a way to distinguish between code it's running and code it's returning. This is done by "quoting".
Quoting means you are refering to the code itself, not "saying" that.
In lisp, you can quote like this `(quote (add 1 2))` which returns the code `(add 1 2)` instead
of evaluating `(add 1 2)` and returning `3`. usually you can shorten that to `\`(add 1 2)`.
But quoting by itself only enables us to return static code, but we want to return code modified
my the macro's arguments. For that we need unquoting.

```
(quote (add 1 (unquote v)))
```
returns `(add 1` but then evaluates what's stored inside of `v` so maybe that becomes `(add 1 i)`

so maybe the body of the `(inc i)` macro is
```
(quote (set (unquote v) (add 1 (unquote v))))
```

or, with the special form:
```
`(set ,v (add 1 ,v))
```


That is more complicated than a function that increments i, but it means
that `(inc i)` expands to `(set i (add 1 i))` but saves us typing all that.
(and more importantly, it saves us the visual clutter)

Another simple one would be a macro to swap two variables.

```
(def swap (mac (a b) `(block
  (def tmp ,b)
  (set ,b ,a)
  (set ,a tmp)
)
```

So, `(swap x y)` expands to `(block (def tmp y) (set y x) (set x tmp))`.
That is a more significant saving of clutter. But now the macro is creating
a variable. What if we where already using `tmp` i another way?

`(block (def tmp 3) (swap x y) ...)` after `(swap x y)` `tmp` is set to the value
of `y`. This is not obvious from looking at the call `(swap x y)`

A function can return a value, that is easy to understand. But a macro not only
returns a value but can mutate it's arguments, and even create new variables.
Having that power is a benefit, I guess, but the cost is you must wressel with
quoting and unquoting. And you must, in your head keep track of wether something
is quoted or not.

I tried implementing that, and I found macros to be much harder to write, and especially to debug,
than functions. It got especially complicated when I got into recursive macros.

Sometimes I would make a macro into a function, and back into a macro - but this meant removing
and reinstating all the quotes. It is easy to turn any non-recursive function into a macro.

Replace a function with a macro that returns the function body.


---
``` js
//constructor function with private scope
function create (init) {
  return function diff (x) {
    return init += x
  }
}
//recursive function, calls constructor
var get = create(0)
function R () {
  if(get(1)) < 10)
    R()
}
```

unroll to:

``` js
function diff (x) {
  return this.init += x
}
function create (init) {
  return {init: init, fn:diff} //pass to diff
}
var get = create(0)
function R () {
  if(get.call(1) < 10) R()
}
```

okay, how would I transform current closure code to flat code?
this would make work in wasm, but allocate all variables on the heap.
(start out that way, but then unscope things that still work)
or do inlining first, then apply this transformation to things that can't be inlined.

Okay, so every function call instead creates an object containing it's local vars.
This also contains a reference to the parent scope, if this function is defined inside another.
variable access instead accesses this object. closure variable access references the parent scope.
I could use prototype chains for this in javascript, but that wouldn't work for updates to outer
scope vars.

Would need to traverse all functions, and find which variables they create.
Two, would need to see what variables they access (especially, which they mutate)

I think if I got this transform working, it would be easy to compile to wasm.
I could run it after a more conservative inlining. That would be much faster.
Another improvement would be to only scopeify the variables that are actually accessed.


