HT:       import("./hashtable.js")
a:        import("./arrays")
map: a.map zip:a.zip
uniquify: import("./uniquify")
funs:     import("./functions")
n:        import("./nodes")

/*
notes: I think this might come out cleaner if A) no mutations, such as in def.
       B) add loop node, and transform loopables to that.
       
       note: the reason I went with recursive only, was to make constant eval
       easier, because it meant we could avoid mutable vars.
       inlining a recursive loop is easier. hmm, or could I transform the loop into
       recursion when inlining constants?
*/

EQ: {x; {y; eq(x y) }}
last: {ary; ary.[sub(ary.length 1)]}
set_last: {ary value; ary.[sub(ary.length 1)] = value}

//if the inlined value is a block, set value to the last value note, that might also be a block.
update: {node value scope;
  c:EQ(node.type)
  //XXX: mutations
  c($def)   ? eq(value.type $fun) ? scope.set(node.left.value node.right = value) ; node.right = value ;
  //XXX: mutations
  c($call)  ? node.value = value ;
  //XXX: mutations
  c($set)   ? node.right = value ;
             crash("unknown node")
}

deblock: {node right scope;
  eq(right.type $block) ? {;
    //XXX: mutations
    set_last(right.body deblock(node last(right.body) scope))
    right
  }() ; {;
    update(node right scope)
    node
  }()
}

{node;
  scope: HT(nil)
  unique: uniquify(0)
  T: {node;
    c: EQ(node.type)
    c($var)  ? {; 
      neq(nil v:scope.get(node.value)) ? v ; node }();
    c($def)       ? {;
                      {; eq(node.right.type $fun) | eq(node.right.type $object) | eq(node.right.type $array) }()
                      ? {;
                          //NOTE: to handle loopable functions,
                          //inline everything at define stage.
                          //XXX: mutations
                          scope.set(node.left.value node.right=T(node.right))
                          node
                        }()
                      ; deblock(node T(node.right) scope)
                    }() ;
    
    c($set)       ? deblock(node T(node.right) scope) ;
    //XXX: mutations
    c($object)    ? {; object_each(node.value {_ k v; node.value.[k] = T(v) }) node}() ;
    c($array)     ? {type:$array value: map(node.value T)} ;
    c($access)    ? {; 
                      {; eq(nil node.right) & node.static }()
                      ? {;
                          //there are unhandled cases here!
                          value:T(node.left)
                          eq(value.type $object) ? value.value.[node.mid.value] ;
                          n.Access(node.left T(node.mid) nil true)
                        }()
                      ; node
                    }();
    c($call)      ? {;
                      value: T(node.value)
                      c: EQ(value.type)
                      c($var)  ? n.Call(value map(node.args T)) ;
                                      //note: uniquify when inlining a call
                                      //in case the same function is inlined twice.
                      c($fun)       ? 
                                        {; eq(node.value.type $var) &
                                            funs.is_recursive(value node.value) }() ? node ;
                                        eq(value.args.length 0) ? {;
                                          unique(T(value.body))
                                        }() ; {;
                                        print(unique(n.Block([
                                            n.Block(zip(value.args node.args {k v; T(n.Def(k v)) }))
                                            T(value.body)
                                          ])))
                                        }()
                                       ;
                      c($block)     ? {;
                                        set_last(value.body T(n.Call(last(value.body) node.args)))
                                        value
                                      }() ;
                                      crash("cannot inline call")
                    }() ;
    c($block)     ? n.Block(map(node.body T)) ;
    c($if)        ? n.If(T(node.left) T(node.mid) T(node.right));
    c($and)       ? n.And(T(node.left) T(node.right));
    c($or)        ? n.Or(T(node.left) T(node.right));
    c($fun)       ? n.Fun(node.args T(node.body)) ;
                    node
  }
  T(node)
}
