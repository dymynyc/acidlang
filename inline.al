HT:       import("./hashtable.js")
a:        import("./arrays")
map: a.map map_i: a.map_i zip:a.zip
uniquify: import("./uniquify")
funs:     import("./functions")
n:        import("./nodes")
transform: import("./ast").transform

EQ: {x; {y; eq(x y) }}

//it might be nicer to make deblock into a separate pass
//called from this one like uniquify
deblock: {node right scope;
  c:EQ(node.type)
  eq(right.type $block) ? n.Block(map_i(right.body {v i;
                            eq(i sub(right.body.length 1)) ? deblock(node v scope) ; v
                          })) ;
  c($def)   ? n.Def(node.left
                //should handle objects also...
                eq(right.type $fun) ? scope.set(node.left.value right) ; node.right
              ) ;
  c($call)  ? n.Call(right node.args) ;
  c($set)   ? n.Set(node.left right) ;
              crash("cannot deblock unknown type")
}


//there are definitely some unhandled cases here,
//but it will still work, if not everything is inlined
//things left over will be handled by scopify. just deoptimized slightly.
{node;
  scope: HT(nil)
  unique: uniquify(0)
  uniquify(0)(transform(unique(node) nil {node nil T2;
    T: {x; T2(x nil)}
    c: EQ(node.type)
    c($var)     ? neq(nil v:scope.get(node.value)) ? v ; node ;
    c($def)     ? {;
                    {; eq(node.right.type $fun)
                    | eq(node.right.type $object)
                    | eq(node.right.type $array) }()
                    ? {;
                        //NOTE: to handle loopable functions,
                        //inline everything at define stage.
                        //XXX: mutations
                        scope.set(node.left.value node.right=T(node.right))
                        nil
                      }()
                    ; deblock(node T(node.right) scope)
                  }() ;
    c($access)  ? {;
                    {; eq(nil node.right) & node.static }()
                    ? {;
                        //there are unhandled cases here!
                        value:T(node.left)
                        eq(value.type $object) ? value.value.[node.mid.value] ;
                        n.Access(node.left T(node.mid) nil true)
                      }()
                    ; node
                  }() ;
    c($call)    ? {;
                    value: T(node.value)
                    c: EQ(value.type)
                    //calling a built in
                    c($var)   ? n.Call(value map(node.args T)) ;
                                //note: uniquify when inlining a call
                                //in case the same function is inlined twice.

                    c($fun)   ? funs.is_recursive(value node.value)
                                                        ? n.Call(node.value map(node.args T)) ;
                                eq(value.args.length 0) ? unique(T(value.body)) ;
                                unique(n.Block([
                                    n.Block(zip(value.args node.args {k v; T(n.Def(k v)) }))
                                    T(value.body)
                                  ])) ;

                    c($block) ? n.Block(
                                  //don't map each item because it was already inlined.
                                  map_i(value.body {v i;
                                    eq(i sub(value.body.length 1)) ? T(n.Call(v map(node.args T))) ; v
                                  })
                                ) ;
                                //fall through and just copy the call
                                nil
                  }() ;
                  nil    
  }))
}
