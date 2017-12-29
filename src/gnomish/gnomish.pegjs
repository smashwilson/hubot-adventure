// PEG grammer for the Gnomish language

{
  const {
    ExprListNode,
    IfNode, WhileNode, CallNode,
    IntNode, RealNode, StringNode, BlockNode, ArgNode, VarNode
  } = require('./ast')

  function leftAssoc (first, rest) {
    //
  }
}

// Expressions ////////////////////////////////////////////////////////////////////////////////////////////////////////

exprlist
  = first:expr rest:( _ ( ';' / '\n' ) _ each:expr _ { return each } )*
    { return new ExprListNode([first, ...rest]) }

// Lowest precedence: if, while
expr "expression"
  = if
  / while
  / e1

// ||. Left-associative
e1
  = first:e2 _ op:orlike _ arg:e1
  / e2

// &&. Left-associative
e2
  = e3 _ op:andlike _ arg:e2
  / e3

// +, -. Left-associative.
e3
  = e4 ( _ addlike _ e4 )+
  / e4

// *, /, %. Left-associative.
e4 "term"
  = e5 ( _ multlike _ e5 )+
  / e5

// ^. Right-associative.
e5 "factor"
  = e6 ( _ op:powlike _ arg:e5 )+
  / e6

// Highest precedence: foo.bar() or bar(). Left-associative.
e6
  = primary ( '.' methodcall )+
  / methodcall ( '.' methodcall )*
  / primary

primary "primary"
  = real
  / int
  / string
  / var
  / block
  / '(' expr ')'

while
  = 'while' _ condition:block _ 'do' _ action:block
    { return new WhileNode({condition, action}) }

if
  = 'if' _ condition:block _ 'then' _ thenb:block elseb:( _ 'else' _ e:block { return e } )?
    { return new IfNode({condition, thenb, elseb}) }

methodcall "method call"
  = identifier '(' ( expr ( _ ',' _ expr )* )? ')'

// Operators //////////////////////////////////////////////////////////////////////////////////////////////////////////

identifier
  = $ ( [a-zA-Z] [0-9a-zA-Z_]* )

powlike
  = $ ( identifier? '^' )

multlike
  = $ ( identifier? ( '*' / '/' / '%' ) )

addlike
  = $ ( identifier? ( '+' / '-' ) )

andlike
  = $ ( identifier? '&' )

orlike
  = $ ( identifier? '|' )

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

blockarg "block argument"
  = name:identifier type:(_ ':' _ t:expr { return t })? def:(_ '=' _ d:expr { return d })?
    { return new ArgNode({name, type, def}) }

// Whitespace /////////////////////////////////////////////////////////////////////////////////////////////////////////

_ "optional whitespace"
  = [ \t\r\n]*
