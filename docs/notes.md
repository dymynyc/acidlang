# acid lang

scene: NZ 2020, coronavirus lockdown, on sailboat. need a project.

---

why create your own language

* fun
* put all your opinions in it
* learn loads about how languages work

---

take 1. acid lisp

Question: could I have something:
dynamic like lisp,
but only at compile time,
static like C at run time

---

lesson: actually, no I don't like lisp macros.

also, lisp syntax is too cluttered (sozza lispies)

---

functions: takes args, does something, returns a value

simple.

---

macros: takes args (as code), does something, returns value (as code).

can behave like a function, but also,
that code can "update" the args (like c's pass by reference)
create new code that interacts with the calling scope.

---
not obvious whats gonna happen just looking at the call.
looking at the code isn't easy either, because have to figure out quoting and unquoting.
especially for recursive macros

also, it's not easy to refactor something from function to macro or back.
---

idea: what if "macros" where just a optimization on closures?
      what if closures where as fast as hand written imperative code?

---

idea: just inline closures

function EQ (x) {
  return function (y) {
    return x === y
  }
}

e = EQ(bar.baz)
=> `x = bar.baz`

e("foo")
=> `( y1 = "foo", x2 === y1)`

---

started working on that, got stuck and everything went on the back burner.

---

but a couple of months later I realized something
---

instead start as a compile to js language.
but target a subset of js that I know I can compile to wasm.

---

and, or, if, vars, functions,
arrays (fixed length)
objects (but can't add keys - objects are structs, not hash tables)

