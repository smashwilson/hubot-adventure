// PEG grammer for the Gnomish language

{
  const {
    ExprListNode,
    IfNode, WhileNode, AssignNode, LetNode, CallNode,
    IntNode, RealNode, StringNode, BlockNode, ArgNode, VarNode, TypeNode
  } = require('./ast')

  function leftAssocCall (first, rest) {
    let call = {receiver: first, name: null, arg: null}
    for (const each of rest) {
      call.name = each.op
      call.args = [each.arg]
      const node = new CallNode(call)

      call = {receiver: node, name: null, arg: null}
    }
    return call.receiver
  }
}

// Expressions ////////////////////////////////////////////////////////////////////////////////////////////////////////

exprlist
  = exprsep? first:expr rest:( exprsep each:expr { return each } )* exprsep?
    { return new ExprListNode([first, ...rest]) }

// Non-associative
expr "expression"
  = if
  / while
  / let
  / assignment

// Lowest precedence: assignment. Right-associative.
assignment
  = name:identifier _ '=' !'=' _ value:expr
    { return new AssignNode({name, value}) }
  / opcomp

// "==", "<", ">". Non-associative.
opcomp "comparison operator application"
  = receiver:opor _ op:complike _ arg:opor
    { return new CallNode({receiver, name: op, args: [arg]}) }
  / opor

// "||". Left-associative.
opor "logical or operator application"
  = first:opand rest:( _ op:orlike _ arg:opand { return {op, arg} } )*
    { return leftAssocCall(first, rest) }

// "&&". Left-associative.
opand "logical and operator application"
  = first:opadd rest:( _ op:andlike _ arg:opadd { return {op, arg} } )*
    { return leftAssocCall(first, rest) }

// "+", "-". Left-associative.
opadd "addition-like operator application"
  = first:opmult rest:( _ op:addlike _ arg:opmult { return {op, arg} } )*
    { return leftAssocCall(first, rest) }

// "*", "/", "%". Left-associative.
opmult "multiplication-like operator application"
  = first:oppow rest:( _ op:multlike _ arg:oppow { return {op, arg} } )*
    { return leftAssocCall(first, rest) }

// "^". Right-associative.
oppow "exponentiation-like operator application"
  = receiver:methodcall _ op:powlike _ arg:oppow
    { return new CallNode({receiver, name: op, args: [arg]}) }
  / methodcall

// "<receiver>.method()" or "method()". Unary.
methodcall "method invocation"
  = receiver:atom '.' name:identifier args:methodargs
    { return new CallNode({receiver, name, args}) }
  / name:identifier args:methodargs
    { return new CallNode({receiver: new VarNode({name: 'this'}), name, args}) }
  / atom

atom "literal or parenthesized subexpression"
  = real
  / int
  / string
  / var
  / block
  / '(' expr ')'

if
  = 'if' _ condition:block _ 'then' _ thenb:block elseb:( _ 'else' _ e:block { return e } )?
    { return new IfNode({condition, thenb, elseb}) }

while
  = 'while' _ condition:block _ 'do' _ action:block
    { return new WhileNode({condition, action}) }

let
  = 'let' _ name:identifier type:( _ ':' _  t:typeexpr { return t } )? _ '=' _ value:expr
    { return new LetNode({name, type, value}) }

methodargs "method arguments"
  = '(' args:( first:expr rest:( _ ',' _ arg:expr { return arg } )* { return [first, ...rest] } )? ')'
    { return args }

// Identifiers ////////////////////////////////////////////////////////////////////////////////////////////////////////

identifier
  = $ ( [a-zA-Z'_] [0-9a-zA-Z'_]* )

opstem "operator stem"
  = [*/%+&|<>=^-]+

powlike "exponentiation operator"
  = $ ( '^' opstem? )

multlike "multiplicative operator"
  = $ ( ( '*' / '/' / '%' ) opstem? )

addlike "additive operator"
  = $ ( ( '+' / '-' ) opstem? )

andlike "logical and"
  = $ ( '&' opstem? )

// Note that a single "|" is reserved for block argument terminations
orlike "logical or"
  = $ ( '|' opstem )

// Note that a single "=" on its own is reserved for assignment and "let".
complike "comparison operator"
  = $ ( ( '<' / '>' ) opstem? / '=' opstem )

typeexpr "type expression"
  = name:identifier params:typeparams? attr:( '*' / '...' )?
    { return new TypeNode({name, params, attr}) }

typeparams "type parameters"
  = '(' _ first:typeexpr rest:( _ ',' _ param:typeexpr { return param } )* ')'
    { return [first, ...rest] }

// Literals ///////////////////////////////////////////////////////////////////////////////////////////////////////////

real
  = minus:'-'? whole:[0-9]+ '.' fraction:[0-9]+
    { return new RealNode({minus, whole, fraction}) }

int "integer"
  = minus:'-'? digits:[0-9]+
    { return new IntNode({minus, digits}) }

string
  = '"' chars:( '\\' char:. { return char } / [^"] )* '"'
    { return new StringNode({chars}) }

var
  = name:identifier
    { return new VarNode({name}) }

// Blocks

block
  = '{' _ args:blockargs? _ body:exprlist? _ '}'
    { return new BlockNode({args, body}) }

blockargs "block arguments"
  = first:blockarg rest:(_ ',' _ arg:blockarg { return arg } )* _ '|'
    { return [first, ...rest] }
  / '|'
    { return [] }

blockarg "block argument"
  = name:identifier type:(_ ':' _ t:typeexpr { return t })? repeatable:'*'? def:(_ '=' _ d:expr { return d })?
    { return new ArgNode({name, type, repeatable, def}) }

// Whitespace /////////////////////////////////////////////////////////////////////////////////////////////////////////

_ "optional whitespace"
  = [ \t]*

exprsep "expression separator"
  = ( _ comment? ( [\r\n] / ';' ) _ )+

comment
  = '#' [^\n]*
