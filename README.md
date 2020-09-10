# acidlang - _acid eats rust_

`acid` is a new _fun oriented_ programming language.

goals:

* so simple you can understand everything
* self hosting
* compiles to wasm
* bootstrapped
* expressive via closures
* low level system programming language

by simple I really do mean _simple_. 

plan:
* write a parser. (done)
* write an evaluator. implementation must be restricted to js features acid will support. (done)
* compile that to javascript. (done)
* write a type checker. (to enforce restrictions that they compiled js wouldn't have) (partially done)
* module system
* start to reimplement parts in javascript-compiled acid.
  because it's implemented in js, and compiles to js this can be done in step by step.
  * acid compiler now self hosted
* implement stack machine (like wasm)
* compile to stack machine (this will take a few transformations...)
* stop development: maximum stability.

## language semantics

begin with a subset of javascript. support only the features needed to implement acidlang,
and also only features that are convienient to compile to a lower level runtime like wasm.

* objects {} must have fixed keys. you cannot add another key later, or change the type of a key.
* arrays [] have a fixed length (easy to compile to raw memory)
* functions cannot be called with wrong number of arguments
* variables cannot be reassigned to different types

