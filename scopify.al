HT: import("./hashtable.js")
a:  import("./arrays")
each: a.each map: a.map concat_ary:a.concat_ary concat:a.concat
n:  import("./nodes")

transform: import("./transform").transform

//acid syntax does not allow $ in variable names
//so we don't need to worry about these colliding
//(they are allowed in js, on the other hand)
scope_var: n.Var(create_symbol("$scope"))
parent_var: n.Var(create_symbol("$parent"))
execute_var: n.Var(create_symbol("$execute"))

{node;
  scope: HT(nil)
  counter: 0
  create_tmp: {;
    n.Var(create_symbol(concat(["$fun_" stringify(counter=add(counter 1))])))
  }
  scope_access: {depth left right;
    R: {v depth;
      eq(depth 1) ? v ; R(n.Access(v n.Var($parent) nil true) sub(depth 1)) }
    eq(depth 0)
    ? eq(nil right) ? left ; n.Set(left right)
    ; n.Access(R(scope_var depth) left right true)
  }
  scope_call: {value args;
    n.Block([
      n.Def(tmp:create_tmp() value)
      n.Call(
        n.Access(tmp n.Var($execute) nil true)
        concat_ary(
          [n.Access(tmp n.Var($scope) nil true)]
          args
        )
      )
    ])
  }

  //the top level scope has null parent
  //so put that in the functions list
  funs: [n.Def(parent_var n.Nil())]

  addFun: {fun; 
    tmp: create_tmp()
    funs = concat_ary(funs [n.Def(tmp fun)])
    tmp
  }

  ast: transform(n.Fun([] node) scope {node scope T;
    c:{x; eq(x node.type)}
    
    c($fun)       ? {;
                      _scope: HT(scope)
                      //add args to scope before traversing in body
                      args_vars: map(node.args {v; 
                        _scope.set(v.value true)
                        {key: v.value value: v}
                      })
                      body: T(node.body _scope)
                      scope_object: create_object(concat_ary(
                        concat_ary(
                        [{key: $parent value: parent_var}]
                        //TODO: if the def is a function arg, then set it to the arg
                        map(_scope.entries() {def; {key: def.key value: n.Nil()}}))
                        //just prepending the args here does has the same effect
                        //because create_object over writes it. but this should actually be an error
                        args_vars
                        //this should be typed, not nil!
                      ))

                      n.Object({
                        scope: scope_var
                        //closures are now objects with a single method!
                        //hat tip: https://steve-yegge.blogspot.com/2006/03/execution-in-kingdom-of-nouns.html
                        execute: addFun(n.Fun(
                          concat_ary([parent_var] node.args)
                          n.Block([n.Def(scope_var n.Object(scope_object)) body])
                        ))
                      })
                    }() ;
    c($call)      ? {;
                      //since we are converting everything to be closure scopes
                      //then everything should be a call(fn.execute concat(fn.scope args))
                      //except global scope calls, which we can identify because they are not
                      //in the scope map.
                      c: {x; eq(node.value.type x)}
                      //if it's a self evaluating function, need to handle directly.
                      c($fun) ?
                              {;
                                //if this was a 
                                fn: T(node.value scope)
                                n.Call(fn.value.execute
                                  concat_ary([fn.value.scope] map(node.args {x; T(x scope)})))
                                
                              }() ;
                      {; c($variable) & not(scope.has(node.value.value)) }()
                      ? n.Call(node.value map(node.args {n; T(n scope)}))
                      //otherwise, assume it's not a built-in, call execute with scope
                      ; scope_call(T(node.value scope) map(node.args {x; T(x scope)}))
                    }();
    c($def)       ? {;
                      scope.set(node.left.value true)
                      n.Access(scope_var node.left T(node.right scope) true)
                    }() ;
    c($set)       ? scope_access(
                      scope.hasDepth(node.left.value)
                      node.left
                      eq(node.right nil) ? nil ; T(node.right scope)
                    ) ;
    c($variable)  ? scope_access(scope.hasDepth(node.value) node nil) ;
                    nil
  })
  n.Block([
    n.Block(funs)
    n.Call(
      funs.[sub(funs.length 1)].left
      [n.Nil()])
  ])
}
