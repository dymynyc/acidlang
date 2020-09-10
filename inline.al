HT: import("./hashtable.js")
a: import("./arrays")
map: a.map zip:a.zip

"if the inlined value is a block, set value to the last value note, that might also be a block."
deblock: {def right scope;
  eq(right.type $block) ? {;
    right.body.[sub(right.body.length 1)] = deblock(def right.body.[sub(right.body.length 1)] scope)
    right
  }() ; {;
    scope.set(def.left.value def.right = right)
    def
  }()
}
"TODO: make sure we can handle cases where a block resolves to a function"
"branch that evals to functions will be more tricky"
resolve: {node scope;
  c:EQ(node.type)
  c($variable) ? scope.get(node.value) ;
  c($fun)      ? node ;
                 crash("cannot resolve a function")
}
Block: {body; {type: $block body: body}}
Call: {value args; {type: $call value: value args: args}}
Def: {k v; {type: $def left: k right: v}}

EQ: {x; {y; eq(x y) }}
traverse: {node;
  scope: HT(nil)
  "note, because this transform is applied after uniquify, it's no longer necessary to track scopes"
  T: {node;
    c: EQ(node.type)

    c($def)   ? {;
                  eq(node.right.type $fun)
                  ? {;
                      scope.set(node.left.value node.right)
                      node
                    }()
                  ; deblock(node T(node.right) scope)
                }() ;
    c($call)  ? {;
                  fn: resolve(node.value scope)
                  eq(fn nil)
                  ? Call(node.value map(node.args T))
                  ; Block([Block(zip(fn.args node.args {k v; T(Def(k v)) })) T(fn.body)])
                }() ;
    c($block) ? Block(map(node.body T)) ;
                node
  }
  T(node)
}